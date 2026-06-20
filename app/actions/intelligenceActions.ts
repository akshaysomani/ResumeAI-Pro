"use server";

import { db } from "@/lib/db";
import type { 
  InterviewSession, 
  InterviewQuestion, 
  CareerGoal, 
  CareerRoadmap, 
  SalaryReport, 
  LearningPlan, 
  CoachChat, 
  CoachMessage 
} from "@/types";

// Helper to check user plan status
export async function getUserPlan(userId: string): Promise<"free" | "pro"> {
  try {
    const query = `
      SELECT status 
      FROM public.subscriptions 
      WHERE user_id = $1 AND status = 'active'
      LIMIT 1
    `;
    const { rows } = await db.query(query, [userId]);
    return rows.length > 0 ? "pro" : "free";
  } catch (error) {
    console.error("Error checking plan status:", error);
    return "free";
  }
}

// ---------------------------------------------------------
// 1. MOCK INTERVIEW ACTIONS
// ---------------------------------------------------------

export async function createInterviewSessionAction(data: {
  userId: string;
  resumeId?: string | null;
  jobRole: string;
  targetCompany?: string;
  experienceLevel: string;
  difficulty: string;
  interviewType: string;
  interviewMode: string;
  duration: number;
  questionCount: number;
  preferredLanguage: string;
}): Promise<InterviewSession> {
  const query = `
    INSERT INTO public.interview_sessions (
      user_id, resume_id, job_role, target_company, experience_level,
      difficulty, interview_type, interview_mode, duration, question_count,
      preferred_language, status, created_at, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'draft', NOW(), NOW())
    RETURNING *
  `;
  
  const values = [
    data.userId,
    data.resumeId || null,
    data.jobRole,
    data.targetCompany || null,
    data.experienceLevel,
    data.difficulty,
    data.interviewType,
    data.interviewMode,
    data.duration,
    data.questionCount,
    data.preferredLanguage
  ];

  const { rows } = await db.query(query, values);
  const s = rows[0];

  return {
    id: s.id,
    userId: s.user_id,
    resumeId: s.resume_id,
    jobRole: s.job_role,
    targetCompany: s.target_company || "",
    experienceLevel: s.experience_level,
    difficulty: s.difficulty,
    interviewType: s.interview_type,
    interviewMode: s.interview_mode,
    duration: s.duration,
    questionCount: s.question_count,
    preferredLanguage: s.preferred_language,
    overallScore: s.overall_score,
    status: s.status,
    strengths: s.strengths || [],
    weaknesses: s.weaknesses || [],
    suggestedImprovements: s.suggested_improvements || [],
    createdAt: s.created_at,
    updatedAt: s.updated_at
  };
}

export async function getInterviewSessionAction(
  sessionId: string, 
  userId: string
): Promise<{ session: InterviewSession; questions: InterviewQuestion[] } | null> {
  const sessionQuery = `
    SELECT * FROM public.interview_sessions 
    WHERE id = $1 AND user_id = $2
  `;
  const { rows: sessionRows } = await db.query(sessionQuery, [sessionId, userId]);
  if (sessionRows.length === 0) return null;
  const s = sessionRows[0];

  const questionsQuery = `
    SELECT * FROM public.interview_questions 
    WHERE session_id = $1 
    ORDER BY created_at ASC
  `;
  const { rows: questionRows } = await db.query(questionsQuery, [sessionId]);

  const questions = questionRows.map((q) => ({
    id: q.id,
    sessionId: q.session_id,
    questionText: q.question_text,
    category: q.category,
    userAnswer: q.user_answer,
    overallScore: q.overall_score,
    clarityScore: q.clarity_score,
    confidenceScore: q.confidence_score,
    relevanceScore: q.relevance_score,
    technicalScore: q.technical_score,
    starEvaluation: q.star_evaluation,
    generalFeedback: q.general_feedback,
    strengths: q.strengths,
    weaknesses: q.weaknesses,
    missedPoints: q.missed_points || [],
    suggestedImprovement: q.suggested_improvement,
    betterAnswer: q.better_answer,
    createdAt: q.created_at,
    evaluatedAt: q.evaluated_at
  }));

  const session: InterviewSession = {
    id: s.id,
    userId: s.user_id,
    resumeId: s.resume_id,
    jobRole: s.job_role,
    targetCompany: s.target_company || "",
    experienceLevel: s.experience_level,
    difficulty: s.difficulty,
    interviewType: s.interview_type,
    interviewMode: s.interview_mode,
    duration: s.duration,
    questionCount: s.question_count,
    preferredLanguage: s.preferred_language,
    overallScore: s.overall_score,
    communicationScore: s.communication_score,
    technicalScore: s.technical_score,
    confidenceScore: s.confidence_score,
    leadershipScore: s.leadership_score,
    problemSolvingScore: s.problem_solving_score,
    cultureFitScore: s.culture_fit_score,
    roleReadinessScore: s.role_readiness_score,
    generalFeedback: s.general_feedback,
    strengths: s.strengths || [],
    weaknesses: s.weaknesses || [],
    suggestedImprovements: s.suggested_improvements || [],
    status: s.status,
    createdAt: s.created_at,
    updatedAt: s.updated_at
  };

  return { session, questions };
}

