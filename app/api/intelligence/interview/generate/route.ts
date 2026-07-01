import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getProviderConfig, getAIStream } from "@/lib/ai-provider";
import { buildMockInterviewQuestionPrompt } from "@/lib/ai-prompts";

async function getResumeContextText(resumeId: string): Promise<string> {
  let context = "";
  try {
    // Personal Info
    const personalQuery = `SELECT * FROM public.personal_information WHERE resume_id = $1`;
    const { rows: personalRows } = await db.query(personalQuery, [resumeId]);
    if (personalRows.length > 0) {
      const p = personalRows[0];
      context += `Candidate Name: ${p.full_name || ""}\nEmail: ${p.email || ""}\nPhone: ${p.phone || ""}\nLocation: ${p.location || ""}\nLinks: ${p.linkedin_url ? `LinkedIn: ${p.linkedin_url}` : ""} ${p.github_url ? `GitHub: ${p.github_url}` : ""} ${p.website ? `Website: ${p.website}` : ""}\n\n`;
    }
    // Experience
    const expQuery = `SELECT * FROM public.experience WHERE resume_id = $1 ORDER BY order_index ASC`;
    const { rows: expRows } = await db.query(expQuery, [resumeId]);
    if (expRows.length > 0) {
      context += `Professional Experience:\n`;
      expRows.forEach((e: any) => {
        context += `- Role: ${e.role} at ${e.company} (${e.duration || ""})\n  Details: ${e.description || ""}\n  Achievements: ${e.achievements || ""}\n`;
      });
      context += `\n`;
    }
    // Education
    const eduQuery = `SELECT * FROM public.education WHERE resume_id = $1 ORDER BY order_index ASC`;
    const { rows: eduRows } = await db.query(eduQuery, [resumeId]);
    if (eduRows.length > 0) {
      context += `Education:\n`;
      eduRows.forEach((ed: any) => {
        context += `- Degree: ${ed.degree || ""} ${ed.major ? `in ${ed.major}` : ""} from ${ed.school} (${ed.duration || ""})\n  GPA: ${ed.gpa || ""}\n  Details: ${ed.description || ""}\n`;
      });
      context += `\n`;
    }
    // Projects
    const projQuery = `SELECT * FROM public.projects WHERE resume_id = $1 ORDER BY order_index ASC`;
    const { rows: projRows } = await db.query(projQuery, [resumeId]);
    if (projRows.length > 0) {
      context += `Projects:\n`;
      projRows.forEach((pr: any) => {
        context += `- Title: ${pr.title} (Role: ${pr.role || ""})\n  Technologies: ${pr.technologies || ""}\n  Description: ${pr.description || ""}\n`;
      });
      context += `\n`;
    }
    // Skills
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
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await req.json();
    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    // Check session details and owner
    const sessionQuery = `SELECT * FROM public.interview_sessions WHERE id = $1 AND user_id = $2`;
    const { rows: sessionRows } = await db.query(sessionQuery, [sessionId, user.id]);
    if (sessionRows.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    const session = sessionRows[0];

    // Check Plan Limits
    const subQuery = `
      SELECT status 
      FROM public.subscriptions 
      WHERE user_id = $1 AND status = 'active'
      LIMIT 1
    `;
    const { rows: subRows } = await db.query(subQuery, [user.id]);
    const plan = subRows.length > 0 ? "pro" : "free";

    // Enforce limits for free plan
    if (plan === "free") {
      // Free users limit of 10 sessions total
      const totalSessionsQuery = `SELECT COUNT(*) as count FROM public.interview_sessions WHERE user_id = $1`;
      const { rows: totalSessionsRows } = await db.query(totalSessionsQuery, [user.id]);
      const sessionCount = parseInt(totalSessionsRows[0].count, 10);
      if (sessionCount > 10) {
        return NextResponse.json({ error: "Free plan is limited to 10 mock interview sessions. Upgrade to Pro for unlimited sessions." }, { status: 403 });
      }

      // Free users limit of 5 questions per session
      const qCountQuery = `SELECT COUNT(*) as count FROM public.interview_questions WHERE session_id = $1`;
      const { rows: qCountRows } = await db.query(qCountQuery, [sessionId]);
      const questionsCount = parseInt(qCountRows[0].count, 10);
      if (questionsCount >= 5) {
        return NextResponse.json({ error: "Free plan is limited to 5 questions per interview session. Upgrade to Pro for unlimited questions." }, { status: 403 });
      }
    }

    // Fetch existing questions to avoid duplication
    const prevQQuery = `SELECT question_text FROM public.interview_questions WHERE session_id = $1 ORDER BY created_at ASC`;
    const { rows: prevQRows } = await db.query(prevQQuery, [sessionId]);
    const currentQuestionsText = prevQRows.map((q: any, idx: number) => `Q${idx+1}: ${q.question_text}`).join("\n");

    let resumeContext = "";
    if (session.resume_id) {
      resumeContext = await getResumeContextText(session.resume_id);
    }

    const payload = buildMockInterviewQuestionPrompt({
      jobRole: session.job_role,
      company: session.target_company,
      experienceLevel: session.experience_level,
      difficulty: session.difficulty,
      interviewType: session.interview_type,
      resumeContext,
      currentQuestionsText
    });

    // Pre-insert a pending question row to acquire its database ID synchronously before returning the stream
    const insertRes = await db.query(
      `INSERT INTO public.interview_questions (session_id, question_text, category, created_at)
       VALUES ($1, 'AI is crafting question...', $2, NOW())
       RETURNING id`,
      [sessionId, session.interview_type]
    );
    const newQuestionId = insertRes.rows[0].id;

    const providerConfig = getProviderConfig();
    const stream = await getAIStream(payload, providerConfig, async (fullText) => {
      // Update the question text on completion
      try {
        await db.query(
          `UPDATE public.interview_questions 
           SET question_text = $1 
           WHERE id = $2`,
          [fullText, newQuestionId]
        );
      } catch (dbErr) {
        console.error("Failed to update generated interview question:", dbErr);
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Question-Id": newQuestionId.toString(),
      },
    });
  } catch (error: any) {
    console.error("Error in mock interview generation route:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
