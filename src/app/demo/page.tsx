import { DemoCheckoutDashboard } from "@/components/checkout/demo-checkout-dashboard";
import { AppShellSuspense } from "@/components/layout/app-shell-suspense";

export default function DemoCheckoutPage() {
  return (
    <AppShellSuspense fallbackLabel="Loading checkout...">
      <DemoCheckoutDashboard />
    </AppShellSuspense>
  );
}