export async function getInterviewHistoryAction(userId: string): Promise<InterviewSession[]> {
  const query = `
    SELECT * FROM public.interview_sessions 
    WHERE user_id = $1 
    ORDER BY created_at DESC
  `;
  const { rows } = await db.query(query, [userId]);
  return rows.map((s) => ({
    id: s.id,
    userId: s.user_id,
    resumeId: s.resume_id,
    jobRole: s.job_role,
    targetCompany: s.target_company || "",
    experienceLevel: s.experience_level,
    difficulty: s.difficulty,
    interviewType: s.interview_type,
    interviewMode: s.interview_mode,
    duration: s.duration,
    questionCount: s.question_count,
    preferredLanguage: s.preferred_language,
    overallScore: s.overall_score,
    communicationScore: s.communication_score,
    technicalScore: s.technical_score,
    confidenceScore: s.confidence_score,
    leadershipScore: s.leadership_score,
    problemSolvingScore: s.problem_solving_score,
    cultureFitScore: s.culture_fit_score,
    roleReadinessScore: s.role_readiness_score,
    generalFeedback: s.general_feedback,
    strengths: s.strengths || [],
    weaknesses: s.weaknesses || [],
    suggestedImprovements: s.suggested_improvements || [],
    status: s.status,
    createdAt: s.created_at,
    updatedAt: s.updated_at
  }));
}

export async function addQuestionToSessionAction(
  sessionId: string,
  questionText: string,
  category: string
): Promise<InterviewQuestion> {
  const query = `
    INSERT INTO public.interview_questions (session_id, question_text, category, created_at)
    VALUES ($1, $2, $3, NOW())
    RETURNING *
  `;
  const { rows } = await db.query(query, [sessionId, questionText, category]);
  const q = rows[0];
  return {
    id: q.id,
    sessionId: q.session_id,
    questionText: q.question_text,
    category: q.category,
    missedPoints: [],
    createdAt: q.created_at
  };
}

export async function saveQuestionAnswerAction(
  questionId: string,
  userAnswer: string,
  evaluation: {
    overallScore: number;
    clarityScore: number;
    confidenceScore: number;
    relevanceScore: number;
    technicalScore: number;
    starEvaluation: any;
    generalFeedback: string;
    strengths: string;
    weaknesses: string;
    missedPoints: string[];
    suggestedImprovement: string;
    betterAnswer: string;
  }
): Promise<void> {
  const query = `
    UPDATE public.interview_questions 
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
    WHERE id = $14
  `;
  const values = [
    userAnswer,
    evaluation.overallScore,
    evaluation.clarityScore,
    evaluation.confidenceScore,
    evaluation.relevanceScore,
    evaluation.technicalScore,
    JSON.stringify(evaluation.starEvaluation || {}),
    evaluation.generalFeedback,
    evaluation.strengths,
    evaluation.weaknesses,
    evaluation.missedPoints,
    evaluation.suggestedImprovement,
    evaluation.betterAnswer,
    questionId
  ];
  await db.query(query, values);
}

