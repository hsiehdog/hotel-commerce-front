"use client";

import { FormEvent, KeyboardEvent, RefObject, useEffect, useMemo, useRef, useState } from "react";
import { MessageSquareMore, RefreshCcw, SendHorizontal, Sparkles, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { CheckoutRecommendationPanel } from "@/components/checkout/checkout-recommendation-panel";
import {
  applyClientAction,
  buildContextSyncPayload,
  buildLocalCurrentPricing,
  getInitialRoomSelection,
  normalizeSelectedAddOns,
  selectionFromCurrentSelection,
  type CheckoutRoomSelection,
} from "@/components/checkout/demo-checkout-state";
import { DemoChatMessage, DemoChatMessageItem } from "@/components/chat/demo-chat-message";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  ApiClientRequestError,
  answerConciergeQuestion,
  syncConciergeContext,
  type ConciergeContextSyncResult,
  type ConciergeCurrentPricing,
} from "@/lib/api-client";
import {
  buildOffersGenerateRequest,
  buildRoomOccupancies,
  getDefaultOffersDraft,
  parseOffersResponse,
  requestOfferGeneration,
  type OffersDraft,
  type ParsedOffersResponse,
  validateOffersDraft,
} from "@/lib/offers-demo";
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

function buildGreetingMessage(propertyId: string): DemoChatMessageItem {
  return {
    id: `${propertyId}-greeting-${Date.now()}`,
    role: "assistant",
    text: "Ask about the property, amenities, parking, policies, or nearby recommendations.",
    createdAt: new Date().toISOString(),
  };
}

function toPositiveNumber(value: string, minimum: number): string {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return String(minimum);
  }
  return String(Math.max(minimum, Math.floor(parsed)));
}

