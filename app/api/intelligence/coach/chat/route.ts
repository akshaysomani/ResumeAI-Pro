import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getProviderConfig, getAIStream } from "@/lib/ai-provider";
import { buildCareerCoachPrompt } from "@/lib/ai-prompts";

async function getResumeContextText(userId: string): Promise<string> {
  let context = "";
  try {
    // Select recently updated resume for the user
    const resQuery = `SELECT id FROM public.resumes WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1`;
    const { rows: resRows } = await db.query(resQuery, [userId]);
    if (resRows.length === 0) return "";

    const resumeId = resRows[0].id;
    const personalQuery = `SELECT * FROM public.personal_information WHERE resume_id = $1`;
    const { rows: personalRows } = await db.query(personalQuery, [resumeId]);
    if (personalRows.length > 0) {
      const p = personalRows[0];
      context += `Candidate Name: ${p.full_name || ""}\nHeadline: ${p.headline || ""}\nLocation: ${p.location || ""}\n\n`;
    }
    const expQuery = `SELECT * FROM public.experience WHERE resume_id = $1 ORDER BY order_index ASC`;
    const { rows: expRows } = await db.query(expQuery, [resumeId]);
    if (expRows.length > 0) {
      context += `Experience:\n`;
      expRows.forEach((e) => {
        context += `- Role: ${e.role} at ${e.company}. Details: ${e.description || ""}\n`;
      });
      context += `\n`;
    }
    const skillsQuery = `SELECT name FROM public.skills WHERE resume_id = $1 ORDER BY order_index ASC`;
    const { rows: skillsRows } = await db.query(skillsQuery, [resumeId]);
    if (skillsRows.length > 0) {
      context += `Skills: ${skillsRows.map((s) => s.name).join(", ")}\n\n`;
    }
  } catch (err) {
    console.error("Error gathering resume context for coach:", err);
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

    const { chatId, userMessage } = await req.json();
    if (!chatId || !userMessage) {
      return NextResponse.json({ error: "Missing chatId or userMessage" }, { status: 400 });
    }

    // Verify chat thread owner
    const chatQuery = `SELECT id FROM public.career_coach_chats WHERE id = $1 AND user_id = $2`;
    const { rows: chatRows } = await db.query(chatQuery, [chatId, user.id]);
    if (chatRows.length === 0) {
      return NextResponse.json({ error: "Chat thread not found" }, { status: 404 });
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

    // Enforce message limits for Free plan
    if (plan === "free") {
      const msgCountQuery = `
        SELECT COUNT(*) as count 
        FROM public.career_coach_messages 
        WHERE chat_id = $1 AND role = 'user'
      `;
      const { rows: msgCountRows } = await db.query(msgCountQuery, [chatId]);
      const userMessageCount = parseInt(msgCountRows[0].count, 10);
      
      if (userMessageCount >= 3) {
        return NextResponse.json({ 
          error: "Free plan is limited to 3 messages with the Career Coach. Upgrade to Pro for unlimited guidance." 
        }, { status: 403 });
      }
    }

    // Fetch conversation history (last 10 messages)
    const historyQuery = `
      SELECT role, content 
      FROM public.career_coach_messages 
      WHERE chat_id = $1 
      ORDER BY created_at ASC 
      LIMIT 10
    `;
    const { rows: historyRows } = await db.query(historyQuery, [chatId]);
    const chatHistoryText = historyRows
      .map((m) => `${m.role === "user" ? "Candidate" : "Coach"}: ${m.content}`)
      .join("\n");

    // Fetch candidate resume background context
    const resumeContext = await getResumeContextText(user.id);

    // Save the incoming user message first
    await db.query(
      `INSERT INTO public.career_coach_messages (chat_id, role, content, created_at)
       VALUES ($1, 'user', $2, NOW())`,
      [chatId, userMessage]
    );

    const payload = buildCareerCoachPrompt({
      userMessage,
      chatHistoryText,
      resumeContext
    });

    const providerConfig = getProviderConfig();
    const stream = await getAIStream(payload, providerConfig, async (fullText) => {
      // Save assistant message to the database on completion
      try {
        await db.query(
          `INSERT INTO public.career_coach_messages (chat_id, role, content, created_at)
           VALUES ($1, 'assistant', $2, NOW())`,
          [chatId, fullText]
        );
        // Touch chat updated_at
        await db.query(
          "UPDATE public.career_coach_chats SET updated_at = NOW() WHERE id = $1", 
          [chatId]
        );
      } catch (dbErr) {
        console.error("Failed to persist coach reply:", dbErr);
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
    console.error("Error in coach chat route:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
