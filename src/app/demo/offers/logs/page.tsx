import { OffersLogsDashboard } from "@/components/offers/offers-logs-dashboard";
import { AppShellSuspense } from "@/components/layout/app-shell-suspense";

export default function OffersLogsPage() {
  return (
    <AppShellSuspense fallbackLabel="Loading logs...">
      <OffersLogsDashboard />
    </AppShellSuspense>
  );
}
