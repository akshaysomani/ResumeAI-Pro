import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getProviderConfig, getAIStream } from "@/lib/ai-provider";
import { buildAutoFixResumePrompt } from "@/lib/ai-prompts";
import { getResumeAction, saveResumeFullAction } from "@/app/actions/resumeActions";

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
    const { resumeId, recommendations, jobDescription } = body;

    if (!resumeId || !recommendations || !jobDescription) {
      return NextResponse.json(
        { error: "Missing required parameters: resumeId, recommendations, or jobDescription." },
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

    // 4. Build prompt & load configurations
    const resumeJson = JSON.stringify(resume.sections);
    const promptPayload = buildAutoFixResumePrompt({
      resumeJson,
      jobDescription,
      recommendations,
    });
    const providerConfig = getProviderConfig();

    // 5. Request streaming/complete response from LLM and compile it
    const stream = await getAIStream(promptPayload, providerConfig);
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      fullText += decoder.decode(value);
    }

    // 6. Parse the updated sections array
    let updatedSections;
    try {
      let cleaned = fullText.trim();
      if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
      if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
      if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
      updatedSections = JSON.parse(cleaned.trim());
    } catch (parseErr) {
      console.error("Failed to parse Auto-Fix response JSON. Full text was:", fullText);
      return NextResponse.json(
        { error: "AI returned invalid JSON formatting. Please try again." },
        { status: 500 }
      );
    }

    if (!Array.isArray(updatedSections)) {
      return NextResponse.json(
        { error: "AI output is not a valid sections array." },
        { status: 500 }
      );
    }

    // 7. Save updated sections to database
    resume.sections = updatedSections;
    await saveResumeFullAction(resumeId, resume);

    return NextResponse.json({
      success: true,
      message: "Applied recommendations directly to the resume successfully.",
      sections: updatedSections,
    });
  } catch (error: any) {
    console.error("Error in Auto-Fix route:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
