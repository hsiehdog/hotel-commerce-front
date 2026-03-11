"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2, SendHorizontal } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, KeyboardEvent, useEffect, useMemo, useReducer, useRef, useState } from "react";

import { DemoChatMessage, DemoChatMessageItem } from "@/components/chat/demo-chat-message";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { ApiClientRequestError, answerConciergeQuestion, fetchProperties } from "@/lib/api-client";
import { emitChatTelemetry } from "@/lib/chat-telemetry";

const DEFAULT_PROPERTY_ID = "demo_property";
const MAX_MESSAGE_LENGTH = 1_000;
const RATE_LIMIT_FALLBACK_SECONDS = 30;
const SEND_DEBOUNCE_MS = 500;
const RETRY_STORAGE_KEY = "demo-chat-retry";

type RetryBuffer = {
  propertyId: string;
  question: string;
  clientMessageId: string;
};

type SendOptions = {
  composerOverride?: string;
  bypassDebounce?: boolean;
};

type NormalizedError = {
  type: "validation" | "rate_limit" | "server" | "network";
  message: string;
  status?: number;
  requestId?: string | null;
};

type ChatUiFlags = {
  rateLimitedUntil?: string;
};

type DemoChatState = {
  messages: DemoChatMessageItem[];
  pendingRequest: boolean;
  lastError: NormalizedError | null;
  inFlightClientMessageId: string | null;
  retryBuffer: RetryBuffer | null;
  uiFlags: ChatUiFlags;
};

type ChatAction =
  | { type: "RESET_FOR_PROPERTY"; greeting: DemoChatMessageItem }
  | { type: "SET_PENDING"; pending: boolean; clientMessageId?: string | null }
  | { type: "SET_ERROR"; error: NormalizedError | null }
  | { type: "SET_RETRY_BUFFER"; retryBuffer: RetryBuffer | null }
  | { type: "SET_RATE_LIMIT"; until?: string }
  | { type: "APPEND_MESSAGE"; message: DemoChatMessageItem };

const initialState: DemoChatState = {
  messages: [],
  pendingRequest: false,
  lastError: null,
  inFlightClientMessageId: null,
  retryBuffer: null,
  uiFlags: {},
};

function reducer(state: DemoChatState, action: ChatAction): DemoChatState {
  switch (action.type) {
    case "RESET_FOR_PROPERTY":
      return {
        ...initialState,
        messages: [action.greeting],
      };
    case "SET_PENDING":
      return {
        ...state,
        pendingRequest: action.pending,
        inFlightClientMessageId: action.pending ? action.clientMessageId || null : null,
      };
    case "SET_ERROR":
      return {
        ...state,
        lastError: action.error,
      };
    case "SET_RETRY_BUFFER":
      return {
        ...state,
        retryBuffer: action.retryBuffer,
      };
    case "SET_RATE_LIMIT":
      return {
        ...state,
        uiFlags: {
          ...state.uiFlags,
          rateLimitedUntil: action.until,
        },
      };
    case "APPEND_MESSAGE":
      return {
        ...state,
        messages: [...state.messages, action.message],
      };
    default:
      return state;
  }
}

function nowIso() {
  return new Date().toISOString();
}

function createClientMessageId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `message-${Date.now()}`;
}

function parseStoredRetry(propertyId: string): RetryBuffer | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(RETRY_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as { propertyId: string; retryBuffer: RetryBuffer };
    return parsed.propertyId === propertyId ? parsed.retryBuffer : null;
  } catch {
    return null;
  }
}

function buildGreetingMessage(propertyId: string): DemoChatMessageItem {
  return {
    id: `${propertyId}-greeting`,
    role: "assistant",
    text: "Ask me anything about this property, including amenities, policies, parking, or dining.",
    createdAt: nowIso(),
  };
}

