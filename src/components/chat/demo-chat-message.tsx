import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { RecommendedRoom } from "@/lib/offers-demo";
import {
  ConciergeAnswerSource,
  ChatNextAction,
  ChatPendingAction,
  ChatMessageStatus,
  ChatResponseUi,
} from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { ChatOffersList } from "@/components/chat/chat-offers-list";
import {
  getDisplayPromptText,
  isConfirmOfferRecapMessage,
} from "@/components/chat/chat-message-helpers";

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
  answerType?: string | null;
  confidence?: number | null;
  sources?: ConciergeAnswerSource[];
  decisionId?: string;
  isOptimistic?: boolean;
  isRetryable?: boolean;
};

type DemoChatMessageProps = {
  message: DemoChatMessageItem;
  onRetry?: () => void;
};

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

type ResolvedSourceLink = {
  href: string;
  label: string;
};

const SOURCE_URL_KEYS = [
  "url",
  "href",
  "link",
  "uri",
  "sourceUrl",
  "source_url",
  "referenceUrl",
  "reference_url",
  "documentUrl",
  "document_url",
  "publicUrl",
  "public_url",
] as const;

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
  if (!isConfirmOfferRecapMessage(message)) {
    return [];
  }

  const responseUi = message.responseUi;
  const pendingAction = message.pendingAction;
  if (
    !responseUi ||
    responseUi.type !== "confirmation" ||
    !pendingAction ||
    typeof pendingAction === "string"
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

  const summary = responseUi.summary ?? {};
  for (const [key, value] of Object.entries(summary)) {
    pushRow(`summary:${key}`, toTitleCase(key), value);
  }

  const proposedPatch = pendingAction.proposedPatch;
  if (proposedPatch && typeof proposedPatch === "object") {
    for (const [key, value] of Object.entries(proposedPatch as Record<string, unknown>)) {
      pushRow(`patch:${key}`, toTitleCase(key), value);
    }
  }

  return rows;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function extractSourceHref(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return isHttpUrl(trimmed) ? trimmed : null;
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;

  for (const key of SOURCE_URL_KEYS) {
    const candidate = record[key];
    if (typeof candidate === "string" && isHttpUrl(candidate.trim())) {
      return candidate.trim();
    }
  }

  for (const nestedValue of Object.values(record)) {
    const nestedHref = extractSourceHref(nestedValue);
    if (nestedHref) {
      return nestedHref;
    }
  }

  return null;
}

function resolveSourceLinks(sources: ConciergeAnswerSource[] | undefined): ResolvedSourceLink[] {
  if (!sources) {
    return [];
  }

  return sources.flatMap((source, index) => {
    const href = extractSourceHref(source) ?? "";
    if (!href) {
      return [];
    }

    const labelCandidates = [source.title, source.label, source.kind];
    const label = labelCandidates.find((value) => typeof value === "string" && value.trim())?.trim() || `Source ${index + 1}`;
    return [{ href, label }];
  });
}

export function DemoChatMessage({
  message,
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
  const showErrorActions = !isUser && responseUi?.type === "error";
  const displayText = getDisplayPromptText(message);
  const showAssistantSpeechBubble = !isUser && Boolean(displayText);
  const sourceLinks = resolveSourceLinks(message.sources);
  const hasSourceMetadata = !isUser && (sourceLinks.length > 0 || message.confidence != null || message.answerType);

  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "text-sm",
          showOfferCard ? "max-w-full sm:max-w-[92%]" : "max-w-[92%] sm:max-w-[80%]",
          isUser
            ? "rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-900 shadow-sm"
            : "px-0 py-1 text-foreground",
          message.isOptimistic ? "opacity-70" : "opacity-100",
        )}
      >
        {displayText ? (
          showAssistantSpeechBubble ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm">
              <p className="whitespace-pre-wrap leading-7">{displayText}</p>
            </div>
          ) : (
            <p className="whitespace-pre-wrap leading-7">{displayText}</p>
          )
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
          <div className="mt-3 overflow-hidden rounded-3xl border border-border/60 bg-muted/70 p-3">
            <ChatOffersList recommendedRoom={message.recommendedRoom ?? null} />
          </div>
        ) : null}

        {!isUser && hasSourceMetadata ? (
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
            {message.answerType ? <Badge variant="outline">{message.answerType}</Badge> : null}
            {message.confidence != null ? (
              <Badge variant="outline">Confidence {Math.round(message.confidence * 100)}%</Badge>
            ) : null}
            {sourceLinks.map((source) => (
              <a
                key={`${source.href}-${source.label}`}
                href={source.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-full border border-border bg-background px-2.5 py-1 font-medium text-foreground transition-colors hover:bg-muted"
              >
                {source.label}
              </a>
            ))}
          </div>
        ) : null}

        {!isUser && recapRows.length > 0 ? (
          <div className="mt-3 overflow-hidden rounded-3xl border border-border/60 bg-muted/70">
            <table className="w-full text-left text-sm">
              <tbody>
                {recapRows.map((row) => (
                  <tr key={row.label} className="border-t first:border-t-0">
                    <th className="w-2/5 bg-background/40 px-4 py-3 font-medium text-foreground/70">
                      {row.label}
                    </th>
                    <td className="px-4 py-3 text-foreground">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {!isUser && showErrorActions && message.isRetryable && onRetry ? (
          <div className="mt-3">
            <Button type="button" size="sm" variant="outline" onClick={onRetry}>
              Retry
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
