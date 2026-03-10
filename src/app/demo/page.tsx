import { Suspense } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { DemoCheckoutDashboard } from "@/components/checkout/demo-checkout-dashboard";

export default function DemoCheckoutPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="px-4 py-6 text-sm text-muted-foreground">Loading checkout...</div>}>
        <DemoCheckoutDashboard />
      </Suspense>
    </AppShell>
  );
}
