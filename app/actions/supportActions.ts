"use server";

import { db } from "@/lib/db";

export async function createContactTicketAction(data: {
  userId?: string | null;
  name: string;
  email: string;
  category: string;
  subject: string;
  message: string;
}): Promise<{ success: boolean; message: string; ticketId?: string }> {
  try {
    // Validate inputs
    if (!data.name.trim() || !data.email.trim() || !data.subject.trim() || !data.message.trim()) {
      return { success: false, message: "Please fill in all required fields." };
    }

    console.log("Contact form submission received:", data);

    // If authenticated, we log it into the support_tickets table
    if (data.userId) {
      const query = `
        INSERT INTO public.support_tickets (user_id, title, description, category, priority, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, 'open', NOW(), NOW())
        RETURNING id
      `;
      // Map incoming categories to valid support_tickets categories ('billing', 'technical', 'feedback', 'other')
      let dbCategory = "other";
      const normalizedCategory = data.category.toLowerCase();
      if (normalizedCategory.includes("billing")) {
        dbCategory = "billing";
      } else if (normalizedCategory.includes("tech") || normalizedCategory.includes("bug")) {
        dbCategory = "technical";
      } else if (normalizedCategory.includes("feedback") || normalizedCategory.includes("feature")) {
        dbCategory = "feedback";
      }

      const { rows } = await db.query(query, [
        data.userId,
        data.subject,
        data.message,
        dbCategory,
        "medium" // Default priority
      ]);

      const ticketId = rows[0]?.id;
      return { 
        success: true, 
        message: "Support ticket created successfully! We will get back to you shortly.",
        ticketId 
      };
    } else {
      // Anonymous submission
      return { 
        success: true, 
        message: "Thank you for contacting us! We have received your inquiry and will respond to you soon." 
      };
    }
  } catch (error: any) {
    console.error("Error creating contact ticket:", error);
    return { success: false, message: error.message || "An unexpected error occurred. Please try again." };
  }
}
