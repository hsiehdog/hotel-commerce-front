import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChatNextAction, ChatOffer, ChatMessageStatus } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { ChatOffersList } from "@/components/chat/chat-offers-list";

export type DemoChatMessageItem = {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: string;
  status?: ChatMessageStatus;
  nextAction?: ChatNextAction;
  offers?: ChatOffer[];
  decisionId?: string;
  isOptimistic?: boolean;
  isRetryable?: boolean;
};

type DemoChatMessageProps = {
  message: DemoChatMessageItem;
  onRetry?: () => void;
};

function formatTimestamp(value?: string) {
  if (!value) {
    return "Just now";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DemoChatMessage({ message, onRetry }: DemoChatMessageProps) {
  const isUser = message.role === "user";
  const shouldShowDebugBadges = process.env.NODE_ENV !== "production";

  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[92%] rounded-2xl border px-4 py-2 text-sm shadow-sm sm:max-w-[80%]",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted/60 text-foreground",
          message.isOptimistic ? "opacity-70" : "opacity-100",
        )}
      >
        <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
        {!isUser && shouldShowDebugBadges && message.status ? (
          <div className="mt-2 flex flex-wrap gap-1">
            <Badge variant="outline">{message.status}</Badge>
            {message.nextAction ? <Badge variant="secondary">{message.nextAction}</Badge> : null}
            {message.decisionId ? <Badge variant="outline">Decision: {message.decisionId}</Badge> : null}
          </div>
        ) : null}

        {!isUser && message.status === "OK" && (message.offers?.length ?? 0) > 0 ? (
          <ChatOffersList offers={message.offers || []} />
        ) : null}

        {!isUser && message.status === "ERROR" && message.isRetryable && onRetry ? (
          <div className="mt-3">
            <Button type="button" size="sm" variant="outline" onClick={onRetry}>
              Retry
            </Button>
          </div>
        ) : null}

        <p className="mt-2 text-xs text-muted-foreground/80">{formatTimestamp(message.createdAt)}</p>
      </div>
    </div>
  );
}
