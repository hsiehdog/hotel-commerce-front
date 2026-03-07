import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { RecommendedRoom } from "@/lib/offers-demo";
import {
  ChatNextAction,
  ChatPendingAction,
  ChatMessageStatus,
  ChatResponseUiOption,
  ChatResponseUi,
} from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { ChatOffersList } from "@/components/chat/chat-offers-list";

export type DemoChatMessageItem = {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: string;
  status?: ChatMessageStatus;
  nextAction?: ChatNextAction;
  pendingAction?: ChatPendingAction | null;
  responseUi?: ChatResponseUi;
  recommendedRoom?: RecommendedRoom | null;
  decisionId?: string;
  isOptimistic?: boolean;
  isRetryable?: boolean;
};

type DemoChatMessageProps = {
  message: DemoChatMessageItem;
  showConfirmationActions?: boolean;
  onConfirmationReply?: (value: "yes" | "no") => void;
  onSelectOption?: (value: string) => void;
  confirmationPending?: boolean;
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

function formatPendingAction(value: ChatPendingAction | null | undefined): string | null {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value.type === "string" && value.type.trim()) {
    return value.type;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return "object";
  }
}

type RecapRow = {
  label: string;
  value: string;
};

function toTitleCase(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase())
    .trim();
}

function formatRecapValue(value: unknown): string | null {
  if (value == null) {
    return null;
  }

  if (typeof value === "string") {
    return value.trim() || null;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    const formatted = value
      .map((entry) => formatRecapValue(entry))
      .filter((entry): entry is string => Boolean(entry));
    return formatted.length > 0 ? formatted.join(", ") : null;
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const preferred = [
      record.label,
      record.name,
      record.title,
      record.displayValue,
      record.value,
      record.id,
    ];
    for (const entry of preferred) {
      const formatted = formatRecapValue(entry);
      if (formatted) {
        return formatted;
      }
    }
  }

  return null;
}

function buildRecapRows(message: DemoChatMessageItem): RecapRow[] {
  if (
    !message.pendingAction ||
    typeof message.pendingAction === "string" ||
    message.pendingAction.type !== "confirm_offer_recap" ||
    message.responseUi?.type !== "confirmation"
  ) {
    return [];
  }

  const rows: RecapRow[] = [];
  const seen = new Set<string>();
  const pushRow = (key: string, label: string, value: unknown) => {
    const formatted = formatRecapValue(value);
    if (!formatted || seen.has(key)) {
      return;
    }
    seen.add(key);
    rows.push({ label, value: formatted });
  };

  const summary = message.responseUi.summary ?? {};
  for (const [key, value] of Object.entries(summary)) {
    pushRow(`summary:${key}`, toTitleCase(key), value);
  }

  const proposedPatch = message.pendingAction.proposedPatch;
  if (proposedPatch && typeof proposedPatch === "object") {
    for (const [key, value] of Object.entries(proposedPatch as Record<string, unknown>)) {
      pushRow(`patch:${key}`, toTitleCase(key), value);
    }
  }

  return rows;
}

export function DemoChatMessage({
  message,
  showConfirmationActions = false,
  onConfirmationReply,
  onSelectOption,
  confirmationPending = false,
  onRetry,
}: DemoChatMessageProps) {
  const isUser = message.role === "user";
  const shouldShowDebugBadges = process.env.NODE_ENV !== "production";
  const responseUi = message.responseUi;
  const pendingActionLabel = formatPendingAction(message.pendingAction);
  const recapRows = buildRecapRows(message);
  const showOfferCard =
    !isUser &&
    responseUi?.type === "offer_recommendation" &&
    responseUi.showRecommendedRoom !== false &&
    Boolean(message.recommendedRoom);
  const showConfirmationActionsInline =
    !isUser &&
    (responseUi?.type === "confirmation" || responseUi?.type === "question") &&
    responseUi.answerMode === "yes_no" &&
    showConfirmationActions &&
    Boolean(onConfirmationReply);
  const showSelectionActionsInline =
    !isUser &&
    responseUi?.type === "selection" &&
    responseUi.answerMode === "single_choice" &&
    showConfirmationActions &&
    Boolean(onSelectOption) &&
    responseUi.options.length > 0;
  const showErrorActions = !isUser && responseUi?.type === "error";

  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "text-sm",
          showOfferCard ? "max-w-full sm:max-w-[92%]" : "max-w-[92%] sm:max-w-[80%]",
          showOfferCard ? "rounded-none border-0 bg-transparent px-0 py-0 shadow-none" : "rounded-2xl border px-4 py-2 shadow-sm",
          isUser ? "bg-primary text-primary-foreground" : showOfferCard ? "text-foreground" : "bg-muted/60 text-foreground",
          message.isOptimistic ? "opacity-70" : "opacity-100",
        )}
      >
        {message.text ? (
          <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
        ) : null}
        {!isUser && shouldShowDebugBadges && message.status ? (
          <div className="mt-2 flex flex-wrap gap-1">
            <Badge variant="outline">{message.status}</Badge>
            {message.nextAction ? <Badge variant="secondary">{message.nextAction}</Badge> : null}
            {pendingActionLabel ? <Badge variant="outline">Pending: {pendingActionLabel}</Badge> : null}
            {message.decisionId ? <Badge variant="outline">Decision: {message.decisionId}</Badge> : null}
          </div>
        ) : null}

        {!isUser && showOfferCard ? (
          <ChatOffersList recommendedRoom={message.recommendedRoom ?? null} />
        ) : null}

        {!isUser && recapRows.length > 0 ? (
          <div className="mt-3 overflow-hidden rounded-xl border bg-background/80">
            <table className="w-full text-left text-sm">
              <tbody>
                {recapRows.map((row) => (
                  <tr key={row.label} className="border-t first:border-t-0">
                    <th className="w-2/5 bg-muted/40 px-3 py-2 font-medium text-foreground/80">
                      {row.label}
                    </th>
                    <td className="px-3 py-2 text-foreground">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {!isUser && showConfirmationActionsInline ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              className="min-w-20 rounded-full"
              disabled={confirmationPending}
              onClick={() => onConfirmationReply?.("yes")}
            >
              Yes
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="min-w-20 rounded-full"
              disabled={confirmationPending}
              onClick={() => onConfirmationReply?.("no")}
            >
              No
            </Button>
          </div>
        ) : null}

        {!isUser && showSelectionActionsInline ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {responseUi.options.map((option: ChatResponseUiOption) => (
              <Button
                key={option.value}
                type="button"
                size="sm"
                variant="outline"
                className="rounded-full"
                disabled={confirmationPending}
                onClick={() => onSelectOption?.(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        ) : null}

        {!isUser && showErrorActions && message.isRetryable && onRetry ? (
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
