import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getProviderConfig, getAIStream } from "@/lib/ai-provider";
import { buildAtsAnalysisPrompt } from "@/lib/ai-prompts";
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
    const { resumeId } = body;

    if (!resumeId) {
      return NextResponse.json(
        { error: "Missing required parameter: resumeId." },
        { status: 400 }
      );
    }

    // 3. Load full resume data
    const resume = await getResumeAction(resumeId);
    if (!resume) {
      return NextResponse.json({ error: "Resume not found." }, { status: 404 });
    }

    // Check ownership
    if (resume.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized access to this resume." }, { status: 403 });
    }

    // 4. Format resume content to plain text
    const resumeText = formatResumeToText(resume);

    // 5. Build prompt & load configurations
    const promptPayload = buildAtsAnalysisPrompt(resumeText);
    const providerConfig = getProviderConfig();

    if (!providerConfig.apiKey) {
      return NextResponse.json(
        { error: `AI provider "${providerConfig.provider}" API key is not configured.` },
        { status: 500 }
      );
    }

    // 6. Request streaming response from LLM and compile it
    const stream = await getAIStream(promptPayload, providerConfig);
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      fullText += decoder.decode(value);
    }

    // 7. Parse the structured JSON response
    let report;
    try {
      let cleaned = fullText.trim();
      if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
      if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
      if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
      report = JSON.parse(cleaned.trim());
    } catch (parseErr) {
      console.error("Failed to parse ATS response JSON. Full text was:", fullText);
      return NextResponse.json(
        { error: "AI returned invalid JSON formatting. Please try again." },
        { status: 500 }
      );
    }

    // 8. Upsert analysis report in public.ats_analysis
    const upsertQuery = `
      INSERT INTO public.ats_analysis (
        resume_id, overall_score, format_score, keyword_score, grammar_score, design_score, missing_keywords, recommendations, analyzed_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      ON CONFLICT (resume_id) DO UPDATE SET
        overall_score = EXCLUDED.overall_score,
        format_score = EXCLUDED.format_score,
        keyword_score = EXCLUDED.keyword_score,
        grammar_score = EXCLUDED.grammar_score,
        design_score = EXCLUDED.design_score,
        missing_keywords = EXCLUDED.missing_keywords,
        recommendations = EXCLUDED.recommendations,
        analyzed_at = NOW()
    `;

    const metaRecommendations = {
      metrics: report.metrics,
      weakSentences: report.weakSentences,
      formattingFlags: report.formattingFlags,
      recommendations: report.recommendations,
    };

    await db.query(upsertQuery, [
      resumeId,
      report.overallScore || 0,
      report.formatScore || 0,
      report.keywordScore || 0,
      report.grammarScore || 0,
      report.designScore || 0,
      JSON.stringify(report.missingKeywords || []),
      JSON.stringify(metaRecommendations),
    ]);

    return NextResponse.json({
      resumeId,
      overallScore: report.overallScore || 0,
      formatScore: report.formatScore || 0,
      keywordScore: report.keywordScore || 0,
      grammarScore: report.grammarScore || 0,
      designScore: report.designScore || 0,
      missingKeywords: report.missingKeywords || [],
      ...metaRecommendations,
    });
  } catch (error: any) {
    console.error("Error in ATS Analyze route:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