export async function completeInterviewSessionAction(
  sessionId: string,
  userId: string,
  data: {
    overallScore: number;
    communicationScore: number;
    technicalScore: number;
    confidenceScore: number;
    leadershipScore: number;
    problemSolvingScore: number;
    cultureFitScore: number;
    roleReadinessScore: number;
    generalFeedback: string;
    strengths: string[];
    weaknesses: string[];
    suggestedImprovements: string[];
  }
): Promise<void> {
  const query = `
    UPDATE public.interview_sessions 
    SET status = 'completed',
        overall_score = $1,
        communication_score = $2,
        technical_score = $3,
        confidence_score = $4,
        leadership_score = $5,
        problem_solving_score = $6,
        culture_fit_score = $7,
        role_readiness_score = $8,
        general_feedback = $9,
        strengths = $10,
        weaknesses = $11,
        suggested_improvements = $12,
        updated_at = NOW()
    WHERE id = $13 AND user_id = $14
  `;
  const values = [
    data.overallScore,
    data.communicationScore,
    data.technicalScore,
    data.confidenceScore,
    data.leadershipScore,
    data.problemSolvingScore,
    data.cultureFitScore,
    data.roleReadinessScore,
    data.generalFeedback,
    data.strengths,
    data.weaknesses,
    data.suggestedImprovements,
    sessionId,
    userId
  ];
  await db.query(query, values);
}

// ---------------------------------------------------------
// 2. CAREER GOALS ACTIONS
// ---------------------------------------------------------

export async function getGoalsAction(userId: string): Promise<CareerGoal[]> {
  const query = `
    SELECT * FROM public.career_goals 
    WHERE user_id = $1 
    ORDER BY created_at DESC
  `;
  const { rows } = await db.query(query, [userId]);
  return rows.map((g) => ({
    id: g.id,
    userId: g.user_id,
    title: g.title,
    description: g.description,
    targetDate: g.target_date,
    status: g.status as "active" | "completed" | "archived",
    progress: g.progress,
    milestones: g.milestones || [],
    aiSuggestions: g.ai_suggestions || [],
    createdAt: g.created_at,
    updatedAt: g.updated_at
  }));
}

export async function createGoalAction(
  userId: string,
  data: { title: string; description?: string; targetDate?: string }
): Promise<CareerGoal> {
  const query = `
    INSERT INTO public.career_goals (user_id, title, description, target_date, status, progress, milestones, created_at, updated_at)
    VALUES ($1, $2, $3, $4, 'active', 0, '[]'::jsonb, NOW(), NOW())
    RETURNING *
  `;
  const values = [userId, data.title, data.description || null, data.targetDate || null];
  const { rows } = await db.query(query, values);
  const g = rows[0];
  return {
    id: g.id,
    userId: g.user_id,
    title: g.title,
    description: g.description,
    targetDate: g.target_date,
    status: g.status as "active" | "completed" | "archived",
    progress: g.progress,
    milestones: g.milestones || [],
    aiSuggestions: g.ai_suggestions || [],
    createdAt: g.created_at,
    updatedAt: g.updated_at
  };
}

export async function updateGoalAction(
  goalId: string,
  userId: string,
  updates: Partial<CareerGoal>
): Promise<void> {
  const query = `
    UPDATE public.career_goals 
    SET title = COALESCE($1, title),
        description = COALESCE($2, description),
        target_date = COALESCE($3, target_date),
        status = COALESCE($4, status),
        progress = COALESCE($5, progress),
        milestones = COALESCE($6, milestones),
        ai_suggestions = COALESCE($7, ai_suggestions),
        updated_at = NOW()
    WHERE id = $8 AND user_id = $9
  `;
  const values = [
    updates.title || null,
    updates.description || null,
    updates.targetDate || null,
    updates.status || null,
    updates.progress !== undefined ? updates.progress : null,
    updates.milestones ? JSON.stringify(updates.milestones) : null,
    updates.aiSuggestions || null,
    goalId,
    userId
  ];
  await db.query(query, values);
}

