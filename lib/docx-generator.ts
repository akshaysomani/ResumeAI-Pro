import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from "docx";
import type { Resume } from "@/types";

export async function generateDocx(resume: Resume): Promise<Blob> {
  const children: any[] = [];

  // Helper to extract sections
  const getSectionContent = (type: string) => {
    const sec = resume.sections.find((s) => s.sectionType === type);
    return sec?.content?.isVisible !== false ? sec?.content : null;
  };

  // 1. Personal Information (Header Block)
  const personal = getSectionContent("personal");
  if (personal) {
    const nameParagraph = new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: personal.fullName || "User Name",
          bold: true,
          size: 32, // 16pt
        }),
      ],
    });
    children.push(nameParagraph);

    const headlineText = personal.headline
      ? [
          new TextRun({
            text: personal.headline,
            italics: true,
            size: 24, // 12pt
          }),
        ]
      : [];
    if (headlineText.length > 0) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
          children: headlineText,
        })
      );
    }

    // Contact Coordinates Line
    const contacts: string[] = [];
    if (personal.email) contacts.push(personal.email);
    if (personal.phone) contacts.push(personal.phone);
    if (personal.location) contacts.push(personal.location);
    if (personal.website) contacts.push(personal.website);

    if (contacts.length > 0) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 240 },
          children: [
            new TextRun({
              text: contacts.join("  |  "),
              size: 20, // 10pt
            }),
          ],
        })
      );
    }
  }

  // Divider Line helper
  const addHorizontalDivider = () => {
    // Add thin divider style using spacing/borders or standard lines
  };

  // Section Heading Builder Helper
  const addSectionHeader = (title: string) => {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
        children: [
          new TextRun({
            text: title.toUpperCase(),
            bold: true,
            size: 22, // 11pt
          }),
        ],
      })
    );
  };

  // 2. Summary
  const summary = getSectionContent("summary");
  if (summary && summary.text) {
    addSectionHeader("Professional Summary");
    children.push(
      new Paragraph({
        spacing: { after: 180 },
        children: [
          new TextRun({
            text: summary.text,
            size: 20, // 10pt
          }),
        ],
      })
    );
  }

  // 3. Work Experience
  const experience = getSectionContent("experience");
  if (Array.isArray(experience) && experience.length > 0) {
    addSectionHeader("Work Experience");
    experience.forEach((job) => {
      // Job Title and Company Line
      children.push(
        new Paragraph({
          spacing: { before: 120, after: 60 },
          children: [
            new TextRun({
              text: `${job.role}  -  `,
              bold: true,
              size: 20,
            }),
            new TextRun({
              text: job.company,
              bold: true,
              size: 20,
            }),
            new TextRun({
              text: job.location ? ` (${job.location})` : "",
              size: 20,
            }),
            new TextRun({
              text: `\t${job.startDate || ""} - ${job.currentlyWorking ? "Present" : job.endDate || ""}`,
              size: 20,
              italics: true,
            }),
          ],
        })
      );

      // Job Description
      if (job.description) {
        // Bullet splits if paragraphs exist
        const bullets = job.description.split(/\n+/);
        bullets.forEach((bullet: string) => {
          const cleanText = bullet.replace(/^-\s*/, "").trim();
          if (cleanText) {
            children.push(
              new Paragraph({
                bullet: { level: 0 },
                spacing: { after: 60 },
                children: [new TextRun({ text: cleanText, size: 20 })],
              })
            );
          }
        });
      }
    });
  }

  // 4. Education
  const education = getSectionContent("education");
  if (Array.isArray(education) && education.length > 0) {
    addSectionHeader("Education");
    education.forEach((edu) => {
      children.push(
        new Paragraph({
          spacing: { before: 120, after: 60 },
          children: [
            new TextRun({
              text: `${edu.degree || ""} ${edu.major ? `in ${edu.major}` : ""}  -  `,
              bold: true,
              size: 20,
            }),
            new TextRun({
              text: edu.school,
              bold: true,
              size: 20,
            }),
            new TextRun({
              text: edu.location ? ` (${edu.location})` : "",
              size: 20,
            }),
            new TextRun({
              text: `\t${edu.startDate || ""} - ${edu.currentlyStudying ? "Present" : edu.endDate || ""}`,
              size: 20,
              italics: true,
            }),
          ],
        })
      );

      if (edu.gpa) {
        children.push(
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: `GPA: ${edu.gpa}`,
                size: 20,
              }),
            ],
          })
        );
      }

      if (edu.description) {
        children.push(
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: edu.description,
                size: 20,
              }),
            ],
          })
        );
      }
    });
  }

  // 5. Skills
  const skills = getSectionContent("skills");
  if (Array.isArray(skills) && skills.length > 0) {
    addSectionHeader("Skills");
    const skillList = skills.map((s) => `${s.name}${s.proficiency ? ` (${s.proficiency})` : ""}`);
    children.push(
      new Paragraph({
        spacing: { after: 180 },
        children: [
          new TextRun({
            text: skillList.join(", "),
            size: 20,
          }),
        ],
      })
    );
  }

  // 6. Projects
  const projects = getSectionContent("projects");
  if (Array.isArray(projects) && projects.length > 0) {
    addSectionHeader("Projects");
    projects.forEach((proj) => {
      children.push(
        new Paragraph({
          spacing: { before: 120, after: 60 },
          children: [
            new TextRun({
              text: proj.title,
              bold: true,
              size: 20,
            }),
            new TextRun({
              text: proj.role ? ` (${proj.role})` : "",
              size: 20,
              italics: true,
            }),
            new TextRun({
              text: `\t${proj.startDate || ""} - ${proj.endDate || ""}`,
              size: 20,
              italics: true,
            }),
          ],
        })
      );

      if (proj.description) {
        const bullets = proj.description.split(/\n+/);
        bullets.forEach((bullet: string) => {
          const cleanText = bullet.replace(/^-\s*/, "").trim();
          if (cleanText) {
            children.push(
              new Paragraph({
                bullet: { level: 0 },
                spacing: { after: 60 },
                children: [new TextRun({ text: cleanText, size: 20 })],
              })
            );
          }
        });
      }
    });
  }

  // 7. Certifications
  const certs = getSectionContent("certifications");
  if (Array.isArray(certs) && certs.length > 0) {
    addSectionHeader("Certifications");
    certs.forEach((c) => {
      children.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({
              text: `${c.name} - Issued by ${c.issuer || "Unknown"}`,
              bold: true,
              size: 20,
            }),
            new TextRun({
              text: c.issueDate ? ` (${c.issueDate}${c.expiryDate ? ` - ${c.expiryDate}` : ""})` : "",
              size: 20,
              italics: true,
            }),
          ],
        })
      );
    });
  }

  // 8. Languages
  const langs = getSectionContent("languages");
  if (Array.isArray(langs) && langs.length > 0) {
    addSectionHeader("Languages");
    const langStrs = langs.map((l) => `${l.name}${l.proficiency ? ` (${l.proficiency})` : ""}`);
    children.push(
      new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: langStrs.join(", "),
            size: 20,
          }),
        ],
      })
    );
  }

  // 9. Achievements & Awards
  const achievements = getSectionContent("achievements");
  if (Array.isArray(achievements) && achievements.length > 0) {
    addSectionHeader("Achievements");
    achievements.forEach((a) => {
      children.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({
              text: a.title,
              bold: true,
              size: 20,
            }),
            new TextRun({
              text: a.description ? `: ${a.description}` : "",
              size: 20,
            }),
          ],
        })
      );
    });
  }

  // Assemble into a Word document structure
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        children,
      },
    ],
  });

  return await Packer.toBlob(doc);
}
