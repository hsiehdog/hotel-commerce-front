import { Suspense, type ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";

type AppShellSuspenseProps = {
  children: ReactNode;
  fallbackLabel: string;
};

function LoadingState({ label }: { label: string }) {
  return (
    <div className="px-4 py-6 text-sm text-muted-foreground">
      {label}
    </div>
  );
}

export function AppShellSuspense({
  children,
  fallbackLabel,
}: AppShellSuspenseProps) {
  return (
    <AppShell>
      <Suspense fallback={<LoadingState label={fallbackLabel} />}>
        {children}
      </Suspense>
    </AppShell>
  );
}
