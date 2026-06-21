import { NextRequest, NextResponse } from "next/server";
import { withApiAuth } from "@/lib/api-auth";
import { getApiAnalyticsAction } from "@/app/actions/platformActions";

export async function GET(req: NextRequest) {
  return withApiAuth(req, "read:analytics", async (userId) => {
    try {
      const stats = await getApiAnalyticsAction(userId);
      return NextResponse.json({ data: stats });
    } catch (error: any) {
      console.error("GET /api/v1/analytics error:", error);
      return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
    }
  });
}
