"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Mail, ArrowRight, ChevronLeft } from "lucide-react";

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto rounded-full bg-indigo-50 dark:bg-indigo-950/40 p-4 h-16 w-16 flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400">
            <Mail className="h-8 w-8 animate-bounce" />
          </div>
          <CardTitle className="text-lg font-bold">Verify Your Email</CardTitle>
          <CardDescription className="text-xs">
            We have dispatched an activation link to your email address.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          <p>
            Please check your spam or promotions folders if you do not receive the verification link within 2 minutes. Click the link in the email to activate your profile workspace.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 pt-4 border-t">
          <Link href="/auth" className="w-full">
            <Button className="w-full" variant="outline">
              <ChevronLeft className="mr-1.5 h-4 w-4" /> Back to Sign In
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
