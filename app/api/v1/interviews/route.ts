import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withApiAuth } from "@/lib/api-auth";
import { triggerAutomation } from "@/lib/automation-engine";

export async function GET(req: NextRequest) {
  return withApiAuth(req, "read:interviews", async (userId) => {
    try {
      const res = await db.query(
        `SELECT id, user_id as "userId", resume_id as "resumeId", job_role as "jobRole", 
                target_company as "targetCompany", experience_level as "experienceLevel", 
                difficulty, interview_type as "interviewType", interview_mode as "interviewMode", 
                duration, question_count as "questionCount", overall_score as "overallScore", 
                general_feedback as "generalFeedback", strengths, weaknesses, status, 
                created_at as "createdAt", updated_at as "updatedAt"
         FROM public.interview_sessions 
         WHERE user_id = $1 
         ORDER BY updated_at DESC`,
        [userId]
      );
      return NextResponse.json({ data: res.rows });
    } catch (error: any) {
      console.error("GET /api/v1/interviews error:", error);
      return NextResponse.json({ error: "Failed to fetch interview sessions" }, { status: 500 });
    }
  });
}

export async function POST(req: NextRequest) {
  return withApiAuth(req, "write:interviews", async (userId) => {
    try {
      const body = await req.json();
      const {
        resumeId = null,
        jobRole,
        targetCompany = "",
        experienceLevel = "intermediate",
        difficulty = "intermediate",
        interviewType = "technical",
        interviewMode = "practice",
        duration = 30,
        questionCount = 5,
      } = body;

      if (!jobRole) {
        return NextResponse.json({ error: "Missing required field: jobRole" }, { status: 400 });
      }

      const res = await db.query(
        `INSERT INTO public.interview_sessions (
          user_id, resume_id, job_role, target_company, experience_level, 
          difficulty, interview_type, interview_mode, duration, question_count, status
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'in_progress') 
         RETURNING id, user_id as "userId", resume_id as "resumeId", job_role as "jobRole", 
                   target_company as "targetCompany", experience_level as "experienceLevel", 
                   difficulty, interview_type as "interviewType", interview_mode as "interviewMode", 
                   duration, question_count as "questionCount", overall_score as "overallScore", 
                   general_feedback as "generalFeedback", status, created_at as "createdAt"`,
        [
          userId,
          resumeId,
          jobRole,
          targetCompany,
          experienceLevel,
          difficulty,
          interviewType,
          interviewMode,
          duration,
          questionCount,
        ]
      );

      const session = res.rows[0];

      // Fire automation trigger
      triggerAutomation({
        userId,
        event: "interview.started",
        data: {
          session,
        },
      }).catch((e) => console.error("Automation trigger error:", e));

      return NextResponse.json({ data: session }, { status: 201 });
    } catch (error: any) {
      console.error("POST /api/v1/interviews error:", error);
      return NextResponse.json({ error: "Failed to create interview session" }, { status: 500 });
    }
  });
}
