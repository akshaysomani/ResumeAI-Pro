import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getProviderConfig, getAIStream } from "@/lib/ai-provider";
import { buildCareerDocumentPrompt, PromptPayload } from "@/lib/ai-prompts";

async function getResumeContextText(resumeId: string): Promise<string> {
  let context = "";

  try {
    // 1. Personal Info
    const personalQuery = `SELECT * FROM public.personal_information WHERE resume_id = $1`;
    const { rows: personalRows } = await db.query(personalQuery, [resumeId]);
    if (personalRows.length > 0) {
      const p = personalRows[0];
      context += `Candidate Name: ${p.full_name || ""}\nEmail: ${p.email || ""}\nPhone: ${p.phone || ""}\nLocation: ${p.location || ""}\nLinks: ${p.linkedin_url ? `LinkedIn: ${p.linkedin_url}` : ""} ${p.github_url ? `GitHub: ${p.github_url}` : ""} ${p.website ? `Website: ${p.website}` : ""}\n\n`;
    }

    // 2. Experience
    const expQuery = `SELECT * FROM public.experience WHERE resume_id = $1 ORDER BY order_index ASC`;
    const { rows: expRows } = await db.query(expQuery, [resumeId]);
    if (expRows.length > 0) {
      context += `Professional Experience:\n`;
      expRows.forEach((e: any) => {
        context += `- Role: ${e.role} at ${e.company} (${e.duration || ""})\n  Details: ${e.description || ""}\n  Achievements: ${e.achievements || ""}\n`;
      });
      context += `\n`;
    }

    // 3. Education
    const eduQuery = `SELECT * FROM public.education WHERE resume_id = $1 ORDER BY order_index ASC`;
    const { rows: eduRows } = await db.query(eduQuery, [resumeId]);
    if (eduRows.length > 0) {
      context += `Education:\n`;
      eduRows.forEach((ed: any) => {
        context += `- Degree: ${ed.degree || ""} ${ed.major ? `in ${ed.major}` : ""} from ${ed.school} (${ed.duration || ""})\n  GPA: ${ed.gpa || ""}\n  Details: ${ed.description || ""}\n`;
      });
      context += `\n`;
    }

    // 4. Projects
    const projQuery = `SELECT * FROM public.projects WHERE resume_id = $1 ORDER BY order_index ASC`;
    const { rows: projRows } = await db.query(projQuery, [resumeId]);
    if (projRows.length > 0) {
      context += `Projects:\n`;
      projRows.forEach((pr: any) => {
        context += `- Title: ${pr.title} (Role: ${pr.role || ""})\n  Technologies: ${pr.technologies || ""}\n  Description: ${pr.description || ""}\n`;
      });
      context += `\n`;
    }

    // 5. Skills
    const skillsQuery = `SELECT * FROM public.skills WHERE resume_id = $1 ORDER BY order_index ASC`;
    const { rows: skillsRows } = await db.query(skillsQuery, [resumeId]);
    if (skillsRows.length > 0) {
      const skillList = skillsRows.map((s: any) => `${s.name}${s.proficiency ? ` (${s.proficiency})` : ""}`).join(", ");
      context += `Skills: ${skillList}\n\n`;
    }
  } catch (err) {
    console.error("Error building resume context text:", err);
  }

  return context;
}

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
    const { documentType, title, tone, length, resumeId, customFields } = body;

    if (!documentType || !title || !tone || !length) {
      return NextResponse.json(
        { error: "Missing required fields: documentType, title, tone, or length." },
        { status: 400 }
      );
    }

    // 3. Verify user subscription & daily limits (limit of 3 for free users)
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
        WHERE user_id = $1 
          AND generation_type = 'career_document'
          AND created_at >= date_trunc('day', timezone('UTC', now()))
      `;
      const { rows: countRows } = await db.query(countQuery, [user.id]);
      const dailyCount = parseInt(countRows[0].count, 10);

      if (dailyCount >= 50) {
        return NextResponse.json(
          { error: "Daily limit of 50 AI career documents reached. Upgrade to Pro for unlimited usage." },
          { status: 429 }
        );
      }
    }

    // 4. Resolve Resume Context if provided
    let resumeContext = "";
    if (resumeId) {
      resumeContext = await getResumeContextText(resumeId);
    }

    // 5. Build prompt payload
    const promptPayload = buildCareerDocumentPrompt({
      documentType,
      title,
      tone,
      length,
      resumeContext,
      customFields,
    });

    // 6. Fetch LLM configuration
    const providerConfig = getProviderConfig();
    if (!providerConfig.apiKey) {
      return NextResponse.json(
        { error: `AI provider "${providerConfig.provider}" API key is not configured on the server.` },
        { status: 500 }
      );
    }

    // 7. Get the streaming response
    const stream = await getAIStream(promptPayload, providerConfig, async (fullText) => {
      // Log generation on completion
      try {
        const promptLog = JSON.stringify({
          documentType,
          title,
          tone,
          length,
          resumeId,
          customFieldsCount: Object.keys(customFields || {}).length,
        });
        const approxTokens = Math.ceil((promptLog.length + fullText.length) / 4);

        await db.query(
          `INSERT INTO public.ai_generations 
            (user_id, resume_id, prompt, generated_text, generation_type, tokens_used, model_name)
           VALUES ($1, $2, $3, $4, 'career_document', $5, $6)`,
          [
            user.id,
            resumeId || null,
            promptLog,
            fullText,
            approxTokens,
            providerConfig.model,
          ]
        );
      } catch (dbErr) {
        console.error("Failed to log career document generation to db:", dbErr);
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
    console.error("Error in career document generation route:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
