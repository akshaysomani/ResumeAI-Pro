import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
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

    // 2. Fetch plan
    const subQuery = `
      SELECT status 
      FROM public.subscriptions 
      WHERE user_id = $1 AND status = 'active'
      LIMIT 1
    `;
    const { rows: subRows } = await db.query(subQuery, [user.id]);
    const plan = subRows.length > 0 ? "pro" : "free";

    // 3. Fetch count
    const countQuery = `
      SELECT COUNT(*) as count 
      FROM public.ai_generations 
      WHERE user_id = $1 AND created_at >= date_trunc('day', timezone('UTC', now()))
    `;
    const { rows: countRows } = await db.query(countQuery, [user.id]);
    const count = parseInt(countRows[0].count, 10);

    return NextResponse.json({
      count,
      limit: 5,
      plan,
    });
  } catch (error: any) {
    console.error("Error in AI usage route:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