export async function deleteGoalAction(goalId: string, userId: string): Promise<void> {
  const query = `DELETE FROM public.career_goals WHERE id = $1 AND user_id = $2`;
  await db.query(query, [goalId, userId]);
}

// ---------------------------------------------------------
// 3. ROADMAP ACTIONS
// ---------------------------------------------------------

export async function getRoadmapsAction(userId: string): Promise<CareerRoadmap[]> {
  const query = `
    SELECT * FROM public.career_roadmaps 
    WHERE user_id = $1 
    ORDER BY created_at DESC
  `;
  const { rows } = await db.query(query, [userId]);
  return rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    currentSkills: r.current_skills || [],
    goal: r.goal,
    timeline: r.timeline,
    budget: r.budget,
    roadmapData: r.roadmap_data,
    createdAt: r.created_at
  }));
}

export async function saveRoadmapAction(
  userId: string,
  data: {
    currentSkills: string[];
    goal: string;
    timeline: string;
    budget: string;
    roadmapData: any;
  }
): Promise<CareerRoadmap> {
  const query = `
    INSERT INTO public.career_roadmaps (user_id, current_skills, goal, timeline, budget, roadmap_data, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, NOW())
    RETURNING *
  `;
  const values = [
    userId,
    data.currentSkills,
    data.goal,
    data.timeline,
    data.budget,
    JSON.stringify(data.roadmapData)
  ];
  const { rows } = await db.query(query, values);
  const r = rows[0];
  return {
    id: r.id,
    userId: r.user_id,
    currentSkills: r.current_skills || [],
    goal: r.goal,
    timeline: r.timeline,
    budget: r.budget,
    roadmapData: r.roadmap_data,
    createdAt: r.created_at
  };
}

// ---------------------------------------------------------
// 4. SALARY REPORTS ACTIONS
// ---------------------------------------------------------

export async function getSalaryReportsAction(userId: string): Promise<SalaryReport[]> {
  const query = `
    SELECT * FROM public.salary_reports 
    WHERE user_id = $1 
    ORDER BY created_at DESC
  `;
  const { rows } = await db.query(query, [userId]);
  return rows.map((s) => ({
    id: s.id,
    userId: s.user_id,
    role: s.role,
    experience: s.experience,
    location: s.location,
    industry: s.industry,
    rangeMin: s.range_min ? parseFloat(s.range_min) : undefined,
    rangeMax: s.range_max ? parseFloat(s.range_max) : undefined,
    rangeMedian: s.range_median ? parseFloat(s.range_median) : undefined,
    trendData: s.trend_data,
    negotiationTips: s.negotiation_tips || [],
    createdAt: s.created_at
  }));
}

export async function saveSalaryReportAction(
  userId: string,
  data: {
    role: string;
    experience: string;
    location: string;
    industry: string;
    rangeMin: number;
    rangeMax: number;
    rangeMedian: number;
    trendData: any;
    negotiationTips: string[];
  }
): Promise<SalaryReport> {
  const query = `
    INSERT INTO public.salary_reports (user_id, role, experience, location, industry, range_min, range_max, range_median, trend_data, negotiation_tips, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $11, NOW())
    RETURNING *
  `;
  const values = [
    userId,
    data.role,
    data.experience,
    data.location,
    data.industry,
    data.rangeMin,
    data.rangeMax,
    data.rangeMedian,
    JSON.stringify(data.trendData),
    data.negotiationTips
  ];
  const { rows } = await db.query(query, values);
  const s = rows[0];
  return {
    id: s.id,
    userId: s.user_id,
    role: s.role,
    experience: s.experience,
    location: s.location,
    industry: s.industry,
    rangeMin: parseFloat(s.range_min),
    rangeMax: parseFloat(s.range_max),
    rangeMedian: parseFloat(s.range_median),
    trendData: s.trend_data,
    negotiationTips: s.negotiation_tips || [],
    createdAt: s.created_at
  };
}

// ---------------------------------------------------------
// 5. SKILL GAP / LEARNING PLAN ACTIONS
// ---------------------------------------------------------

