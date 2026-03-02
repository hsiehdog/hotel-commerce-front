import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { OffersLogsDashboard } from "@/components/offers/offers-logs-dashboard";

export default function OffersLogsPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="px-4 py-6 text-sm text-muted-foreground">Loading logs...</div>}>
        <OffersLogsDashboard />
      </Suspense>
    </AppShell>
  );
}
