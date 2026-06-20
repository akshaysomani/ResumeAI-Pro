import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getProviderConfig, getAIStream } from "@/lib/ai-provider";
import { buildAnswerEvaluationPrompt } from "@/lib/ai-prompts";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { questionId, userAnswer } = await req.json();
    if (!questionId || userAnswer === undefined) {
      return NextResponse.json({ error: "Missing questionId or userAnswer" }, { status: 400 });
    }

    // Fetch the question and ensure the user owns the related session
    const qQuery = `
      SELECT q.*, s.job_role, s.experience_level, s.interview_type, s.user_id 
      FROM public.interview_questions q
      JOIN public.interview_sessions s ON q.session_id = s.id
      WHERE q.id = $1
    `;
    const { rows: qRows } = await db.query(qQuery, [questionId]);
    if (qRows.length === 0) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const qInfo = qRows[0];
    if (qInfo.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized access to session" }, { status: 403 });
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

    // Setup prompts
    let promptPayload = buildAnswerEvaluationPrompt({
      questionText: qInfo.question_text,
      userAnswer,
      category: qInfo.interview_type,
      jobRole: qInfo.job_role,
      experienceLevel: qInfo.experience_level
    });

    if (plan === "free") {
      // Override system instruction for free plan to restrict advanced feedback categories
      promptPayload.system = `You are a basic AI Interview Evaluation Coach.
Evaluate the candidate's answer and return a JSON scorecard.
For Free accounts, you are restricted:
1. Provide overallScore, clarityScore, relevanceScore, and technicalScore.
2. Provide generalFeedback, strengths, and weaknesses.
3. You MUST set "betterAnswer" to "Upgrade to Pro to view suggested high-scoring answers."
4. You MUST set "starEvaluation" situation, task, action, and result keys to "Upgrade to Pro to unlock STAR method analysis."
5. You MUST set "missedPoints" to an empty array.

You MUST return a valid JSON object matching this exact structure:
{
  "overallScore": number,
  "clarityScore": number,
  "confidenceScore": number,
  "relevanceScore": number,
  "technicalScore": number,
  "starEvaluation": {
    "situation": "Upgrade to Pro to unlock STAR method analysis.",
    "task": "Upgrade to Pro to unlock STAR method analysis.",
    "action": "Upgrade to Pro to unlock STAR method analysis.",
    "result": "Upgrade to Pro to unlock STAR method analysis."
  },
  "generalFeedback": "string feedback",
  "strengths": "string strengths",
  "weaknesses": "string weaknesses",
  "missedPoints": [],
  "suggestedImprovement": "Upgrade to Pro to unlock suggested improvements.",
  "betterAnswer": "Upgrade to Pro to view suggested high-scoring answers."
}
Return ONLY valid JSON. No markdown backticks, no comments, no leading/trailing explanations.`;
    }

    const providerConfig = getProviderConfig();
    const stream = await getAIStream(promptPayload, providerConfig, async (fullText) => {
      // Persist the evaluation results to the database
      try {
        const parsed = JSON.parse(fullText);
        
        await db.query(
          `UPDATE public.interview_questions 
           SET user_answer = $1,
               overall_score = $2,
               clarity_score = $3,
               confidence_score = $4,
               relevance_score = $5,
               technical_score = $6,
               star_evaluation = $7,
               general_feedback = $8,
               strengths = $9,
               weaknesses = $10,
               missed_points = $11,
               suggested_improvement = $12,
               better_answer = $13,
               evaluated_at = NOW()
           WHERE id = $14`,
          [
            userAnswer,
            parsed.overallScore || 0,
            parsed.clarityScore || 0,
            parsed.confidenceScore || 0,
            parsed.relevanceScore || 0,
            parsed.technicalScore || 0,
            JSON.stringify(parsed.starEvaluation || {}),
            parsed.generalFeedback || "",
            parsed.strengths || "",
            parsed.weaknesses || "",
            parsed.missedPoints || [],
            parsed.suggestedImprovement || "",
            parsed.betterAnswer || "",
            questionId
          ]
        );
      } catch (dbErr) {
        console.error("Failed to persist answer evaluation:", dbErr);
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
    console.error("Error in mock interview answer evaluation route:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
