import React from "react";
import PrivacyClient from "./privacy-client";

export const metadata = {
  title: "Privacy Center | ResumeAI Pro",
  description: "Manage your GDPR, CCPA consent parameters, cookie options, and request account erasure.",
};

export default function PrivacyPage() {
  return <PrivacyClient />;
}
