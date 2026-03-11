"use client";

import { AuthPageShell } from "@/components/auth/auth-page-shell";

export default function LoginPage() {
  return (
    <AuthPageShell
      eyebrow="Better Auth + AI"
      title="Sign in to orchestrate intelligent software"
      description="Sessions are backed by Better Auth&apos;s secure cookies, so your browser forwards credentials automatically. Use the dashboard to inspect usage and collaborate with your AI operator."
      mode="login"
    />
  );
}
