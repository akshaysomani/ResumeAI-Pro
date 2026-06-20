import type { Resume } from "@/types";

export interface AtsHint {
  id: string;
  type: "warning" | "error" | "info" | "success";
  message: string;
  section: string;
  tip: string;
}

const WEAK_PHRASES = ["responsible for", "helped with", "assisted in", "worked on", "handled", "duties included"];
const STRONG_VERBS = ["Spearheaded", "Engineered", "Orchestrated", "Designed", "Optimized", "Formulated", "Synthesized", "Led", "Executed"];

export function analyzeAtsHints(resume: Resume): AtsHint[] {
  const hints: AtsHint[] = [];

  const getSection = (type: string) => resume.sections.find((s) => s.sectionType === type);

  // 1. Personal Information (Contact)
  const personalSec = getSection("personal");
  const pContent = personalSec?.content || {};
  if (!pContent.fullName) {
    hints.push({
      id: "p-name",
      type: "error",
      message: "Full Name is missing.",
      section: "personal",
      tip: "Recruiters cannot identify you without a clear name header. Add your name.",
    });
  }
  if (!pContent.email) {
    hints.push({
      id: "p-email",
      type: "error",
      message: "Email coordinates are missing.",
      section: "personal",
      tip: "Add a professional email address (e.g., name@domain.com) so hiring managers can contact you.",
    });
  }
  if (!pContent.phone) {
    hints.push({
      id: "p-phone",
      type: "warning",
      message: "Phone number is missing.",
      section: "personal",
      tip: "Provide a contact phone number with country prefix so recruiters can schedule interviews quickly.",
    });
  }
  if (!pContent.linkedinUrl) {
    hints.push({
      id: "p-linkedin",
      type: "info",
      message: "LinkedIn profile link is missing.",
      section: "personal",
      tip: "Most modern recruiters verify applicant LinkedIn bios. Adding a clean URL increases response rates.",
    });
  }

  // 2. Professional Summary
  const summarySec = getSection("summary");
  const sContent = summarySec?.content?.text || resume.description || "";
  if (!sContent.trim()) {
    hints.push({
      id: "s-missing",
      type: "warning",
      message: "Professional summary is missing.",
      section: "summary",
      tip: "Write a short 3-4 sentence paragraph highlighting your core value add, total experience years, and primary achievements.",
    });
  } else if (sContent.length < 80) {
    hints.push({
      id: "s-short",
      type: "info",
      message: "Professional summary seems too short.",
      section: "summary",
      tip: "Expand your summary to describe your domain expertise and typical projects you specialize in.",
    });
  }

  // 3. Work Experience (Measurability & Strong Verbs)
  const expSec = getSection("experience");
  const expList = Array.isArray(expSec?.content) ? expSec.content : [];
  if (expList.length === 0) {
    hints.push({
      id: "exp-empty",
      type: "warning",
      message: "No work experience listed.",
      section: "experience",
      tip: "Add your employment history (recent to oldest) to show career progression and professional roles.",
    });
  } else {
    let hasMetrics = false;
    let hasWeakVerbs = false;

    expList.forEach((exp: any) => {
      const desc = (exp.description || "").toLowerCase();
      
      // Look for numbers, percentages, or dollar targets
      if (desc.match(/\d+%|\d+\s?%/g) || desc.includes("$") || desc.match(/\b\d+\b/g)) {
        hasMetrics = true;
      }

      // Check for weak start patterns
      WEAK_PHRASES.forEach((phrase) => {
        if (desc.includes(phrase)) {
          hasWeakVerbs = true;
        }
      });
    });

    if (!hasMetrics) {
      hints.push({
        id: "exp-no-metrics",
        type: "warning",
        message: "No quantifiable achievements found in work experience.",
        section: "experience",
        tip: "ATS screening and recruiters value metrics. Try including numbers like: 'increased revenue by 15%', 'managed budget of $20K', or 'led team of 4 devs'.",
      });
    }

    if (hasWeakVerbs) {
      hints.push({
        id: "exp-weak-verbs",
        type: "info",
        message: "Weak phrases found in role descriptions.",
        section: "experience",
        tip: `Avoid phrases like 'responsible for' or 'helped with'. Use strong action verbs instead: ${STRONG_VERBS.slice(0, 4).join(", ")}.`,
      });
    }
  }

  // 4. Skills Competencies
  const skillsSec = getSection("skills");
  const skillsList = Array.isArray(skillsSec?.content) ? skillsSec.content : [];
  if (skillsList.length === 0) {
    hints.push({
      id: "skills-empty",
      type: "warning",
      message: "Skills list is empty.",
      section: "skills",
      tip: "Add technical skills, tooling proficiencies, and software competencies. A typical resume needs 6-12 tags.",
    });
  } else if (skillsList.length < 5) {
    hints.push({
      id: "skills-few",
      type: "info",
      message: "Very few skills listed.",
      section: "skills",
      tip: "Add more skills to match keyword queries from automated hiring parsers.",
    });
  }

  // 5. Projects
  const projectsSec = getSection("projects");
  const projectsList = Array.isArray(projectsSec?.content) ? projectsSec.content : [];
  if (projectsList.length > 0) {
    const missingLinks = projectsList.some((item: any) => !item.url && !item.githubUrl && !item.liveUrl);
    if (missingLinks) {
      hints.push({
        id: "proj-links",
        type: "info",
        message: "Some projects are missing repository or live demo links.",
        section: "projects",
        tip: "Providing links to GitHub repos or live URL deployments increases credibility for engineers and designers.",
      });
    }
  }

  return hints;
}