export async function getLearningPlansAction(userId: string): Promise<LearningPlan[]> {
  const query = `
    SELECT * FROM public.learning_plans 
    WHERE user_id = $1 
    ORDER BY created_at DESC
  `;
  const { rows } = await db.query(query, [userId]);
  return rows.map((lp) => ({
    id: lp.id,
    userId: lp.user_id,
    targetRole: lp.target_role,
    missingSkills: lp.missing_skills || [],
    learningResources: lp.learning_resources || [],
    createdAt: lp.created_at
  }));
}

export async function saveLearningPlanAction(
  userId: string,
  data: {
    targetRole: string;
    missingSkills: any[];
    learningResources: any[];
  }
): Promise<LearningPlan> {
  const query = `
    INSERT INTO public.learning_plans (user_id, target_role, missing_skills, learning_resources, created_at)
    VALUES ($1, $2, $3, $4, NOW())
    RETURNING *
  `;
  const values = [
    userId,
    data.targetRole,
    JSON.stringify(data.missingSkills),
    JSON.stringify(data.learningResources)
  ];
  const { rows } = await db.query(query, values);
  const lp = rows[0];
  return {
    id: lp.id,
    userId: lp.user_id,
    targetRole: lp.target_role,
    missingSkills: lp.missing_skills || [],
    learningResources: lp.learning_resources || [],
    createdAt: lp.created_at
  };
}

// ---------------------------------------------------------
// 6. CAREER COACH ACTIONS
// ---------------------------------------------------------

export async function getCoachChatsAction(userId: string): Promise<CoachChat[]> {
  const query = `
    SELECT * FROM public.career_coach_chats 
    WHERE user_id = $1 
    ORDER BY updated_at DESC
  `;
  const { rows } = await db.query(query, [userId]);
  return rows.map((c) => ({
    id: c.id,
    userId: c.user_id,
    title: c.title,
    createdAt: c.created_at,
    updatedAt: c.updated_at
  }));
}

export async function createCoachChatAction(userId: string, title: string): Promise<CoachChat> {
  const query = `
    INSERT INTO public.career_coach_chats (user_id, title, created_at, updated_at)
    VALUES ($1, $2, NOW(), NOW())
    RETURNING *
  `;
  const { rows } = await db.query(query, [userId, title]);
  const c = rows[0];
  return {
    id: c.id,
    userId: c.user_id,
    title: c.title,
    createdAt: c.created_at,
    updatedAt: c.updated_at
  };
}

export async function deleteCoachChatAction(chatId: string, userId: string): Promise<void> {
  const query = `DELETE FROM public.career_coach_chats WHERE id = $1 AND user_id = $2`;
  await db.query(query, [chatId, userId]);
}

export async function getCoachMessagesAction(chatId: string, userId: string): Promise<CoachMessage[]> {
  // First verify chat owner
  const verifyQuery = `SELECT 1 FROM public.career_coach_chats WHERE id = $1 AND user_id = $2`;
  const { rows: verifyRows } = await db.query(verifyQuery, [chatId, userId]);
  if (verifyRows.length === 0) {
    throw new Error("Chat not found or unauthorized");
  }

  const query = `
    SELECT * FROM public.career_coach_messages 
    WHERE chat_id = $1 
    ORDER BY created_at ASC
  `;
  const { rows } = await db.query(query, [chatId]);
  return rows.map((m) => ({
    id: m.id,
    chatId: m.chat_id,
    role: m.role as "user" | "assistant",
    content: m.content,
    createdAt: m.created_at
  }));
}

export async function saveCoachMessageAction(
  chatId: string, 
  role: "user" | "assistant", 
  content: string
): Promise<CoachMessage> {
  const query = `
    INSERT INTO public.career_coach_messages (chat_id, role, content, created_at)
    VALUES ($1, $2, $3, NOW())
    RETURNING *
  `;
  const { rows } = await db.query(query, [chatId, role, content]);
  
  // Touch chat updated_at
  await db.query(
    "UPDATE public.career_coach_chats SET updated_at = NOW() WHERE id = $1", 
    [chatId]
  );

  const m = rows[0];
  return {
    id: m.id,
    chatId: m.chat_id,
    role: m.role as "user" | "assistant",
    content: m.content,
    createdAt: m.created_at
  };
}
