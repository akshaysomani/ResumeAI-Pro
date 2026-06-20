import React from "react";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getUserPlanAction } from "@/app/actions/templateActions";
import { getPublicResumeBySlugAction, logShareAnalyticsAction } from "@/app/actions/shareActions";
import ClientShareView from "./ClientShareView";

interface SharePageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Generate SEO metadata for public sharing link
 */
export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const linkQuery = `
      SELECT resume_id, visibility, expiration 
      FROM public.public_resume_links 
      WHERE unique_slug = $1
    `;
    const { rows: linkRows } = await db.query(linkQuery, [slug]);

    if (linkRows.length === 0 || linkRows[0].visibility === "private") {
      return { title: "Resume Not Found - ResumeAI Pro" };
    }

    if (linkRows[0].expiration && new Date(linkRows[0].expiration) < new Date()) {
      return { title: "Expired Link - ResumeAI Pro" };
    }

    const resumeId = linkRows[0].resume_id;

    // Fetch personal info
    const personalQuery = `SELECT full_name, headline FROM public.personal_information WHERE resume_id = $1`;
    const { rows: personalRows } = await db.query(personalQuery, [resumeId]);

    const name = personalRows[0]?.full_name || "Candidate Profile";
    const headline = personalRows[0]?.headline || "Professional Resume";
    const bio = `View ${name}'s professional resume on ResumeAI Pro.`;

    const title = `${name} - ${headline} | ResumeAI Pro`;

    return {
      title,
      description: bio,
      openGraph: {
        title,
        description: bio,
        type: "profile",
        siteName: "ResumeAI Pro",
      },
      twitter: {
        card: "summary",
        title,
        description: bio,
      },
      robots: linkRows[0].is_indexable
        ? "index, follow"
        : "noindex, nofollow",
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return { title: "Resume Profile - ResumeAI Pro" };
  }
}

export default async function SharePage({ params }: SharePageProps) {
  const { slug } = await params;

  // Initial attempt to fetch public resume (without password)
  const result = await getPublicResumeBySlugAction(slug);

  // If there is an error but it isn't password required, handle statically
  if (result.error && result.error !== "password_required") {
    let errorTitle = "Profile Unavailable";
    let errorMessage = "This resume is private, expired, or does not exist.";

    if (result.error === "expired") {
      errorTitle = "Link Expired";
      errorMessage = "The sharing link for this resume has reached its expiration date.";
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6">
        <div className="max-w-md w-full text-center space-y-4 bg-white dark:bg-zinc-900 p-8 rounded-2xl border dark:border-zinc-850 shadow-md">
          <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-950/30 text-red-650 flex items-center justify-center mx-auto text-xl font-bold">
            !
          </div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{errorTitle}</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{errorMessage}</p>
          <a
            href="/"
            className="inline-block text-xs font-semibold text-indigo-600 hover:text-indigo-700 mt-2"
          >
            Go back to Home
          </a>
        </div>
      </div>
    );
  }

  // Pre-fetch owner plan to check for watermarks
  let ownerPlan: "free" | "pro" = "free";
  if (result.success && result.resume) {
    ownerPlan = await getUserPlanAction(result.resume.userId);
  }

  // Determine password locked initially
  const isPasswordLocked = result.error === "password_required";

  return (
    <ClientShareView
      slug={slug}
      initialResume={result.resume || null}
      initialSettings={result.settings || null}
      isPasswordLocked={isPasswordLocked}
      ownerPlan={ownerPlan}
    />
  );
}
