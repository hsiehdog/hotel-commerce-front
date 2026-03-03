import { Suspense } from "react";

import { DemoChatDashboard } from "@/components/chat/demo-chat-dashboard";
import { AppShell } from "@/components/layout/app-shell";

export default function DemoChatPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="px-4 py-6 text-sm text-muted-foreground">Loading chat...</div>}>
        <DemoChatDashboard />
      </Suspense>
    </AppShell>
  );
}
