import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { queryResumes } from "@/services/dbService";

export async function GET() {
  try {
    // 1. Direct PG pool check
    const profiles = await db.query("SELECT id, email, full_name FROM public.profiles");
    const resumes = await db.query("SELECT id, user_id, title, status, is_archived FROM public.resumes");
    
    // 2. queryResumes function check
    const queryResult = await queryResumes({
      userId: "345b3671-a205-4854-8650-3a42ddc720ac",
      limit: 10,
      sortBy: "updated_at",
      sortOrder: "desc",
      filterStatus: "all"
    });

    return NextResponse.json({
      dbUrl: process.env.DATABASE_URL ? "defined" : "undefined",
      directProfiles: profiles.rows,
      directResumes: resumes.rows,
      queryResult
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 });
  }
}
