import { db } from "./db";
import { dispatchWebhook } from "./webhook-dispatcher";

export interface TriggerPayload {
  userId: string;
  organizationId?: string | null;
  event: string;
  data: any; // Context data for the event
}

/**
 * Triggers evaluating and running all active automation rules matching an event.
 */
export async function triggerAutomation(params: TriggerPayload): Promise<void> {
  const { userId, organizationId, event, data } = params;

  try {
    // Find all active automation rules for this trigger event
    let query = `
      SELECT id, name, trigger_conditions, action_type, action_config 
      FROM public.automation_rules 
      WHERE is_active = TRUE 
        AND trigger_event = $1 
        AND (user_id = $2 ${organizationId ? "OR organization_id = $3" : ""})
    `;
    const queryParams = organizationId ? [event, userId, organizationId] : [event, userId];
    const res = await db.query(query, queryParams);

    const rules = res.rows;

    for (const rule of rules) {
      const match = evaluateConditions(rule.trigger_conditions, data);
      if (match) {
        // Execute rule asynchronously
        executeAutomationRule(rule.id, rule.name, rule.action_type, rule.action_config, userId, organizationId, data)
          .catch((err) => console.error(`Error executing automation rule ${rule.id}:`, err));
      }
    }
  } catch (error) {
    console.error("Error triggerAutomation:", error);
  }
}

/**
 * Helper to extract nested properties using dot notation (e.g. "resume.title" or "ats.score")
 */
function getNestedValue(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  return path.split(".").reduce((acc, part) => acc && acc[part], obj);
}

/**
 * Evaluates trigger conditions against trigger data.
 * Conditions schema example:
 * {
 *   "resume.title": { "operator": "contains", "expected": "Engineer" },
 *   "ats.score": { "operator": "gte", "expected": 75 }
 * }
 */
export function evaluateConditions(conditions: any, data: any): boolean {
  if (!conditions || typeof conditions !== "object" || Object.keys(conditions).length === 0) {
    return true; // No conditions means always match
  }

  for (const [key, cond] of Object.entries(conditions)) {
    const dataValue = getNestedValue(data, key);

    if (cond && typeof cond === "object" && "operator" in cond && "expected" in cond) {
      const { operator, expected } = cond as { operator: string; expected: any };

      switch (operator) {
        case "eq":
          if (dataValue !== expected) return false;
          break;
        case "ne":
          if (dataValue === expected) return false;
          break;
        case "gt":
          if (Number(dataValue) <= Number(expected)) return false;
          break;
        case "gte":
          if (Number(dataValue) < Number(expected)) return false;
          break;
        case "lt":
          if (Number(dataValue) >= Number(expected)) return false;
          break;
        case "lte":
          if (Number(dataValue) > Number(expected)) return false;
          break;
        case "contains":
          if (
            !dataValue ||
            !String(dataValue).toLowerCase().includes(String(expected).toLowerCase())
          ) {
            return false;
          }
          break;
        default:
          return false; // Unknown operator, fail closed
      }
    } else {
      // Direct equality check if no operator provided
      if (dataValue !== cond) return false;
    }
  }

  return true;
}

/**
 * Executes a single automation rule, creates execution logs, and performs actions.
 */
async function executeAutomationRule(
  ruleId: string,
  ruleName: string,
  actionType: string,
  actionConfig: any,
  userId: string,
  organizationId: string | null | undefined,
  triggerData: any
): Promise<void> {
  const startTime = Date.now();

  // Create execution record as pending
  const executionRes = await db.query(
    `INSERT INTO public.automation_executions (
      rule_id, trigger_data, status, action_result
     ) VALUES ($1, $2, 'pending', '{}'::JSONB) 
     RETURNING id`,
    [ruleId, JSON.stringify(triggerData)]
  );
  const executionId = executionRes.rows[0].id;

  try {
    let actionResult: any = {};

    switch (actionType) {
      case "webhook": {
        // Dispatch webhook
        const webhookEventName = actionConfig?.event_name || `automation.${ruleName.toLowerCase().replace(/\s+/g, "_")}`;
        await dispatchWebhook({
          userId,
          organizationId,
          eventType: webhookEventName,
          payload: {
            ruleId,
            ruleName,
            triggerData,
          },
        });
        actionResult = { message: `Webhook event '${webhookEventName}' dispatched.` };
        break;
      }

      case "notification": {
        // Insert an in-app notification
        const title = actionConfig?.title || `Automation: ${ruleName}`;
        const message = actionConfig?.message || "An automation rule has executed successfully.";

        // Replace placeholders in title and message with triggerData
        const formattedTitle = replacePlaceholders(title, triggerData);
        const formattedMessage = replacePlaceholders(message, triggerData);

        await db.query(
          `INSERT INTO public.notifications (
            user_id, title, message, read_status, type
           ) VALUES ($1, $2, $3, FALSE, 'info')`,
          [userId, formattedTitle, formattedMessage]
        );

        actionResult = { message: "In-app notification created.", title: formattedTitle };
        break;
      }

      case "log_only": {
        // Just log the event
        actionResult = { message: "Rule executed with log-only action.", timestamp: new Date().toISOString() };
        break;
      }

      default:
        throw new Error(`Unsupported action type: ${actionType}`);
    }

    const duration = Date.now() - startTime;

    // Update execution success
    await db.query(
      `UPDATE public.automation_executions 
       SET status = 'success', action_result = $1, duration_ms = $2 
       WHERE id = $3`,
      [JSON.stringify(actionResult), duration, executionId]
    );

    // Update rule stats
    await db.query(
      `UPDATE public.automation_rules 
       SET execution_count = execution_count + 1, last_executed_at = NOW(), updated_at = NOW() 
       WHERE id = $1`,
      [ruleId]
    );
  } catch (error: any) {
    const duration = Date.now() - startTime;
    const errorMessage = error?.message || String(error);

    await db.query(
      `UPDATE public.automation_executions 
       SET status = 'failed', error_message = $1, duration_ms = $2 
       WHERE id = $3`,
      [errorMessage, duration, executionId]
    );
  }
}

/**
 * Replaces placeholders in text like {{resume.title}} or {{ats.score}} with actual values.
 */
function replacePlaceholders(text: string, data: any): string {
  if (!text) return "";
  return text.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const val = getNestedValue(data, path.trim());
    return val !== undefined ? String(val) : match;
  });
}
