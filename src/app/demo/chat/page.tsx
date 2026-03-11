import { DemoChatDashboard } from "@/components/chat/demo-chat-dashboard";
import { AppShellSuspense } from "@/components/layout/app-shell-suspense";

export default function DemoChatPage() {
  return (
    <AppShellSuspense fallbackLabel="Loading chat...">
      <DemoChatDashboard />
    </AppShellSuspense>
  );
}
