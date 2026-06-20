import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getProviderConfig, getAIStream } from "@/lib/ai-provider";
import { buildJobMatchPrompt } from "@/lib/ai-prompts";
import { getResumeAction } from "@/app/actions/resumeActions";

function formatResumeToText(resume: any): string {
  let output = `Resume Title: ${resume.title || "Untitled"}\n\n`;

  if (Array.isArray(resume.sections)) {
    for (const section of resume.sections) {
      if (section.content?.isVisible === false) continue;
      
      output += `=== ${section.title || section.sectionType.toUpperCase()} ===\n`;
      
      const content = section.content;
      if (Array.isArray(content)) {
        for (const item of content) {
          const parts: string[] = [];
          if (item.company) parts.push(`Company: ${item.company}`);
          if (item.role) parts.push(`Role: ${item.role}`);
          if (item.duration) parts.push(`Duration: ${item.duration}`);
          if (item.location) parts.push(`Location: ${item.location}`);
          if (item.school) parts.push(`School: ${item.school}`);
          if (item.degree) parts.push(`Degree: ${item.degree}`);
          if (item.field) parts.push(`Field: ${item.field}`);
          if (item.gpa) parts.push(`GPA: ${item.gpa}`);
          if (item.title) parts.push(`Title: ${item.title}`);
          if (item.url) parts.push(`Link: ${item.url}`);
          if (item.technologies) parts.push(`Technologies: ${item.technologies}`);
          if (item.name) parts.push(`Name: ${item.name}`);
          if (item.category) parts.push(`Category: ${item.category}`);
          if (item.proficiency) parts.push(`Proficiency: ${item.proficiency}`);
          if (item.date) parts.push(`Date: ${item.date}`);
          if (item.issuer) parts.push(`Issuer: ${item.issuer}`);
          
          output += parts.join(" | ") + "\n";
          if (item.description) {
            output += `Description: ${item.description}\n`;
          }
          output += "\n";
        }
      } else if (typeof content === "object" && content !== null) {
        for (const [key, value] of Object.entries(content)) {
          if (key === "isVisible" || !value) continue;
          output += `${key}: ${value}\n`;
        }
        output += "\n";
      } else if (typeof content === "string") {
        output += `${content}\n\n`;
      }
    }
  }

  return output;
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
    const { resumeId, jobDescription, jobTitle, companyName } = body;

    if (!resumeId || !jobDescription) {
      return NextResponse.json(
        { error: "Missing required parameters: resumeId and jobDescription." },
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
        FROM public.job_matches j
        JOIN public.resumes r ON j.resume_id = r.id
        WHERE r.user_id = $1 AND j.generated_at >= date_trunc('day', timezone('UTC', now()))
      `;
      const { rows: countRows } = await db.query(countQuery, [user.id]);
      const dailyCount = parseInt(countRows[0].count, 10);

      if (dailyCount >= 1) {
        return NextResponse.json(
          { error: "Daily limit of 1 job description comparison scan reached. Upgrade to Pro for unlimited comparisons." },
          { status: 429 }
        );
      }
    }

    // 4. Load full resume data
    const resume = await getResumeAction(resumeId);
    if (!resume) {
      return NextResponse.json({ error: "Resume not found." }, { status: 404 });
    }

    // Check ownership
    if (resume.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized access to this resume." }, { status: 403 });
    }

    // 5. Format resume content to plain text
    const resumeText = formatResumeToText(resume);

    // 6. Build prompt & load configurations
    const promptPayload = buildJobMatchPrompt(resumeText, jobDescription);
    const providerConfig = getProviderConfig();

    if (!providerConfig.apiKey) {
      return NextResponse.json(
        { error: `AI provider "${providerConfig.provider}" API key is not configured.` },
        { status: 500 }
      );
    }

    // 7. Request streaming response from LLM and compile it
    const stream = await getAIStream(promptPayload, providerConfig);
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      fullText += decoder.decode(value);
    }

    // 8. Parse the structured JSON response
    let report;
    try {
      let cleaned = fullText.trim();
      if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
      if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
      if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
      report = JSON.parse(cleaned.trim());
    } catch (parseErr) {
      console.error("Failed to parse Job Match response JSON. Full text was:", fullText);
      return NextResponse.json(
        { error: "AI returned invalid JSON formatting. Please try again." },
        { status: 500 }
      );
    }

    // 9. Store the comparison log in public.job_matches
    const logQuery = `
      INSERT INTO public.job_matches (
        resume_id, job_description, match_percentage, missing_skills, recommended_changes, job_title, company_name, match_breakdown, generated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING id
    `;

    const matchBreakdown = {
      overallMatch: report.overallMatch || 0,
      keywordMatch: report.keywordMatch || 0,
      skillsMatch: report.skillsMatch || 0,
      experienceMatch: report.experienceMatch || "",
      educationMatch: report.educationMatch || "",
      extraQualifications: report.extraQualifications || [],
    };

    const { rows: inserted } = await db.query(logQuery, [
      resumeId,
      jobDescription,
      report.overallMatch || 0,
      JSON.stringify(report.missingSkills || []),
      JSON.stringify(report.recommendations || []),
      jobTitle || "Target Role Position",
      companyName || "Target Company",
      JSON.stringify(matchBreakdown),
    ]);

    return NextResponse.json({
      id: inserted[0].id,
      resumeId,
      overallMatch: report.overallMatch || 0,
      keywordMatch: report.keywordMatch || 0,
      skillsMatch: report.skillsMatch || 0,
      experienceMatch: report.experienceMatch || "",
      educationMatch: report.educationMatch || "",
      missingSkills: report.missingSkills || [],
      extraQualifications: report.extraQualifications || [],
      recommendations: report.recommendations || [],
    });
  } catch (error: any) {
    console.error("Error in Job Match route:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
