"use client";

import { FormEvent, KeyboardEvent, RefObject, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, MessageSquareMore, RefreshCcw, SendHorizontal, Sparkles } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { DemoChatMessage, DemoChatMessageItem } from "@/components/chat/demo-chat-message";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  ApiClientRequestError,
  createChatSession,
  getChatRecommendedRoomFromResponse,
  getChatResponseUi,
  sendChatSessionMessage,
  type ChatSession,
} from "@/lib/api-client";
import {
  buildOffersGenerateRequest,
  getDefaultOffersDraft,
  parseOffersResponse,
  requestOfferGeneration,
  type OffersDraft,
  type ParsedOffersResponse,
  type RecommendedUpsell,
  type UpgradeLadderEntry,
  validateOffersDraft,
} from "@/lib/offers-demo";
import { DecisionOfferCard } from "@/components/offers/dashboard/offer-card";
import { formatMoney } from "@/components/offers/dashboard/utils";
import { useOfferPropertyOptions } from "@/components/offers/use-offer-property-options";

const DEFAULT_PROPERTY_ID = "demo_property";
const MAX_MESSAGE_LENGTH = 1_000;

function createClientMessageId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `message-${Date.now()}`;
}

function buildInitialDraft(): OffersDraft {
  return {
    ...getDefaultOffersDraft(DEFAULT_PROPERTY_ID),
    channel: "web",
  };
}

function toPositiveNumber(value: string, minimum: number): string {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return String(minimum);
  }
  return String(Math.max(minimum, Math.floor(parsed)));
}

