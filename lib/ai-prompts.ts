export interface PromptPayload {
  system: string;
  user: string;
}

export function buildSummaryPrompt(data: {
  experience?: string;
  education?: string;
  skills?: string;
  industry?: string;
  careerGoals?: string;
  tone: string;
  length: "short" | "medium" | "long";
}): PromptPayload {
  const lengthGuideline = data.length === "short" ? "1-2 sentences, extremely compact." :
                          data.length === "long" ? "4-5 sentences, comprehensive and detail-rich." : "2-3 sentences, balanced.";

  return {
    system: `You are an expert executive resume writer and career strategist. 
Your goal is to write a highly polished, professional, and ATS-optimized "Professional Summary" for a resume. 
Follow the requested tone: "${data.tone}". 
Do not include any greeting, explanation, markdown headers, or surrounding quotes in your final output. Return ONLY the raw summary text.`,
    user: `Generate a professional summary based on the following input:
- Industry: ${data.industry || "General / Technology"}
- Work Experience highlights: ${data.experience || "Not provided"}
- Education highlights: ${data.education || "Not provided"}
- Core Skills: ${data.skills || "Not provided"}
- Target Career Goals: ${data.careerGoals || "Not provided"}
- Output Length Guideline: ${lengthGuideline}`,
  };
}

export function buildExperiencePrompt(data: {
  role: string;
  company: string;
  duration?: string;
  achievements: string;
  tone: string;
}): PromptPayload {
  return {
    system: `You are an expert technical resume writer. Your task is to generate professional, high-impact work experience bullet points for a resume.
Write 3-4 bullet points following the STAR methodology (Situation, Task, Action, Result) where possible.
Always start each bullet point with a strong, active verb (e.g. "Spearheaded", "Optimized", "Architected").
Incorporate quantifiable metrics/achievements (e.g., "$150k cost reduction", "40% faster latency") using bracketed placeholders like "[X]% latency reduction" or "[X] team members mentored" if explicit metrics aren't fully provided in the input, to help the user fill them in.
Adopt the tone: "${data.tone}".
Output format: Return ONLY the bullet points, each starting with the "•" character. No introductory phrases or notes.`,
    user: `Generate resume bullet points for this work experience:
- Role: ${data.role}
- Company: ${data.company}
- Duration: ${data.duration || "Not specified"}
- Key tasks and accomplishments to draw from: ${data.achievements}`,
  };
}

export function buildProjectPrompt(data: {
  title: string;
  role?: string;
  techStack?: string;
  achievements: string;
  tone: string;
}): PromptPayload {
  return {
    system: `You are a technical resume consultant. Your task is to write a high-impact project description block for a resume.
Write 2-3 bullet points that clearly detail:
1. The Core Purpose/Features of the project.
2. The Tech Stack used.
3. The Challenges faced, solutions built, and business/technical impact.
Adopt the tone: "${data.tone}".
Output format: Return ONLY the bullet points, each starting with the "•" character. No surrounding text.`,
    user: `Generate description highlights for this project:
- Project Title: ${data.title}
- Role on Project: ${data.role || "Developer"}
- Technologies: ${data.techStack || "Not specified"}
- Details & Outcomes: ${data.achievements}`,
  };
}

export function buildSkillsPrompt(data: {
  role: string;
  industry?: string;
}): PromptPayload {
  return {
    system: `You are an AI recruitment analyst. Your task is to suggest highly relevant skills for a candidate's resume based on their target position.
Suggest skills categorized into three groups:
1. Technical/Hard Skills (specific languages, tools, frameworks)
2. Soft Skills / Professional (collaboration, leadership, active listening)
3. Trending/Role-Specific Skills (high-demand industry skills)
Output format: Return a clean, comma-separated list formatted as JSON in the following exact shape:
{
  "technical": ["Skill A", "Skill B", "Skill C"],
  "soft": ["Skill D", "Skill E"],
  "trending": ["Skill F", "Skill G"]
}
Return ONLY valid JSON. No markdown backticks, no comments, no leading/trailing explanations.`,
    user: `Suggest role-specific skills for:
- Target Role: ${data.role}
- Target Industry: ${data.industry || "Technology"}`,
  };
}

