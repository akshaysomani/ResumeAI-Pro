import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getProviderConfig, getAIStream } from "@/lib/ai-provider";
import { buildSalaryEstimationPrompt } from "@/lib/ai-prompts";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, location, industry, experience } = await req.json();
    if (!role) {
      return NextResponse.json({ error: "Missing job role" }, { status: 400 });
    }

    // Verify subscription status
    const subQuery = `
      SELECT status 
      FROM public.subscriptions 
      WHERE user_id = $1 AND status = 'active'
      LIMIT 1
    `;
    const { rows: subRows } = await db.query(subQuery, [user.id]);
    const plan = subRows.length > 0 ? "pro" : "free";

    let promptPayload = buildSalaryEstimationPrompt({
      role,
      location,
      industry,
      experience
    });

    if (plan === "free") {
      promptPayload.system = `You are a salary compensation analyst for Free accounts.
Your response MUST be strict JSON:
1. Provide estimated ranges representing general basic salary bands.
2. In the "trendData", list generic growth statistics.
3. For "negotiationTips", you MUST return EXACTLY: ["Upgrade to Pro to unlock premium compensation negotiation tips."]

You MUST return a valid JSON object matching this exact structure:
{
  "rangeMin": number,
  "rangeMax": number,
  "rangeMedian": number,
  "trendData": {
    "growthTrend": "Moderate market growth",
    "marketDemand": "medium",
    "benefits": ["Standard health insurance"]
  },
  "negotiationTips": ["Upgrade to Pro to unlock premium compensation negotiation tips."]
}
Return ONLY valid JSON. No markdown backticks, no comments, no leading/trailing explanations.`;
    }

    const providerConfig = getProviderConfig();
    const stream = await getAIStream(promptPayload, providerConfig, async (fullText) => {
      // Parse and save to public.salary_reports
      try {
        const parsed = JSON.parse(fullText);
        
        await db.query(
          `INSERT INTO public.salary_reports (user_id, role, experience, location, industry, range_min, range_max, range_median, trend_data, negotiation_tips, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
          [
            user.id,
            role,
            experience || "Mid-level",
            location || "Remote",
            industry || "Technology",
            parsed.rangeMin || 0,
            parsed.rangeMax || 0,
            parsed.rangeMedian || 0,
            JSON.stringify(parsed.trendData || {}),
            parsed.negotiationTips || []
          ]
        );
      } catch (dbErr) {
        console.error("Failed to parse and save salary estimate details:", dbErr);
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("Error in salary intelligence estimation route:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
