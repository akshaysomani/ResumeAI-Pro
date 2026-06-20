import type { Resume } from "@/types";

export function generatePlainText(resume: Resume): string {
  let text = "";

  const getSection = (type: string) => {
    const sec = resume.sections.find((s) => s.sectionType === type);
    return sec?.content?.isVisible !== false ? sec?.content : null;
  };

  const hr = "\n" + "=".repeat(40) + "\n";
  const subHr = "-".repeat(40) + "\n";

  // 1. Personal Info
  const personal = getSection("personal");
  if (personal) {
    text += `${(personal.fullName || "User Name").toUpperCase()}\n`;
    if (personal.headline) text += `${personal.headline}\n`;
    text += "\n";

    const contacts: string[] = [];
    if (personal.email) contacts.push(`Email: ${personal.email}`);
    if (personal.phone) contacts.push(`Phone: ${personal.phone}`);
    if (personal.location) contacts.push(`Location: ${personal.location}`);
    if (personal.website) contacts.push(`Website: ${personal.website}`);
    if (personal.linkedinUrl) contacts.push(`LinkedIn: ${personal.linkedinUrl}`);
    if (personal.githubUrl) contacts.push(`GitHub: ${personal.githubUrl}`);

    text += contacts.join("  |  ") + "\n";
    text += hr;
  }

  // 2. Summary
  const summary = getSection("summary");
  if (summary && summary.text) {
    text += "PROFESSIONAL SUMMARY\n";
    text += subHr;
    text += `${summary.text}\n`;
    text += hr;
  }

  // 3. Experience
  const experience = getSection("experience");
  if (Array.isArray(experience) && experience.length > 0) {
    text += "WORK EXPERIENCE\n";
    text += subHr;
    experience.forEach((job) => {
      text += `${job.role.toUpperCase()} - ${job.company}\n`;
      text += `${job.startDate || ""} - ${job.currentlyWorking ? "Present" : job.endDate || ""}`;
      if (job.location) text += ` | ${job.location}`;
      text += "\n\n";
      if (job.description) {
        text += `${job.description}\n`;
      }
      text += "\n";
    });
    text += hr;
  }

  // 4. Education
  const education = getSection("education");
  if (Array.isArray(education) && education.length > 0) {
    text += "EDUCATION\n";
    text += subHr;
    education.forEach((edu) => {
      text += `${edu.degree || ""} ${edu.major ? `in ${edu.major}` : ""}\n`;
      text += `${edu.school}`;
      if (edu.location) text += `, ${edu.location}`;
      text += ` | ${edu.startDate || ""} - ${edu.currentlyStudying ? "Present" : edu.endDate || ""}\n`;
      if (edu.gpa) text += `GPA: ${edu.gpa}\n`;
      if (edu.description) text += `${edu.description}\n`;
      text += "\n";
    });
    text += hr;
  }

  // 5. Skills
  const skills = getSection("skills");
  if (Array.isArray(skills) && skills.length > 0) {
    text += "CORE SKILLS\n";
    text += subHr;
    const skillList = skills.map((s) => `${s.name}${s.proficiency ? ` (${s.proficiency})` : ""}`);
    text += `${skillList.join(", ")}\n`;
    text += hr;
  }

  // 6. Projects
  const projects = getSection("projects");
  if (Array.isArray(projects) && projects.length > 0) {
    text += "PROJECTS\n";
    text += subHr;
    projects.forEach((proj) => {
      text += `${proj.title.toUpperCase()}`;
      if (proj.role) text += ` | Role: ${proj.role}`;
      text += ` | ${proj.startDate || ""} - ${proj.endDate || ""}\n`;
      if (proj.url) text += `Link: ${proj.url}\n`;
      if (proj.description) text += `${proj.description}\n`;
      text += "\n";
    });
    text += hr;
  }

  // 7. Certifications
  const certs = getSection("certifications");
  if (Array.isArray(certs) && certs.length > 0) {
    text += "CERTIFICATIONS\n";
    text += subHr;
    certs.forEach((c) => {
      text += `- ${c.name} (Issued by: ${c.issuer || "Unknown"})\n`;
      if (c.issueDate) text += `  Issued: ${c.issueDate} ${c.expiryDate ? ` | Expires: ${c.expiryDate}` : ""}\n`;
      if (c.credentialUrl) text += `  URL: ${c.credentialUrl}\n`;
    });
    text += hr;
  }

  // 8. Languages
  const langs = getSection("languages");
  if (Array.isArray(langs) && langs.length > 0) {
    text += "LANGUAGES\n";
    text += subHr;
    const langStrs = langs.map((l) => `${l.name}${l.proficiency ? ` (${l.proficiency})` : ""}`);
    text += `${langStrs.join(", ")}\n`;
    text += hr;
  }

  // 9. Achievements & Awards
  const achievements = getSection("achievements");
  if (Array.isArray(achievements) && achievements.length > 0) {
    text += "ACHIEVEMENTS\n";
    text += subHr;
    achievements.forEach((a) => {
      text += `- ${a.title}`;
      if (a.description) text += `: ${a.description}`;
      text += "\n";
    });
    text += hr;
  }

  return text.trim();
}