export function DemoCheckoutDashboard() {
  const searchParams = useSearchParams();
  const { defaultPropertyId, propertyOptions, propertiesLoading } = useOfferPropertyOptions("checkout-properties");
  const [draft, setDraft] = useState<OffersDraft>(buildInitialDraft);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parsedResponse, setParsedResponse] = useState<ParsedOffersResponse | null>(null);

  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [chatMessages, setChatMessages] = useState<DemoChatMessageItem[]>([]);
  const [chatError, setChatError] = useState<string | null>(null);
  const [isChatLoading, setIsChatLoading] = useState(true);
  const [isChatSending, setIsChatSending] = useState(false);
  const [composerValue, setComposerValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const requestedPropertyId = searchParams.get("propertyId");
  const resolvedPropertyId = useMemo(() => {
    if (propertiesLoading) {
      return "";
    }

    if (requestedPropertyId && propertyOptions.some((property) => property.propertyId === requestedPropertyId)) {
      return requestedPropertyId;
    }

    return defaultPropertyId || DEFAULT_PROPERTY_ID;
  }, [defaultPropertyId, propertiesLoading, propertyOptions, requestedPropertyId]);
  const selectedPropertyName = useMemo(
    () => propertyOptions.find((property) => property.propertyId === resolvedPropertyId)?.name ?? "Demo Property",
    [propertyOptions, resolvedPropertyId],
  );

  useEffect(() => {
    if (!resolvedPropertyId || draft.property_id === resolvedPropertyId) {
      return;
    }

    setDraft((current) => ({ ...current, property_id: resolvedPropertyId }));
  }, [draft.property_id, resolvedPropertyId]);

  useEffect(() => {
    if (!resolvedPropertyId) {
      return;
    }

    let cancelled = false;

    async function startSession() {
      setIsChatLoading(true);
      setChatError(null);

      try {
        const session = await createChatSession({
          property_id: resolvedPropertyId,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          language: typeof navigator !== "undefined" ? navigator.language : "en-US",
        });
        if (cancelled) {
          return;
        }

        setChatSession(session);
        setChatMessages([
          {
            id: `${session.sessionId}-greeting`,
            role: "assistant",
            text: session.greeting,
            createdAt: session.createdAt,
          },
        ]);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setChatSession(null);
        setChatMessages([]);
        setChatError(error instanceof Error ? error.message : "Unable to start concierge chat.");
      } finally {
        if (!cancelled) {
          setIsChatLoading(false);
        }
      }
    }

    void startSession();

    return () => {
      cancelled = true;
    };
  }, [resolvedPropertyId]);

  useEffect(() => {
    if (typeof messagesEndRef.current?.scrollIntoView === "function") {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isChatSending]);

  async function handleOfferSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const errors = validateOffersDraft(draft, null);
    setFormErrors(errors);
    setApiError(null);

    if (errors.length > 0) {
      return;
    }

    const payload = buildOffersGenerateRequest(draft, {});
    setIsSubmitting(true);

    try {
      const response = await requestOfferGeneration(payload);
      setParsedResponse(parseOffersResponse(response));
    } catch (error) {
      setParsedResponse(null);
      setApiError(error instanceof Error ? error.message : "Unable to load a booking recommendation.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function restartChat() {
    setIsChatLoading(true);
    setChatError(null);

    try {
      const session = await createChatSession({
        property_id: resolvedPropertyId || DEFAULT_PROPERTY_ID,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: typeof navigator !== "undefined" ? navigator.language : "en-US",
      });

      setChatSession(session);
      setChatMessages([
        {
          id: `${session.sessionId}-greeting`,
          role: "assistant",
          text: session.greeting,
          createdAt: session.createdAt,
        },
      ]);
      setComposerValue("");
    } catch (error) {
      setChatSession(null);
      setChatMessages([]);
      setChatError(error instanceof Error ? error.message : "Unable to restart concierge chat.");
    } finally {
      setIsChatLoading(false);
    }
  }

  async function sendMessage() {
    if (!chatSession || isChatSending) {
      return;
    }

    const message = composerValue.trim();
    if (!message) {
      return;
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      setChatError(`Message cannot exceed ${MAX_MESSAGE_LENGTH} characters.`);
      return;
    }

    const clientMessageId = createClientMessageId();
    const userMessage: DemoChatMessageItem = {
      id: clientMessageId,
      role: "user",
      text: message,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };

    setChatMessages((current) => [...current, userMessage]);
    setComposerValue("");
    setChatError(null);
    setIsChatSending(true);

    try {
      const response = await sendChatSessionMessage(chatSession.sessionId, {
        message,
        clientMessageId,
        metadata: {
          locale: typeof navigator !== "undefined" ? navigator.language : "en-US",
          device: typeof window !== "undefined" && window.innerWidth < 768 ? "mobile" : "desktop",
        },
      });

      setChatMessages((current) => [
        ...current,
        {
          id: `${clientMessageId}-assistant`,
          role: "assistant",
          text: response.assistantMessage,
          createdAt: new Date().toISOString(),
          status: response.status,
          nextAction: response.nextAction,
          pendingAction: response.pendingAction ?? null,
          responseUi: getChatResponseUi(response),
          recommendedRoom: getChatRecommendedRoomFromResponse(response),
          decisionId: response.decisionId,
          isRetryable: false,
        },
      ]);
    } catch (error) {
      const messageText =
        error instanceof ApiClientRequestError
          ? error.message || "Unable to send your question right now."
          : "Network error while contacting the concierge.";
      setChatError(messageText);
    } finally {
      setIsChatSending(false);
    }
  }

  async function handleChatSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendMessage();
  }

  async function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();
    await sendMessage();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_380px]">
        <div className="space-y-6">
          <Card className="border-border/60 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">
                {propertiesLoading ? "Loading property..." : selectedPropertyName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-5" onSubmit={handleOfferSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="check_in">Check-in</Label>
                    <Input
                      id="check_in"
                      type="date"
                      value={draft.check_in}
                      onChange={(event) => setDraft((current) => ({ ...current, check_in: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="check_out">Check-out</Label>
                    <Input
                      id="check_out"
                      type="date"
                      value={draft.check_out}
                      onChange={(event) => setDraft((current) => ({ ...current, check_out: event.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="rooms">Rooms</Label>
                    <Input
                      id="rooms"
                      type="number"
                      min={1}
                      value={draft.rooms}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, rooms: toPositiveNumber(event.target.value, 1) }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adults">Adults</Label>
                    <Input
                      id="adults"
                      type="number"
                      min={1}
                      value={draft.adults}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, adults: toPositiveNumber(event.target.value, 1) }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="children">Children</Label>
                    <Input
                      id="children"
                      type="number"
                      min={0}
                      value={draft.children}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, children: toPositiveNumber(event.target.value, 0) }))
                      }
                    />
                  </div>
                </div>

                {formErrors.length > 0 ? (
                  <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                    {formErrors.map((error) => (
                      <p key={error}>{error}</p>
                    ))}
                  </div>
                ) : null}

                {apiError ? (
                  <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                    {apiError}
                  </div>
                ) : null}

                <div className="flex justify-end">
                  <Button type="submit" className="rounded-full px-5" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Find my stay
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <CheckoutRecommendationPanel parsedResponse={parsedResponse} isSubmitting={isSubmitting} />
        </div>

        <CheckoutConciergePanel
          chatError={chatError}
          chatMessages={chatMessages}
          chatSession={chatSession}
          composerValue={composerValue}
          isChatLoading={isChatLoading}
          isChatSending={isChatSending}
          onChatSubmit={handleChatSubmit}
          onComposerChange={setComposerValue}
          onComposerKeyDown={handleComposerKeyDown}
          onRestart={restartChat}
          messagesEndRef={messagesEndRef}
        />
    </div>
  );
}

function CheckoutRecommendationPanel({
  parsedResponse,
  isSubmitting,
}: {
  parsedResponse: ParsedOffersResponse | null;
  isSubmitting: boolean;
}) {
  if (isSubmitting) {
    return (
      <Card className="border-border/60 bg-white shadow-sm">
        <CardContent className="flex min-h-[280px] items-center justify-center">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Finding the best stay for this request...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!parsedResponse) {
    return (
      <Card className="border-dashed border-border/70 bg-white/80 shadow-sm">
        <CardContent className="flex min-h-[280px] flex-col items-center justify-center text-center">
          <p className="text-lg font-semibold text-foreground">Your guided recommendation will appear here</p>
          <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
            After you enter your dates and guest count, we will show the recommended room, upgrade ladder,
            and add-ons in a checkout-friendly format.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {parsedResponse.recommendedRoom ? (
        <DecisionOfferCard title={parsedResponse.recommendedRoom.roomType} offer={parsedResponse.recommendedRoom} />
      ) : (
        <Card className="border-amber-300/70 bg-amber-50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">No stay recommendation yet</CardTitle>
            <CardDescription>
              {parsedResponse.fallback?.reason || "No eligible room remained for this request."}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <UpgradeLadderSummary entries={parsedResponse.upgradeLadder} />
      <RecommendedAddOns offers={parsedResponse.recommendedOffers} />
    </div>
  );
}

function UpgradeLadderSummary({ entries }: { entries: UpgradeLadderEntry[] }) {
  return (
    <Card className="border-border/60 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Upgrade ladder</CardTitle>
        <CardDescription>See the next room up if you want more space or more premium options.</CardDescription>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No higher room categories were returned above the recommended stay.</p>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => {
              const upgradeReasons = entry.reasons.length > 0 ? entry.reasons : entry.benefitSummary;

              return (
                <div key={`${entry.roomTypeId}-${entry.ratePlanId}`} className="rounded-3xl border border-border/70 bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{entry.roomType}</p>
                    <p className="text-sm text-muted-foreground">{entry.ratePlan}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-semibold text-foreground">{formatMoney(entry.totalPrice)}</p>
                    <p className="text-muted-foreground">
                      +{formatMoney(entry.priceDeltaPerNight)}/night
                    </p>
                  </div>
                </div>
                {upgradeReasons.length > 0 ? (
                  <div className="mt-3 border-t border-border/60 pt-3">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Why upgrade</p>
                    <ul className="list-disc pl-4 text-xs text-muted-foreground">
                      {upgradeReasons.map((reason) => (
                        <li key={`${entry.ratePlanId}-${reason}`}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RecommendedAddOns({ offers }: { offers: RecommendedUpsell[] }) {
  return (
    <Card className="border-border/60 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Recommended add-ons</CardTitle>
      </CardHeader>
      <CardContent>
        {offers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No add-ons were recommended for this stay.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {offers.map((offer) => (
              <div key={`${offer.bundleType}-${offer.label}`} className="rounded-3xl border border-border/70 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-foreground">{offer.label}</p>
                  {offer.estimatedPriceDelta !== null ? (
                    <span className="text-sm font-semibold text-foreground">{formatMoney(offer.estimatedPriceDelta)}</span>
                  ) : null}
                </div>
                {offer.reasons.length > 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">{offer.reasons.join(" • ")}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type CheckoutConciergePanelProps = {
  chatError: string | null;
  chatMessages: DemoChatMessageItem[];
  chatSession: ChatSession | null;
  composerValue: string;
  isChatLoading: boolean;
  isChatSending: boolean;
  onChatSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onComposerChange: (value: string) => void;
  onComposerKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => Promise<void>;
  onRestart: () => Promise<void>;
  messagesEndRef: RefObject<HTMLDivElement | null>;
};

function CheckoutConciergePanel({
  chatError,
  chatMessages,
  chatSession,
  composerValue,
  isChatLoading,
  isChatSending,
  onChatSubmit,
  onComposerChange,
  onComposerKeyDown,
  onRestart,
  messagesEndRef,
}: CheckoutConciergePanelProps) {
  return (
    <Card className="border-border/60 bg-white shadow-sm xl:sticky xl:top-24 xl:h-[calc(100vh-8rem)]">
      <CardHeader className="border-b border-border/60 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquareMore className="h-5 w-5 text-primary" />
              AI concierge
            </CardTitle>
            <CardDescription>
              Ask about rooms, policies, or the reservation while you review the stay.
            </CardDescription>
          </div>
          <Button type="button" size="icon" variant="outline" onClick={() => void onRestart()} disabled={isChatLoading || isChatSending}>
            <RefreshCcw className="h-4 w-4" />
            <span className="sr-only">Start a new concierge chat</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex h-full min-h-[420px] flex-col gap-4 pt-5">
        {chatError ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {chatError}
          </div>
        ) : null}

        <ScrollArea className="min-h-[320px] flex-1 rounded-3xl bg-slate-50">
          <div className="flex min-h-full flex-col gap-5 px-4 py-4">
            {isChatLoading ? (
              <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting your concierge...
              </div>
            ) : null}

            {!isChatLoading && chatMessages.map((message) => (
              <DemoChatMessage key={message.id} message={message} />
            ))}

            {isChatSending ? (
              <p className="text-xs text-muted-foreground">Concierge is replying...</p>
            ) : null}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <form className="space-y-3" onSubmit={(event) => void onChatSubmit(event)}>
          <Textarea
            value={composerValue}
            onChange={(event) => onComposerChange(event.target.value)}
            onKeyDown={(event) => void onComposerKeyDown(event)}
            placeholder={chatSession ? "Ask about your room, dates, parking, breakfast, or the property..." : "Starting concierge..."}
            disabled={!chatSession || isChatLoading || isChatSending}
            className="min-h-24 rounded-3xl border-border/70 bg-slate-50"
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">Press Enter to send, Shift+Enter for a new line.</p>
            <Button type="submit" className="rounded-full px-5" disabled={!chatSession || isChatLoading || isChatSending}>
              {isChatSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SendHorizontal className="mr-2 h-4 w-4" />}
              Send
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
