import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, password } = body;

    if (!slug || !password) {
      return NextResponse.json(
        { error: "Slug and password are required." },
        { status: 400 }
      );
    }

    // 1. Fetch password hash matching slug
    const query = `SELECT password_hash FROM public.career_document_shares WHERE unique_slug = $1`;
    const { rows } = await db.query(query, [slug]);

    if (rows.length === 0) {
      return NextResponse.json({ error: "Share settings not found." }, { status: 404 });
    }

    const correctHash = rows[0].password_hash;
    const hashedInput = hashPassword(password);

    if (hashedInput !== correctHash) {
      return NextResponse.json({ error: "Invalid password." }, { status: 401 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Password verification error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
