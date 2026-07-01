import { db } from "./db";
import { signWebhookPayload } from "./api-auth";

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: any;
}

/**
 * Dispatches a webhook event to all subscribed active endpoints for a user or organization.
 */
export async function dispatchWebhook(params: {
  userId: string;
  organizationId?: string | null;
  eventType: string;
  payload: any;
}): Promise<void> {
  const { userId, organizationId, eventType, payload } = params;

  try {
    // Find all active endpoints for user or organization that list this eventType or '*'
    const query = `
      SELECT id, url, signing_secret, events 
      FROM public.webhook_endpoints 
      WHERE is_active = TRUE 
        AND (user_id = $1 ${organizationId ? "OR organization_id = $2" : ""})
    `;
    const queryParams = organizationId ? [userId, organizationId] : [userId];
    const res = await db.query(query, queryParams);

    const endpoints = res.rows.filter(
      (row) => row.events.includes(eventType) || row.events.includes("*")
    );

    if (endpoints.length === 0) {
      return;
    }

    // Process each endpoint delivery asynchronously
    for (const endpoint of endpoints) {
      // Create a delivery record
      const deliveryIdRes = await db.query(
        `INSERT INTO public.webhook_deliveries (
          endpoint_id, event_type, payload, status, attempt_count, max_attempts
         ) VALUES ($1, $2, $3, 'pending', 0, 3) 
         RETURNING id`,
        [endpoint.id, eventType, JSON.stringify(payload)]
      );
      const deliveryId = deliveryIdRes.rows[0].id;

      // Start the delivery attempt
      attemptWebhookDelivery(deliveryId, endpoint.url, endpoint.signing_secret, eventType, payload)
        .catch((err) => console.error(`Error delivering webhook ${deliveryId}:`, err));
    }
  } catch (error) {
    console.error("Error searching webhook endpoints for dispatch:", error);
  }
}

/**
 * Attempts to deliver a webhook to a specific URL, signing the payload and logging the results.
 */
async function attemptWebhookDelivery(
  deliveryId: string,
  url: string,
  signingSecret: string,
  eventType: string,
  payload: any
): Promise<void> {
  const webhookBody: WebhookPayload = {
    event: eventType,
    timestamp: new Date().toISOString(),
    data: payload,
  };

  const payloadString = JSON.stringify(webhookBody);
  const signature = signWebhookPayload(payloadString, signingSecret);

  // Update attempt count in DB
  await db.query(
    `UPDATE public.webhook_deliveries 
     SET attempt_count = attempt_count + 1 
     WHERE id = $1`,
    [deliveryId]
  );

  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "ResumeAI-Pro-Webhook-Dispatcher/1.0",
        "X-ResumeAI-Event": eventType,
        "X-ResumeAI-Signature": signature,
        "X-ResumeAI-Delivery": deliveryId,
      },
      body: payloadString,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseText = await response.text();
    const responseCode = response.status;
    const isSuccess = responseCode >= 200 && responseCode < 300;

    if (isSuccess) {
      await db.query(
        `UPDATE public.webhook_deliveries 
         SET status = 'delivered', response_code = $1, response_body = $2, delivered_at = NOW() 
         WHERE id = $3`,
        [responseCode, responseText.substring(0, 2000), deliveryId]
      );

      // Reset endpoint failure count
      await db.query(
        `UPDATE public.webhook_endpoints 
         SET failure_count = 0, updated_at = NOW() 
         WHERE id = (SELECT endpoint_id FROM public.webhook_deliveries WHERE id = $1)`,
        [deliveryId]
      );
    } else {
      await handleFailedDelivery(deliveryId, responseCode, responseText);
    }
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    await handleFailedDelivery(deliveryId, null, errorMessage);
  }
}

/**
 * Handles recording a failed delivery, scheduling a retry if appropriate, and disabling endpoints on excessive failure.
 */
