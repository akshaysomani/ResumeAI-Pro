import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getProviderConfig, getAIStream } from "@/lib/ai-provider";
import {
  buildSummaryPrompt,
  buildExperiencePrompt,
  buildProjectPrompt,
  buildSkillsPrompt,
  buildRewritePrompt,
  buildGenericPrompt,
  PromptPayload,
} from "@/lib/ai-prompts";

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse request body
    const body = await req.json();
    const { sectionType, payload, resumeId } = body;

    if (!sectionType || !payload) {
      return NextResponse.json(
        { error: "Missing required fields: sectionType and payload." },
        { status: 400 }
      );
    }

    // 3. Verify user subscription & daily limits
    const subQuery = `
      SELECT status 
      FROM public.subscriptions 
      WHERE user_id = $1 AND status = 'active'
      LIMIT 1
    `;
    const { rows: subRows } = await db.query(subQuery, [user.id]);
    const plan = subRows.length > 0 ? "pro" : "free";

    if (plan === "free") {
      const countQuery = `
        SELECT COUNT(*) as count 
        FROM public.ai_generations 
        WHERE user_id = $1 AND created_at >= date_trunc('day', timezone('UTC', now()))
      `;
      const { rows: countRows } = await db.query(countQuery, [user.id]);
      const dailyCount = parseInt(countRows[0].count, 10);

      if (dailyCount >= 5) {
        return NextResponse.json(
          { error: "Daily limit of 5 AI generations reached. Upgrade to Pro for unlimited usage." },
          { status: 429 }
        );
      }
    }

    // 4. Build prompt payload based on sectionType
    let promptPayload: PromptPayload;
    try {
      switch (sectionType) {
        case "summary":
          promptPayload = buildSummaryPrompt(payload);
          break;
        case "experience":
          promptPayload = buildExperiencePrompt(payload);
          break;
        case "project":
          promptPayload = buildProjectPrompt(payload);
          break;
        case "skills":
          promptPayload = buildSkillsPrompt(payload);
          break;
        case "rewrite":
          promptPayload = buildRewritePrompt(payload);
          break;
        case "generic":
          promptPayload = buildGenericPrompt(payload);
          break;
        default:
          return NextResponse.json(
            { error: `Unsupported sectionType: ${sectionType}` },
            { status: 400 }
          );
      }
    } catch (err: any) {
      return NextResponse.json(
        { error: `Failed to construct prompt payload: ${err.message}` },
        { status: 400 }
      );
    }

    // 5. Fetch LLM configuration
    const providerConfig = getProviderConfig();
    if (!providerConfig.apiKey) {
      return NextResponse.json(
        { error: `AI provider "${providerConfig.provider}" API key is not configured on the server.` },
        { status: 500 }
      );
    }

    // 6. Get the streaming response
    const stream = await getAIStream(promptPayload, providerConfig, async (fullText) => {
      // Async database logger on stream complete
      try {
        const promptLog = typeof payload === "string" ? payload : JSON.stringify(payload);
        const approxTokens = Math.ceil((promptLog.length + fullText.length) / 4);

        await db.query(
          `INSERT INTO public.ai_generations 
            (user_id, resume_id, prompt, generated_text, generation_type, tokens_used, model_name)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            user.id,
            resumeId || null,
            promptLog,
            fullText,
            sectionType,
            approxTokens,
            providerConfig.model,
          ]
        );
      } catch (dbErr) {
        console.error("Failed to log AI generation to db:", dbErr);
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("Error in AI generation route:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