function normalizeChildrenCount(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

function buildSyncErrorMessage(error: unknown): string {
  if (error instanceof ApiClientRequestError) {
    return error.message || "Unable to sync the current reservation context.";
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Unable to sync the current reservation context.";
}

export function DemoCheckoutDashboard() {
  const searchParams = useSearchParams();
  const { defaultPropertyId, propertyOptions, propertiesLoading } = useOfferPropertyOptions("checkout-properties");
  const [draft, setDraft] = useState<OffersDraft>(buildInitialDraft);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parsedResponse, setParsedResponse] = useState<ParsedOffersResponse | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<CheckoutRoomSelection | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [currentPricing, setCurrentPricing] = useState<ConciergeCurrentPricing | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const [chatMessages, setChatMessages] = useState<DemoChatMessageItem[]>([]);
  const [chatError, setChatError] = useState<string | null>(null);
  const [isChatSending, setIsChatSending] = useState(false);
  const [composerValue, setComposerValue] = useState("");
  const [chatSessionId, setChatSessionId] = useState<string | undefined>(undefined);
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

    setApiError(null);
    setFormErrors([]);
    setParsedResponse(null);
    setSelectedRoom(null);
    setSelectedAddOns([]);
    setCurrentPricing(null);
    setIsSyncing(false);
    setSyncError(null);
    setChatError(null);
    setComposerValue("");
    setChatSessionId(undefined);
    setChatMessages([buildGreetingMessage(resolvedPropertyId)]);
  }, [resolvedPropertyId]);

  useEffect(() => {
    if (typeof messagesEndRef.current?.scrollIntoView === "function") {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isChatSending]);

  async function syncReservationContext({
    nextParsedResponse,
    nextSelectedRoom,
    nextSelectedAddOns,
    sessionIdOverride,
  }: {
    nextParsedResponse: ParsedOffersResponse | null;
    nextSelectedRoom: CheckoutRoomSelection | null;
    nextSelectedAddOns: string[];
    sessionIdOverride?: string;
  }): Promise<ConciergeContextSyncResult | null> {
    if (!resolvedPropertyId || !nextParsedResponse) {
      return null;
    }

    setIsSyncing(true);
    setSyncError(null);

    try {
      const response = await syncConciergeContext(
        resolvedPropertyId,
        buildContextSyncPayload({
          draft,
          parsedResponse: nextParsedResponse,
          selectedRoom: nextSelectedRoom,
          selectedAddOns: nextSelectedAddOns,
          sessionId: sessionIdOverride,
        }),
      );

      const resolvedSelection =
        selectionFromCurrentSelection(response.currentSelection) ?? nextSelectedRoom;
      const resolvedAddOns = normalizeSelectedAddOns(
        nextParsedResponse.recommendedOffers,
        response.currentSelection?.selectedAddOns ?? nextSelectedAddOns,
      );
      const resolvedPricing =
        response.currentPricing ??
        buildLocalCurrentPricing({
          parsedResponse: nextParsedResponse,
          selectedRoom: resolvedSelection,
          selectedAddOns: resolvedAddOns,
        });

      setChatSessionId(response.sessionId);
      setSelectedRoom(resolvedSelection);
      setSelectedAddOns(resolvedAddOns);
      setCurrentPricing(resolvedPricing);

      return response;
    } catch (error) {
      const message = buildSyncErrorMessage(error);
      setSyncError(message);
      if (error instanceof ApiClientRequestError && error.status === 409) {
        setChatSessionId(undefined);
      }
      return null;
    } finally {
      setIsSyncing(false);
    }
  }

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
      const nextParsedResponse = parseOffersResponse(response);
      const nextSelectedRoom = getInitialRoomSelection(nextParsedResponse);
      const nextSelectedAddOns: string[] = [];
      const nextCurrentPricing = buildLocalCurrentPricing({
        parsedResponse: nextParsedResponse,
        selectedRoom: nextSelectedRoom,
        selectedAddOns: nextSelectedAddOns,
      });

      setParsedResponse(nextParsedResponse);
      setSelectedRoom(nextSelectedRoom);
      setSelectedAddOns(nextSelectedAddOns);
      setCurrentPricing(nextCurrentPricing);
      setSyncError(null);

      await syncReservationContext({
        nextParsedResponse,
        nextSelectedRoom,
        nextSelectedAddOns,
        sessionIdOverride: chatSessionId,
      });
    } catch (error) {
      setParsedResponse(null);
      setSelectedRoom(null);
      setSelectedAddOns([]);
      setCurrentPricing(null);
      setSyncError(null);
      setApiError(error instanceof Error ? error.message : "Unable to load a booking recommendation.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function restartChat() {
    const greeting = buildGreetingMessage(resolvedPropertyId || DEFAULT_PROPERTY_ID);

    setChatError(null);
    setComposerValue("");
    setChatSessionId(undefined);
    setChatMessages([greeting]);

    if (parsedResponse) {
      await syncReservationContext({
        nextParsedResponse: parsedResponse,
        nextSelectedRoom: selectedRoom,
        nextSelectedAddOns: selectedAddOns,
        sessionIdOverride: undefined,
      });
    }
  }

  async function sendMessage() {
    if (!resolvedPropertyId || isChatSending) {
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
      const response = await answerConciergeQuestion(resolvedPropertyId, message, {
        sessionId: chatSessionId,
      });

      const nextSessionId = response.conversation?.sessionId ?? chatSessionId;
      const reservationSelection = selectionFromCurrentSelection(response.reservation?.currentSelection);
      const actionSelection = applyClientAction({
        parsedResponse,
        selectedRoom,
        selectedAddOns,
        action: response.clientAction,
      });
      const nextSelectedRoom = reservationSelection ?? actionSelection.selectedRoom;
      const nextSelectedAddOns = normalizeSelectedAddOns(
        parsedResponse?.recommendedOffers ?? [],
        response.reservation?.currentSelection?.selectedAddOns ?? actionSelection.selectedAddOns,
      );
      const nextCurrentPricing =
        response.reservation?.currentPricing ??
        buildLocalCurrentPricing({
          parsedResponse,
          selectedRoom: nextSelectedRoom,
          selectedAddOns: nextSelectedAddOns,
        });

      setChatSessionId(nextSessionId);
      setSelectedRoom(nextSelectedRoom);
      setSelectedAddOns(nextSelectedAddOns);
      setCurrentPricing(nextCurrentPricing);
      setSyncError(null);

      setChatMessages((current) => [
        ...current,
        {
          id: `${clientMessageId}-assistant`,
          role: "assistant",
          text: response.answer,
          createdAt: new Date().toISOString(),
          answerType: response.answerType,
          confidence: response.confidence,
          sources: response.sources,
        },
      ]);
    } catch (error) {
      if (error instanceof ApiClientRequestError && error.status === 409) {
        setChatSessionId(undefined);
        setSyncError(error.message || "The concierge session expired. The next sync will create a new one.");
      }
      const messageText =
        error instanceof ApiClientRequestError
          ? error.status === 409
            ? error.message || "The concierge session expired. Send your message again to start a new chat."
            : error.message || "Unable to send your question right now."
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

  async function handleRoomSelection(nextSelectedRoom: CheckoutRoomSelection) {
    const nextCurrentPricing = buildLocalCurrentPricing({
      parsedResponse,
      selectedRoom: nextSelectedRoom,
      selectedAddOns,
    });

    setSelectedRoom(nextSelectedRoom);
    setCurrentPricing(nextCurrentPricing);

    await syncReservationContext({
      nextParsedResponse: parsedResponse,
      nextSelectedRoom,
      nextSelectedAddOns: selectedAddOns,
      sessionIdOverride: chatSessionId,
    });
  }

  async function handleToggleAddOn(bundleType: string) {
    const nextSelectedAddOns = selectedAddOns.includes(bundleType)
      ? selectedAddOns.filter((value) => value !== bundleType)
      : [...selectedAddOns, bundleType];
    const normalizedAddOns = normalizeSelectedAddOns(
      parsedResponse?.recommendedOffers ?? [],
      nextSelectedAddOns,
    );
    const nextCurrentPricing = buildLocalCurrentPricing({
      parsedResponse,
      selectedRoom,
      selectedAddOns: normalizedAddOns,
    });

    setSelectedAddOns(normalizedAddOns);
    setCurrentPricing(nextCurrentPricing);

    await syncReservationContext({
      nextParsedResponse: parsedResponse,
      nextSelectedRoom: selectedRoom,
      nextSelectedAddOns: normalizedAddOns,
      sessionIdOverride: chatSessionId,
    });
  }

  function handleRoomsChange(value: string) {
    const nextRooms = normalizeChildrenCount(value) || 1;

    setDraft((current) => ({
      ...current,
      rooms: String(nextRooms),
      roomOccupancies: buildRoomOccupancies(
        nextRooms,
        Number(current.adults),
        Number(current.children),
      ),
    }));
  }

  function handleAdultsChange(value: string) {
    const nextAdults = Number(toPositiveNumber(value, 1));

    setDraft((current) => ({
      ...current,
      adults: String(nextAdults),
      roomOccupancies: buildRoomOccupancies(
        Number(current.rooms),
        nextAdults,
        Number(current.children),
      ),
    }));
  }

  function handleChildrenChange(value: string) {
    const nextChildren = normalizeChildrenCount(value);

    setDraft((current) => {
      const nextAges = [...current.child_ages];
      if (nextAges.length > nextChildren) {
        nextAges.length = nextChildren;
      }
      while (nextAges.length < nextChildren) {
        nextAges.push(0);
      }

      return {
        ...current,
        children: String(nextChildren),
        child_ages: nextAges,
        roomOccupancies: buildRoomOccupancies(
          Number(current.rooms),
          Number(current.adults),
          nextChildren,
        ),
      };
    });
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
                    onChange={(event) => handleRoomsChange(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adults">Adults</Label>
                  <Input
                    id="adults"
                    type="number"
                    min={1}
                    value={draft.adults}
                    onChange={(event) => handleAdultsChange(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="children">Children</Label>
                  <Input
                    id="children"
                    type="number"
                    min={0}
                    value={draft.children}
                    onChange={(event) => handleChildrenChange(event.target.value)}
                  />
                </div>
              </div>

              {draft.child_ages.length > 0 ? (
                <div className="space-y-2">
                  <Label>Child ages</Label>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {draft.child_ages.map((age, index) => (
                      <div key={`child-age-${index}`} className="space-y-2">
                        <Label htmlFor={`child_age_${index}`}>Child {index + 1} age</Label>
                        <Input
                          id={`child_age_${index}`}
                          type="number"
                          min={0}
                          value={age}
                          onChange={(event) => {
                            const nextAge = normalizeChildrenCount(event.target.value);
                            setDraft((current) => {
                              const nextAges = [...current.child_ages];
                              nextAges[index] = nextAge;
                              return {
                                ...current,
                                child_ages: nextAges,
                              };
                            });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

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

        <CheckoutRecommendationPanel
          parsedResponse={parsedResponse}
          isSubmitting={isSubmitting}
          selectedRoom={selectedRoom}
          selectedAddOns={selectedAddOns}
          currentPricing={currentPricing}
          isSyncing={isSyncing}
          syncError={syncError}
          onSelectRoom={(selection) => void handleRoomSelection(selection)}
          onToggleAddOn={(bundleType) => void handleToggleAddOn(bundleType)}
        />
      </div>

      <CheckoutConciergePanel
        chatError={chatError}
        chatMessages={chatMessages}
        composerValue={composerValue}
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

type CheckoutConciergePanelProps = {
  chatError: string | null;
  chatMessages: DemoChatMessageItem[];
  composerValue: string;
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
  composerValue,
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
          <Button type="button" size="icon" variant="outline" onClick={() => void onRestart()} disabled={isChatSending}>
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
            {chatMessages.map((message) => (
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
            placeholder="Ask about your room, dates, parking, breakfast, or the property..."
            disabled={isChatSending}
            className="min-h-24 rounded-3xl border-border/70 bg-slate-50"
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">Press Enter to send, Shift+Enter for a new line.</p>
            <Button type="submit" className="rounded-full px-5" disabled={isChatSending}>
              {isChatSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SendHorizontal className="mr-2 h-4 w-4" />}
              Send
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