export function buildRewritePrompt(data: {
  text: string;
  tone: string;
  action: "rewrite" | "expand" | "shorten" | "grammar" | "ats-optimize" | "simplify";
}): PromptPayload {
  let actionInstruction = "Rewrite the text professionally while maintaining the original core message.";
  if (data.action === "expand") actionInstruction = "Expand the text adding more professional depth and structural detail.";
  if (data.action === "shorten") actionInstruction = "Make the text highly concise, removing fluff while keeping key achievements.";
  if (data.action === "grammar") actionInstruction = "Correct any spelling, formatting, and grammar errors while keeping the professional style.";
  if (data.action === "ats-optimize") actionInstruction = "Optimize the text for ATS parsers by introducing strong action verbs and keyword density.";
  if (data.action === "simplify") actionInstruction = "Simplify the phrasing to make it clear, clean, and easy to read.";

  return {
    system: `You are an expert resume editor. Your task is to transform a provided block of resume text.
Apply the following editor action: "${actionInstruction}".
Adopt the tone style: "${data.tone}".
Output format: Return ONLY the edited text. Do not explain your edits. No surrounding quotes or notes.`,
    user: `Transform this text:
"${data.text}"`,
  };
}

export function buildGenericPrompt(data: {
  sectionType: string;
  instructions: string;
  tone: string;
}): PromptPayload {
  return {
    system: `You are an AI career writer. Your task is to generate professional text for the resume section: "${data.sectionType}".
Follow the instructions carefully.
Adopt the tone style: "${data.tone}".
Output format: Return ONLY the raw generated text content. No explanations or surrounding formatting.`,
    user: `Generate resume details based on these instructions:
${data.instructions}`,
  };
}

export function buildAtsAnalysisPrompt(resumeText: string): PromptPayload {
  return {
    system: `You are an enterprise-grade Applicant Tracking System (ATS) parsing algorithm and senior technical recruiter.
Your task is to analyze the provided resume text and generate a comprehensive, highly accurate validation report in JSON.
Assess the resume across multiple parameters:
1. Overall ATS compatibility score (0-100)
2. Formatting quality (detect issues like dense text, long paragraphs > 5 lines, etc.)
3. Keyword optimization density (technical and soft skills matching)
4. Grammar, spelling, and readability indexes
5. Section coverage / completeness
6. Achievement quality (quantifiable results using numbers/metrics)
7. Action verb usage (replace passive verbs with active verbs)

You MUST return a valid JSON object matching this exact structure:
{
  "overallScore": number,
  "formatScore": number,
  "keywordScore": number,
  "grammarScore": number,
  "designScore": number,
  "metrics": {
    "readability": number,
    "actionVerbsCount": number,
    "quantifiableAchievementsPercent": number
  },
  "missingKeywords": string[],
  "weakSentences": [
    { "original": "string", "suggestion": "string" }
  ],
  "formattingFlags": string[],
  "recommendations": [
    { "section": "string", "tip": "string", "priority": "high" | "medium" | "low" }
  ]
}
Return ONLY valid JSON. No markdown backticks, no comments, no leading/trailing explanations.`,
    user: `Analyze this resume and output the detailed scorecard JSON:
---
${resumeText}
---`,
  };
}

export function buildJobMatchPrompt(resumeText: string, jobSpec: string): PromptPayload {
  return {
    system: `You are an AI recruitment matching engine.
Your task is to compare the candidate's resume text against the target job description requirements and calculate detailed compatibility metrics in JSON.
Analyze and determine:
1. Overall match percentage (0-100)
2. Keyword match score (0-100)
3. Technical/soft skills match score (0-100)
4. Experience alignment analysis (text summary)
5. Education requirement matching (text summary)
6. List of critical missing requirements/skills
7. Extra qualifications the candidate possesses that are not strictly requested but add value

You MUST return a valid JSON object matching this exact structure:
{
  "overallMatch": number,
  "keywordMatch": number,
  "skillsMatch": number,
  "experienceMatch": "string",
  "educationMatch": "string",
  "missingSkills": string[],
  "extraQualifications": string[],
  "recommendations": string[]
}
Return ONLY valid JSON. No markdown backticks, no comments, no leading/trailing explanations.`,
    user: `Compare this resume against the job description.
---
RESUME:
${resumeText}

---
JOB DESCRIPTION:
${jobSpec}
---`,
  };
}