async function handleFailedDelivery(
  deliveryId: string,
  responseCode: number | null,
  responseBody: string
): Promise<void> {
  try {
    // Fetch details of delivery and endpoint
    const deliveryQuery = `
      SELECT d.attempt_count, d.max_attempts, d.endpoint_id, e.failure_count 
      FROM public.webhook_deliveries d
      JOIN public.webhook_endpoints e ON d.endpoint_id = e.id
      WHERE d.id = $1
    `;
    const res = await db.query(deliveryQuery, [deliveryId]);

    if (res.rows.length === 0) return;
    const { attempt_count, max_attempts, endpoint_id, failure_count } = res.rows[0];

    const canRetry = attempt_count < max_attempts;
    const nextRetryAt = canRetry
      ? new Date(Date.now() + 1000 * 60 * 15 * attempt_count) // 15m, 30m, etc.
      : null;

    const newStatus = canRetry ? "failed" : "failed_exhausted";

    await db.query(
      `UPDATE public.webhook_deliveries 
       SET status = $1, response_code = $2, response_body = $3, next_retry_at = $4 
       WHERE id = $5`,
      [newStatus, responseCode, responseBody.substring(0, 2000), nextRetryAt, deliveryId]
    );

    // Increment failure count on endpoint
    const newFailureCount = failure_count + 1;
    let isActive = true;

    // Auto-disable endpoint after 10 consecutive failures
    if (newFailureCount >= 10) {
      isActive = false;
      console.warn(`Webhook endpoint ${endpoint_id} auto-disabled due to excessive failures.`);
    }

    await db.query(
      `UPDATE public.webhook_endpoints 
       SET failure_count = $1, is_active = $2, updated_at = NOW() 
       WHERE id = $3`,
      [newFailureCount, isActive, endpoint_id]
    );
  } catch (err) {
    console.error("Error in handleFailedDelivery:", err);
  }
}

/**
 * Retries all pending/failed webhooks that are scheduled for retry.
 */
export async function retryFailedWebhooks(): Promise<number> {
  try {
    const query = `
      SELECT d.id, d.event_type, d.payload, e.url, e.signing_secret 
      FROM public.webhook_deliveries d
      JOIN public.webhook_endpoints e ON d.endpoint_id = e.id
      WHERE d.status = 'failed' 
        AND d.next_retry_at <= NOW()
        AND e.is_active = TRUE
    `;
    const res = await db.query(query);

    for (const row of res.rows) {
      attemptWebhookDelivery(row.id, row.url, row.signing_secret, row.event_type, row.payload)
        .catch((err) => console.error(`Error retrying webhook delivery ${row.id}:`, err));
    }

    return res.rows.length;
  } catch (error) {
    console.error("Error retrying failed webhooks:", error);
    return 0;
  }
}

/**
 * Dispatches a dummy/test event to verify client integration setup.
 */
export async function sendTestWebhook(endpointId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await db.query(
      `SELECT url, signing_secret, user_id FROM public.webhook_endpoints WHERE id = $1 LIMIT 1`,
      [endpointId]
    );

    if (res.rows.length === 0) {
      return { success: false, error: "Webhook endpoint not found." };
    }

    const { url, signing_secret } = res.rows[0];
    const testPayload = {
      ping: true,
      message: "Hello from ResumeAI Pro Webhooks!",
      testId: crypto.randomUUID(),
    };

    const deliveryIdRes = await db.query(
      `INSERT INTO public.webhook_deliveries (
        endpoint_id, event_type, payload, status, attempt_count, max_attempts
       ) VALUES ($1, 'ping', $2, 'pending', 0, 1) 
       RETURNING id`,
      [endpointId, JSON.stringify(testPayload)]
    );
    const deliveryId = deliveryIdRes.rows[0].id;

    await attemptWebhookDelivery(deliveryId, url, signing_secret, "ping", testPayload);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || String(error) };
  }
}
