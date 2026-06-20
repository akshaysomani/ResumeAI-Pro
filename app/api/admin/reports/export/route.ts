import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getUserRoleAndStatusAction } from "@/app/actions/adminActions";
import { hasPermission } from "@/lib/rbac";

function escapeCSV(val: any): string {
  if (val === null || val === undefined) return "";
  let str = typeof val === "object" ? JSON.stringify(val) : String(val);
  str = str.replace(/"/g, '""');
  if (str.includes(",") || str.includes("\n") || str.includes('"')) {
    return `"${str}"`;
  }
  return str;
}

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 2. Fetch user's role mapping and check permission
    const { role, isSuspended } = await getUserRoleAndStatusAction(user.id, user.email || "");
    if (isSuspended) {
      return new NextResponse("User is suspended", { status: 403 });
    }

    if (!hasPermission(role, "export_reports")) {
      return new NextResponse("Forbidden: Insufficient Permissions", { status: 403 });
    }

    // 3. Get search params
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "users"; // users, payments, audit_logs
    const format = searchParams.get("format") || "csv"; // csv, spreadsheet, pdf

    let data: any[] = [];
    let headers: string[] = [];
    let title = "";

    // 4. Query data based on type
    if (type === "users") {
      title = "System Users Report";
      const query = `
        SELECT 
          p.id, 
          p.email, 
          p.full_name as "fullName", 
          p.created_at as "createdAt",
          COALESCE(ur.role, 'user') as role,
          COALESCE(ur.is_suspended, false) as "isSuspended"
        FROM public.profiles p
        LEFT JOIN public.user_roles ur ON p.id = ur.user_id
        ORDER BY p.created_at DESC
      `;
      const { rows } = await db.query(query);
      data = rows;
      headers = ["ID", "Email", "Full Name", "Role", "Suspended", "Created At"];
    } else if (type === "payments") {
      title = "Revenue and Payments Report";
      const query = `
        SELECT 
          pay.id, 
          pay.user_id as "userId",
          p.email,
          p.full_name as "fullName",
          pay.amount,
          pay.status,
          pay.provider_payment_id as "providerPaymentId",
          pay.created_at as "createdAt"
        FROM public.payments pay
        JOIN public.profiles p ON pay.user_id = p.id
        ORDER BY pay.created_at DESC
      `;
      const { rows } = await db.query(query);
      data = rows;
      headers = ["ID", "User ID", "Email", "Full Name", "Amount", "Status", "Provider Payment ID", "Created At"];
    } else if (type === "audit_logs") {
      title = "Admin Audit Logs Report";
      const query = `
        SELECT 
          l.id, 
          l.actor_id as "actorId",
          p.full_name as "actorName",
          l.action, 
          l.target_type as "targetType",
          l.target_id as "targetId", 
          l.ip_address as "ipAddress",
          l.created_at as "createdAt"
        FROM public.admin_audit_logs l
        LEFT JOIN public.profiles p ON l.actor_id = p.id
        ORDER BY l.created_at DESC
      `;
      const { rows } = await db.query(query);
      data = rows;
      headers = ["ID", "Actor ID", "Actor Name", "Action", "Target Type", "Target ID", "IP Address", "Created At"];
    } else {
      return new NextResponse("Invalid report type", { status: 400 });
    }

    // 5. Format response
    if (format === "csv" || format === "spreadsheet") {
      let csvContent = headers.join(",") + "\n";
      for (const row of data) {
        let values: string[] = [];
        if (type === "users") {
          values = [
            row.id,
            row.email,
            row.fullName,
            row.role,
            row.isSuspended ? "TRUE" : "FALSE",
            row.createdAt ? new Date(row.createdAt).toISOString() : ""
          ];
        } else if (type === "payments") {
          values = [
            row.id,
            row.userId,
            row.email,
            row.fullName,
            row.amount,
            row.status,
            row.providerPaymentId,
            row.createdAt ? new Date(row.createdAt).toISOString() : ""
          ];
        } else if (type === "audit_logs") {
          values = [
            row.id,
            row.actorId,
            row.actorName,
            row.action,
            row.targetType,
            row.targetId,
            row.ipAddress,
            row.createdAt ? new Date(row.createdAt).toISOString() : ""
          ];
        }
        csvContent += values.map(escapeCSV).join(",") + "\n";
      }

      const filename = `resumeai-report-${type}-${new Date().toISOString().split("T")[0]}.csv`;

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`
        }
      });
    } else if (format === "pdf") {
      // Return a print-ready HTML page
      let htmlRows = "";
      for (const row of data) {
        htmlRows += "<tr>";
        if (type === "users") {
          htmlRows += `
            <td style="padding:8px;border-bottom:1px solid #ddd;">${row.id}</td>
            <td style="padding:8px;border-bottom:1px solid #ddd;">${row.email || ""}</td>
            <td style="padding:8px;border-bottom:1px solid #ddd;">${row.fullName || ""}</td>
            <td style="padding:8px;border-bottom:1px solid #ddd;"><strong>${row.role}</strong></td>
            <td style="padding:8px;border-bottom:1px solid #ddd;">${row.isSuspended ? '<span style="color:red">Suspended</span>' : "Active"}</td>
            <td style="padding:8px;border-bottom:1px solid #ddd;">${row.createdAt ? new Date(row.createdAt).toLocaleString() : ""}</td>
          `;
        } else if (type === "payments") {
          htmlRows += `
            <td style="padding:8px;border-bottom:1px solid #ddd;">${row.id}</td>
            <td style="padding:8px;border-bottom:1px solid #ddd;">${row.email || ""} (${row.fullName || ""})</td>
            <td style="padding:8px;border-bottom:1px solid #ddd;">$${parseFloat(row.amount).toFixed(2)}</td>
            <td style="padding:8px;border-bottom:1px solid #ddd;"><strong>${row.status.toUpperCase()}</strong></td>
            <td style="padding:8px;border-bottom:1px solid #ddd;">${row.providerPaymentId || "N/A"}</td>
            <td style="padding:8px;border-bottom:1px solid #ddd;">${row.createdAt ? new Date(row.createdAt).toLocaleString() : ""}</td>
          `;
        } else if (type === "audit_logs") {
          htmlRows += `
            <td style="padding:8px;border-bottom:1px solid #ddd;">${row.id}</td>
            <td style="padding:8px;border-bottom:1px solid #ddd;">${row.actorName || "System"} (${row.actorId || "N/A"})</td>
            <td style="padding:8px;border-bottom:1px solid #ddd;"><strong>${row.action}</strong></td>
            <td style="padding:8px;border-bottom:1px solid #ddd;">${row.targetType}</td>
            <td style="padding:8px;border-bottom:1px solid #ddd;">${row.targetId || "N/A"}</td>
            <td style="padding:8px;border-bottom:1px solid #ddd;">${row.ipAddress || "N/A"}</td>
            <td style="padding:8px;border-bottom:1px solid #ddd;">${row.createdAt ? new Date(row.createdAt).toLocaleString() : ""}</td>
          `;
        }
        htmlRows += "</tr>";
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: sans-serif; margin: 40px; color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { text-align: left; background-color: #f4f4f5; padding: 10px; border-bottom: 2px solid #ddd; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .footer { margin-top: 40px; font-size: 12px; color: #777; border-top: 1px solid #ddd; padding-top: 10px; }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 style="margin: 0; font-size: 24px;">ResumeAI Pro</h1>
              <h2 style="margin: 5px 0 0 0; font-size: 18px; color: #555;">${title}</h2>
            </div>
            <div class="no-print">
              <button onclick="window.print()" style="padding: 10px 20px; background-color: #4f46e5; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
                Print / Save PDF
              </button>
            </div>
          </div>
          <p style="font-size: 14px; color: #666;">Generated on: ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                ${headers.map(h => `<th>${h}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${htmlRows}
            </tbody>
          </table>
          <div class="footer">
            ResumeAI Pro Enterprise Administration Platform - Confidential
          </div>
        </body>
        </html>
      `;

      return new NextResponse(htmlContent, {
        headers: {
          "Content-Type": "text/html; charset=utf-8"
        }
      });
    }

    return new NextResponse("Format not supported", { status: 400 });
  } catch (err: any) {
    console.error("Export endpoint failed:", err);
    return new NextResponse("Internal Server Error: " + err.message, { status: 500 });
  }
}
