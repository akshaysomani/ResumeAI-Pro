import { NextRequest, NextResponse } from "next/server";
import { generateDocumentDocx } from "@/lib/docx-generator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, content } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Missing required fields: title and content." },
        { status: 400 }
      );
    }

    const blob = await generateDocumentDocx(title, content);
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(title)}.docx"`,
      },
    });
  } catch (error: any) {
    console.error("Error exporting Word document:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate Word document." },
      { status: 500 }
    );
  }
}