export function DemoChatDashboard() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [state, dispatch] = useReducer(reducer, initialState);
  const [composerValue, setComposerValue] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState(
    () => searchParams.get("propertyId") ?? DEFAULT_PROPERTY_ID,
  );
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const lastSendRef = useRef<number>(0);

  const propertiesQuery = useQuery({
    queryKey: ["chat-properties"],
    queryFn: () => fetchProperties({ activeOnly: true }),
  });

  const propertyOptions = useMemo(() => {
    const seen = new Set<string>();
    const options = [{ propertyId: DEFAULT_PROPERTY_ID, name: "Demo Property" }];
    seen.add(DEFAULT_PROPERTY_ID);

    for (const entry of propertiesQuery.data ?? []) {
      if (seen.has(entry.propertyId)) {
        continue;
      }
      seen.add(entry.propertyId);
      options.push(entry);
    }

    return options;
  }, [propertiesQuery.data]);

  const isRateLimited = Boolean(
    state.uiFlags.rateLimitedUntil && new Date(state.uiFlags.rateLimitedUntil).getTime() > Date.now(),
  );
  const rateLimitSeconds = state.uiFlags.rateLimitedUntil
    ? Math.max(0, Math.ceil((new Date(state.uiFlags.rateLimitedUntil).getTime() - Date.now()) / 1000))
    : 0;
  const composerDisabled = state.pendingRequest || isRateLimited;

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView?.({ behavior: "smooth" });
  }, [state.messages, state.pendingRequest]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("propertyId", selectedPropertyId);
    const next = params.toString();
    if (next !== searchParams.toString()) {
      router.replace(`${pathname}?${next}`, { scroll: false });
    }
  }, [pathname, router, searchParams, selectedPropertyId]);

  useEffect(() => {
    dispatch({
      type: "RESET_FOR_PROPERTY",
      greeting: buildGreetingMessage(selectedPropertyId),
    });
    const storedRetry = parseStoredRetry(selectedPropertyId);
    if (storedRetry) {
      dispatch({ type: "SET_RETRY_BUFFER", retryBuffer: storedRetry });
    }
  }, [selectedPropertyId]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (state.retryBuffer) {
      window.sessionStorage.setItem(
        RETRY_STORAGE_KEY,
        JSON.stringify({
          propertyId: selectedPropertyId,
          retryBuffer: state.retryBuffer,
        }),
      );
    } else {
      window.sessionStorage.removeItem(RETRY_STORAGE_KEY);
    }
  }, [selectedPropertyId, state.retryBuffer]);

  async function handleSend(payloadOverride?: RetryBuffer, options?: SendOptions) {
    if (state.pendingRequest || isRateLimited) {
      return;
    }

    if (!payloadOverride && !options?.bypassDebounce && Date.now() - lastSendRef.current < SEND_DEBOUNCE_MS) {
      return;
    }

    const trimmed = (options?.composerOverride ?? composerValue).trim();
    if (!payloadOverride && !trimmed) {
      return;
    }

    if (!payloadOverride && trimmed.length > MAX_MESSAGE_LENGTH) {
      dispatch({
        type: "SET_ERROR",
        error: {
          type: "validation",
          message: `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters.`,
        },
      });
      return;
    }

    lastSendRef.current = Date.now();

    const payload = payloadOverride ?? {
      propertyId: selectedPropertyId,
      question: trimmed,
      clientMessageId: createClientMessageId(),
    };

    dispatch({ type: "SET_PENDING", pending: true, clientMessageId: payload.clientMessageId });
    dispatch({ type: "SET_ERROR", error: null });
    dispatch({ type: "SET_RATE_LIMIT" });
    dispatch({ type: "SET_RETRY_BUFFER", retryBuffer: payload });

    if (!payloadOverride) {
      dispatch({
        type: "APPEND_MESSAGE",
        message: {
          id: payload.clientMessageId,
          role: "user",
          text: payload.question,
          createdAt: nowIso(),
          isOptimistic: true,
        },
      });
      setComposerValue("");
      emitChatTelemetry("chat_message_sent", {
        propertyId: payload.propertyId,
        clientMessageId: payload.clientMessageId,
      });
    } else {
      emitChatTelemetry("chat_message_retry", {
        propertyId: payload.propertyId,
        clientMessageId: payload.clientMessageId,
      });
    }

    const startedAt = performance.now();

    try {
      const response = await answerConciergeQuestion(payload.propertyId, payload.question);
      const latencyMs = Math.round(performance.now() - startedAt);

      dispatch({
        type: "APPEND_MESSAGE",
        message: {
          id: `${payload.clientMessageId}-assistant-${Date.now()}`,
          role: "assistant",
          text: response.answer,
          createdAt: nowIso(),
          answerType: response.answerType,
          confidence: response.confidence,
          sources: response.sources,
        },
      });

      dispatch({ type: "SET_RETRY_BUFFER", retryBuffer: null });
      emitChatTelemetry("chat_response_received", {
        propertyId: payload.propertyId,
        clientMessageId: payload.clientMessageId,
        latencyMs,
        sourceCount: response.sources.length,
        answerType: response.answerType,
      });
    } catch (error) {
      if (error instanceof ApiClientRequestError) {
        if (error.status === 429) {
          const cooldownSeconds = error.retryAfterSeconds ?? RATE_LIMIT_FALLBACK_SECONDS;
          const untilIso = new Date(Date.now() + cooldownSeconds * 1000).toISOString();
          dispatch({ type: "SET_RATE_LIMIT", until: untilIso });
          dispatch({
            type: "SET_ERROR",
            error: {
              type: "rate_limit",
              message: `Rate limited. Try again in ${cooldownSeconds}s.`,
              status: 429,
              requestId: error.requestId,
            },
          });
        } else if (error.status === 400) {
          dispatch({
            type: "SET_ERROR",
            error: {
              type: "validation",
              message: error.message || "Invalid request payload.",
              status: 400,
              requestId: error.requestId,
            },
          });
        } else {
          dispatch({
            type: "SET_ERROR",
            error: {
              type: "server",
              message: "Something went wrong. Retry your message.",
              status: error.status,
              requestId: error.requestId,
            },
          });
        }
        emitChatTelemetry("chat_error_http", {
          propertyId: payload.propertyId,
          clientMessageId: payload.clientMessageId,
          httpStatus: error.status,
          requestId: error.requestId,
        });
      } else {
        dispatch({
          type: "SET_ERROR",
          error: {
            type: "network",
            message: "Network error. Retry with the same message.",
          },
        });
        emitChatTelemetry("chat_error_network", {
          propertyId: payload.propertyId,
          clientMessageId: payload.clientMessageId,
        });
      }
    } finally {
      dispatch({ type: "SET_PENDING", pending: false });
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await handleSend(undefined, { bypassDebounce: true });
  }

  async function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();
    await handleSend(undefined, { bypassDebounce: true });
  }

  async function handleRetry() {
    if (!state.retryBuffer) {
      return;
    }

    await handleSend(state.retryBuffer);
  }

  function handleRestart() {
    if (typeof window !== "undefined") {
      const shouldRestart = window.confirm("Start a new chat? Current messages will be cleared.");
      if (!shouldRestart) {
        return;
      }
    }

    dispatch({
      type: "RESET_FOR_PROPERTY",
      greeting: buildGreetingMessage(selectedPropertyId),
    });
    setComposerValue("");
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <Card className="h-fit border-border/60 bg-card/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Chat Setup</CardTitle>
          <CardDescription>Select a property to scope this conversation.</CardDescription>
        </CardHeader>
        <CardContent>
          <label htmlFor="chat-property" className="mb-1 block text-sm font-medium">
            Property
          </label>
          <select
            id="chat-property"
            value={selectedPropertyId}
            onChange={(event) => setSelectedPropertyId(event.target.value)}
            disabled={propertiesQuery.isLoading}
            className="block h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          >
            {propertyOptions.map((property) => (
              <option key={property.propertyId} value={property.propertyId}>
                {property.name}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-white shadow-sm">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="text-lg">AI Conversation</CardTitle>
          <CardAction>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full bg-white"
              onClick={handleRestart}
              disabled={state.pendingRequest}
            >
              Start new chat
            </Button>
          </CardAction>
          <CardDescription>
            Concierge answers are scoped to the selected property and stored only in this browser session.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          {state.lastError ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              <div>{state.lastError.message}</div>
              {state.retryBuffer ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={() => void handleRetry()}
                >
                  Retry
                </Button>
              ) : null}
            </div>
          ) : null}

          {isRateLimited ? (
            <div className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-amber-900">
              Rate limited. You can send again in {rateLimitSeconds}s.
            </div>
          ) : null}

          <ScrollArea className="h-[56vh] min-h-[340px]">
            <div className="flex flex-col gap-6 px-3 py-2 sm:px-5">
              {state.messages.map((message) => (
                <DemoChatMessage
                  key={message.id}
                  message={message}
                  onRetry={handleRetry}
                />
              ))}

              {state.pendingRequest ? (
                <div className="text-xs text-muted-foreground">Assistant is thinking...</div>
              ) : null}

              <div ref={endOfMessagesRef} />
            </div>
          </ScrollArea>

          <form
            onSubmit={handleSubmit}
            className="rounded-[28px] border border-border/60 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.08)]"
          >
            <Textarea
              placeholder="Type your request..."
              value={composerValue}
              onChange={(event) => setComposerValue(event.target.value)}
              onKeyDown={(event) => void handleComposerKeyDown(event)}
              className="min-h-[104px] resize-none border-0 bg-transparent px-1 py-1 text-[15px] shadow-none focus-visible:ring-0"
              maxLength={MAX_MESSAGE_LENGTH + 100}
              disabled={composerDisabled}
            />
            <div className="mt-3 flex items-end justify-end gap-3 border-t border-border/50 pt-3">
              <Button
                type="submit"
                className="rounded-full"
                disabled={composerDisabled}
              >
                {state.pendingRequest ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send
                    <SendHorizontal className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
