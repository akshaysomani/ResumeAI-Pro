import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getProviderConfig, getAIStream } from "@/lib/ai-provider";
import { buildCareerRoadmapPrompt } from "@/lib/ai-prompts";

async function getResumeContextText(userId: string): Promise<string> {
  let context = "";
  try {
    const resQuery = `SELECT id FROM public.resumes WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1`;
    const { rows: resRows } = await db.query(resQuery, [userId]);
    if (resRows.length === 0) return "";
    const resumeId = resRows[0].id;
    const personalQuery = `SELECT * FROM public.personal_information WHERE resume_id = $1`;
    const { rows: personalRows } = await db.query(personalQuery, [resumeId]);
    if (personalRows.length > 0) {
      context += `Role Title: ${personalRows[0].headline || ""}\n`;
    }
    const skillsQuery = `SELECT name FROM public.skills WHERE resume_id = $1 ORDER BY order_index ASC`;
    const { rows: skillsRows } = await db.query(skillsQuery, [resumeId]);
    if (skillsRows.length > 0) {
      context += `Skills: ${skillsRows.map((s: any) => s.name).join(", ")}\n`;
    }
  } catch (err) {}
  return context;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { currentSkills = [], goal, timeline, budget } = await req.json();
    if (!goal) {
      return NextResponse.json({ error: "Missing goal target role" }, { status: 400 });
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

    const resumeContext = await getResumeContextText(user.id);
    let promptPayload = buildCareerRoadmapPrompt({
      currentSkills,
      goal,
      timeline,
      budget,
      resumeContext
    });

    if (plan === "free") {
      promptPayload.system = `You are a career roadmap planner for Free accounts.
Your response MUST be strict JSON:
1. Limit "milestones" to EXACTLY 3 items.
2. In the "milestones", detail basic tasks only.
3. For "certifications", "books", "courses", "projects", you MUST populate only generic names without resource links or platforms (e.g. set courses to ["Basic course on target role"], books to ["Introduction text on target role"]).
4. You MUST set the estimated times conservatively.

You MUST return a valid JSON object matching this exact structure:
{
  "milestones": [
    {
      "title": "string (Milestone title)",
      "description": "string (Details of what to learn/achieve)",
      "estimatedTime": "string (e.g. 4 weeks)",
      "resources": []
    }
  ],
  "certifications": string[],
  "skillsToAcquire": string[],
  "books": string[],
  "courses": string[],
  "projects": string[]
}
Return ONLY valid JSON. No markdown backticks, no comments, no leading/trailing explanations.`;
    }

    const providerConfig = getProviderConfig();
    const stream = await getAIStream(promptPayload, providerConfig, async (fullText) => {
      // Parse, persist, and execute skill gap logging on completion
      try {
        const parsed = JSON.parse(fullText);

        // 1. Save to public.career_roadmaps
        await db.query(
          `INSERT INTO public.career_roadmaps (user_id, current_skills, goal, timeline, budget, roadmap_data, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [
            user.id,
            currentSkills,
            goal,
            timeline || "12 months",
            budget || "Flexible",
            JSON.stringify(parsed)
          ]
        );

        // 2. Derive missing skills lists for learning plan and skill gap analysis
        const skillsToAcquire = parsed.skillsToAcquire || [];
        const missingSkills = skillsToAcquire.map((skill: string, index: number) => {
          // Distribute priorities and hours programmatically
          const priorities = ["high", "medium", "low"] as const;
          const difficulties = ["beginner", "intermediate", "advanced"] as const;
          return {
            skill,
            priority: priorities[index % 3],
            difficulty: difficulties[index % 3],
            hours: (index + 1) * 15
          };
        });

        const learningResources = skillsToAcquire.map((skill: string) => {
          // Suggest resources matching each skill
          return {
            skill,
            courses: parsed.courses?.filter((c: string) => c.toLowerCase().includes(skill.toLowerCase())) || parsed.courses || [],
            books: parsed.books || [],
            platforms: ["Coursera", "Udemy", "LinkedIn Learning", "GitHub"],
            challenges: [`Build a project using ${skill}`]
          };
        });

        // 3. Save to public.learning_plans
        await db.query(
          `INSERT INTO public.learning_plans (user_id, target_role, missing_skills, learning_resources, created_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [
            user.id,
            goal,
            JSON.stringify(missingSkills),
            JSON.stringify(learningResources)
          ]
        );
      } catch (dbErr) {
        console.error("Failed to parse and save roadmap results to database:", dbErr);
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
    console.error("Error in career roadmap generator route:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
