"use client";

import { AuthPageShell } from "@/components/auth/auth-page-shell";

export default function SignupPage() {
  return (
    <AuthPageShell
      eyebrow="Fast onboarding"
      title="Build AI-driven software faster than ever"
      description="Create your workspace, wire Better Auth into the backend, and start testing chat-based workflows instantly."
      mode="signup"
    />
  );
}
