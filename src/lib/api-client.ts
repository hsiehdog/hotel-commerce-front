type HttpMethod = "GET" | "POST" | "PATCH";

export type ApiClientError = {
  status: number;
  message: string;
  body?: unknown;
  requestId?: string | null;
  retryAfterSeconds?: number | null;
};

export type UsageMetric = {
  id: string;
  label: string;
  value: string;
  delta: number;
  helper?: string;
};

export type ProjectSummary = {
  id: string;
  name: string;
  status: "online" | "degraded" | "paused";
  updatedAt: string;
  owner: string;
};

export type ActivityItem = {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  category: "deployment" | "alert" | "usage";
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  isOptimistic?: boolean;
};

export type ChatMessageStatus = "NEEDS_CLARIFICATION" | "OK" | "ERROR";
export type ChatNextAction = "ASK_QUESTION" | "CONFIRM" | "PRESENT_OFFERS";
export type ChatAnswerMode = "yes_no" | "numeric" | "single_choice" | "free_text";
export type ChatPendingAction = string | Record<string, unknown>;

export type ChatResponseUiOption = {
  label: string;
  value: string;
  description?: string | null;
};

type ChatResponseUiTurnContext = {
  answerMode: ChatAnswerMode;
  targetSlots?: string[];
  slotHints?: {
    missingRequired: string[];
    collected: string[];
  };
};

export type ChatResponseUiQuestion = {
  type: "question";
} & ChatResponseUiTurnContext;

export type ChatResponseUiConfirmation = {
  type: "confirmation";
  summary?: Record<string, unknown> | null;
} & ChatResponseUiTurnContext;

export type ChatResponseUiSelection = {
  type: "selection";
  options: ChatResponseUiOption[];
} & ChatResponseUiTurnContext;

export type ChatResponseUiOfferRecommendation = {
  type: "offer_recommendation";
  showRecommendedRoom?: boolean;
  showRecommendedOffers?: boolean;
  showRankedRooms?: boolean;
};

export type ChatResponseUiError = {
  type: "error";
  retryable?: boolean;
};

export type ChatResponseUi =
  | ChatResponseUiQuestion
  | ChatResponseUiConfirmation
  | ChatResponseUiSelection
  | ChatResponseUiOfferRecommendation
  | ChatResponseUiError;

export type ConciergeAnswerType =
  | "fact"
  | "event"
  | "retrieval"
  | "clarification"
  | "fallback"
  | (string & {});

export type ConciergeClarification = {
  kind?: string | null;
  targetSlots: string[];
  prompt?: string | null;
};

export type ConciergeKnowledgeContext = {
  entity?: string | null;
  facet?: string | null;
  subject?: string | null;
  subjectTerms: string[];
  lastQuestion?: string | null;
  rewrittenQuestion?: string | null;
};

export type ConciergeConversationState = {
  sessionId: string;
  mode?: string | null;
  status?: string | null;
  slots?: Record<string, unknown> | null;
  missingFields: string[];
  clarification?: ConciergeClarification | null;
  knowledgeContext?: ConciergeKnowledgeContext | null;
};

export type ConciergeSelectedAddOn = {
  bundleType: string;
  label: string;
  estimatedPriceDelta: number;
};

export type ConciergeCurrentSelection = {
  roomTypeId: string;
  ratePlanId: string;
  roomType: string;
  ratePlan: string;
  selectedAddOns: string[];
};

export type ConciergeCurrentPricing = {
  currency: string;
  roomTotal: number;
  addOnsTotal: number;
  total: number;
  nightlyPrice?: number | null;
  subtotal?: number | null;
  taxesAndFees?: number | null;
  selectedAddOns: ConciergeSelectedAddOn[];
};

export type ConciergeClientAction =
  | {
      type: "select_room";
      roomTypeId: string;
      ratePlanId: string;
    }
  | {
      type: "add_addon" | "remove_addon";
      bundleType: string;
    };

export type ConciergeReservationPayload = {
  recommendedRoom?: Record<string, unknown> | null;
  upgradeLadder?: Record<string, unknown>[];
  recommendedOffers?: Record<string, unknown>[];
  currentSelection?: ConciergeCurrentSelection | null;
  currentPricing?: ConciergeCurrentPricing | null;
};

export type ConciergeContextSearch = {
  checkIn: string;
  checkOut: string;
  adults: number;
  rooms: number;
  children: number;
  petFriendly: boolean;
  accessibleRoom: boolean;
  needsTwoBeds: boolean;
  parkingNeeded: boolean;
  breakfastPackage: boolean;
  earlyCheckIn: boolean;
  lateCheckOut: boolean;
  stubScenario?: string;
};

export type ConciergeContextSelectionInput = {
  roomTypeId: string;
  ratePlanId: string;
  selectedAddOns: string[];
};

export type ConciergeContextSyncPayload = {
  sessionId?: string;
  offerContext: {
    search: ConciergeContextSearch;
    recommendedRoom: Record<string, unknown> | null;
    upgradeLadder: Array<Record<string, unknown>>;
    recommendedOffers: Array<Record<string, unknown>>;
    currency: string;
    generatedAt?: string;
    currentSelection?: ConciergeContextSelectionInput | null;
  };
};

export type ConciergeContextSyncResult = {
  sessionId: string;
  offerContext?: Record<string, unknown> | null;
  currentSelection?: ConciergeCurrentSelection | null;
  currentPricing?: ConciergeCurrentPricing | null;
};

export type ConciergeAnswerSource = {
  id?: string;
  label?: string;
  title?: string;
  kind?: string;
  url?: string;
  snippet?: string;
  [key: string]: unknown;
};

export type ConciergeAnswer = {
  answer: string;
  confidence: number | null;
  sources: ConciergeAnswerSource[];
  answerType: ConciergeAnswerType | null;
  conversation?: ConciergeConversationState | null;
  reservation?: ConciergeReservationPayload | null;
  clientAction?: ConciergeClientAction | null;
};

export type AnswerConciergeQuestionOptions = {
  sessionId?: string;
};

export type OffersLogDecisionStatus = "OK" | "NO_OFFERS" | "FALLBACK_ONLY" | "ERROR";
export type AuditOutboxState = "PENDING" | "ENQUEUED" | "PROCESSED" | "DLQ";

export type PropertyListItem = {
  propertyId: string;
  name: string;
};

export type FetchPropertiesOptions = {
  activeOnly?: boolean;
};

export type OffersLogsListFilters = {
  propertyId: string;
  from: string;
  to: string;
  channel?: string;
  decisionStatus?: OffersLogDecisionStatus;
  requestId?: string;
  decisionId?: string;
  truncated?: boolean;
  errors?: boolean;
  fallbackOnly?: boolean;
  slow?: boolean;
  dlq?: boolean;
  limit?: number;
  cursor?: string;
};

export type OffersLogsListRow = {
  decisionId: string;
  requestId: string;
  propertyId: string;
  property?: string | null;
  tenantId?: string;
  eventRecordedAt: string;
  recordedAt?: string | null;
  channel: string;
  checkIn?: string | null;
  checkOut?: string | null;
  rooms?: number | null;
  adults?: number | null;
  children?: number | null;
  createdOutbox?: {
    state: AuditOutboxState;
    attempts?: number | null;
    lastErrorSafeMessage?: string | null;
  } | null;
  primaryOfferName?: string | null;
  primaryOfferTotal?: number | null;
  decisionStatus: OffersLogDecisionStatus;
  offersCount: number;
  truncated: boolean;
  primaryOfferType?: string | null;
  primaryOfferRoomTypeName?: string | null;
  primaryOfferRatePlanName?: string | null;
  primaryOfferTotalPrice?: number | null;
  primaryOfferCurrency?: string | null;
  primaryOfferRefundability?: string | boolean | null;
  fallbackActionType?: string | null;
  httpStatus?: number | null;
  servedAttemptedAt?: string | null;
  servedFinishedAt?: string | null;
  served: boolean;
  servedSuccess: boolean;
  createdEventId?: string | null;
  createdEventRecordedAt?: string | null;
  createdEventOutboxState?: AuditOutboxState | null;
  createdEventOutboxAttempts?: number | null;
  createdEventLastErrorSafeMessage?: string | null;
  reasonCodes: string[];
  reasonCodesCount: number;
  reasonCodesTruncated: boolean;
  latencyMs: number;
  decisionAgeMs: number;
};

export type OffersLogsListResponse = {
  serverNow: string;
  pageInfo: {
    hasMore: boolean;
    nextCursor?: string;
    limit: number;
  };
  rows: OffersLogsListRow[];
};

export type OffersLogEventOutbox = {
  state: AuditOutboxState;
  attempts: number;
  lastErrorCode?: string | null;
  lastErrorSafeMessage?: string | null;
  eventEnqueuedAt?: string | null;
  eventProcessedAt?: string | null;
  processingLatencyMs?: number | null;
};

export type OffersLogDetailEvent = {
  eventId: string;
  eventType: string;
  eventKey: string;
  schemaMajor: number;
  schemaMinor: number;
  engineVersion: string;
  configVersion: number;
  truncated: boolean;
  truncationFields: string[];
  errorCode?: string | null;
  errorSafeMessage?: string | null;
  eventOccurredAt?: string | null;
  eventRecordedAt: string;
  outbox?: OffersLogEventOutbox | null;
};

export type OffersLogPresentedOffer = {
  offerId: string;
  roomTypeId?: string | null;
  ratePlanId?: string | null;
  roomTypeName?: string | null;
  ratePlanName?: string | null;
  type?: string | null;
  recommended?: boolean | null;
  totalPrice?: number | null;
  currency?: string | null;
  basis?: string | null;
  policySummary?: string | null;
  cancellationSummary?: string | null;
  paymentTiming?: string | null;
  enhancements?: unknown;
  disclosures?: unknown;
};

export type OffersLogTopCandidate = {
  offerId?: string | null;
  roomTypeId?: string | null;
  roomTypeName?: string | null;
  ratePlanId?: string | null;
  ratePlanName?: string | null;
  score?: number | null;
  scoreTotal?: number | null;
  archetype?: string | null;
  components?: Record<string, number> | null;
  rank?: number | null;
  totalPrice?: number | null;
  currency?: string | null;
  basis?: string | null;
  roomsAvailable?: number | null;
  exclusionReason?: string | null;
};

export type OffersLogsDetailResponse = {
  decision: {
    decisionId: string;
    tenantId: string;
    propertyId: string;
    requestId: string;
    channel: string;
    checkIn?: string | null;
    checkOut?: string | null;
    nights?: number | null;
    adults?: number | null;
    children?: number | null;
    rooms?: number | null;
    currency?: string | null;
    priceBasisUsed?: string | null;
    topPersona?: string | null;
    fallbackActionType?: string | null;
    recommendedOfferCount: number;
    decisionStatus: "OK" | "NO_OFFERS" | "ERROR";
    reasonCodes: string[];
    truncated: boolean;
    httpStatus?: number | null;
    servedAttemptedAt?: string | null;
    servedFinishedAt?: string | null;
    eventRecordedAt: string;
    served: boolean;
    servedSuccess: boolean;
    latencyMs: number;
  };
  createdEventCount: number;
  selectedCreatedEventId?: string | null;
  selectedCreatedEventRecordedAt?: string | null;
  integrityFlags: {
    multipleCreatedEvents?: boolean;
    truncatedPayload?: boolean;
    missingDebugPayload?: boolean;
    missingCreatedEvent?: boolean;
  };
  normalizationWarnings?: string[];
  events: OffersLogDetailEvent[];
  normalized: {
    reasonDetailsVersion?: number;
    globalReasonCodes?: string[];
    selectionSummary?: string | null;
    reasonDetails?: unknown;
    reasonsByOfferId?: Record<string, string[]> | null;
    presentedOffers?: OffersLogPresentedOffer[];
    topCandidates?: OffersLogTopCandidate[] | null;
    guardrails?: {
      rules?: Array<{
        name: string;
        passed: boolean;
        observed?: number | string;
        threshold?: number | string;
      }>;
    } | null;
    resolvedRequest?: unknown;
    engineVersion?: string | null;
    configVersion?: number | null;
    artifactVersionsJson?: unknown;
    rawCorePayload?: unknown;
    rawDebugPayload?: unknown;
    payloadTruncatedForResponse?: boolean;
  };
  generateResponse?: {
    data?: Record<string, unknown> | null;
  } | null;
};

type AIChatResponse = {
  id?: string;
  role?: "user" | "assistant" | "system";
  text?: string;
  prompt?: string;
  response?: string;
  sessionId?: string;
  model?: string;
  createdAt?: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const isMock = !API_BASE_URL;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class ApiClientRequestError extends Error implements ApiClientError {
  status: number;
  body?: unknown;
  requestId?: string | null;
  retryAfterSeconds?: number | null;

  constructor(input: ApiClientError) {
    super(input.message);
    this.name = "ApiClientRequestError";
    this.status = input.status;
    this.body = input.body;
    this.requestId = input.requestId;
    this.retryAfterSeconds = input.retryAfterSeconds;
  }
}

async function parseErrorBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return undefined;
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function request<T>(
  path: string,
  method: HttpMethod,
  body?: Record<string, unknown>,
): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error("API base URL is not configured.");
  }

  const headers = new Headers({
    "Content-Type": "application/json",
  });

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorBody = await parseErrorBody(response);
    const fallbackMessage =
      typeof errorBody === "string"
        ? errorBody
        : (errorBody as { message?: string } | undefined)?.message;
    throw new ApiClientRequestError({
      status: response.status,
      message: fallbackMessage || "Unexpected API error",
      body: errorBody,
      requestId: response.headers.get("x-request-id"),
      retryAfterSeconds: Number(response.headers.get("retry-after")) || null,
    });
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}

const mockData = {
  usage: [
    { id: "tokens", label: "Tokens processed", value: "1.2M", delta: 12 },
    { id: "latency", label: "Avg. latency", value: "820ms", delta: -4 },
    { id: "users", label: "Active users", value: "864", delta: 8 },
    { id: "costs", label: "Spend this week", value: "$1,870", delta: -2 },
  ] satisfies UsageMetric[],
  projects: [
    {
      id: "copilot",
      name: "Developer Copilot",
      status: "online",
      updatedAt: "2 minutes ago",
      owner: "Platform",
    },
    {
      id: "agenthub",
      name: "Agent Hub",
      status: "degraded",
      updatedAt: "8 minutes ago",
      owner: "Automation",
    },
    {
      id: "insights",
      name: "Insights Assistant",
      status: "paused",
      updatedAt: "45 minutes ago",
      owner: "Revenue",
    },
  ] satisfies ProjectSummary[],
  activity: [
    {
      id: "deploy-1",
      title: "New agent deployed",
      description: "v0.12.4 rolled out to production",
      timestamp: "Today · 10:42 AM",
      category: "deployment",
    },
    {
      id: "alert-1",
      title: "Latency spike detected",
      description: "LLM provider response time exceeded SLO",
      timestamp: "Today · 9:17 AM",
      category: "alert",
    },
    {
      id: "usage-1",
      title: "Usage milestone",
      description: "Surpassed 1M prompts this week",
      timestamp: "Yesterday · 6:03 PM",
      category: "usage",
    },
  ] satisfies ActivityItem[],
  chat: [
    {
      id: "intro-1",
      role: "assistant",
      content:
        "Hi! Ask me anything about your AI workloads—deployments, tokens, incidents, or experimentation.",
      createdAt: new Date().toISOString(),
    },
  ] satisfies ChatMessage[],
};

const mockOffersData = {
  properties: [
    { propertyId: "demo_hotel_sf", name: "Demo Hotel San Francisco" },
    { propertyId: "demo_hotel_nyc", name: "Demo Hotel New York" },
  ] satisfies PropertyListItem[],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return undefined;
}

function firstNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }
  return undefined;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (typeof entry === "string") {
        return entry.trim();
      }
      if (isRecord(entry)) {
        return (
          firstString(entry.name, entry.label, entry.id, entry.code) ?? ""
        ).trim();
      }
      return "";
    })
    .filter(Boolean);
}

function parseConciergeSelectedAddOns(value: unknown): ConciergeSelectedAddOn[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (!isRecord(entry)) {
      return [];
    }

    const bundleType = firstString(entry.bundleType, entry.bundle_type);
    const label = firstString(entry.label);
    const estimatedPriceDelta = firstNumber(
      entry.estimatedPriceDelta,
      entry.estimated_price_delta,
    );

    if (!bundleType || !label || estimatedPriceDelta === undefined) {
      return [];
    }

    return [
      {
        bundleType,
        label,
        estimatedPriceDelta,
      },
    ];
  });
}

function parseConciergeCurrentSelection(value: unknown): ConciergeCurrentSelection | null {
  if (!isRecord(value)) {
    return null;
  }

  const roomTypeId = firstString(value.roomTypeId, value.room_type_id);
  const ratePlanId = firstString(value.ratePlanId, value.rate_plan_id);
  const roomType = firstString(value.roomType, value.room_type);
  const ratePlan = firstString(value.ratePlan, value.rate_plan);

  if (!roomTypeId || !ratePlanId || !roomType || !ratePlan) {
    return null;
  }

  return {
    roomTypeId,
    ratePlanId,
    roomType,
    ratePlan,
    selectedAddOns: toStringArray(value.selectedAddOns ?? value.selected_add_ons),
  };
}

function parseConciergeCurrentPricing(value: unknown): ConciergeCurrentPricing | null {
  if (!isRecord(value)) {
    return null;
  }

  const currency = firstString(value.currency);
  const roomTotal = firstNumber(value.roomTotal, value.room_total);
  const addOnsTotal = firstNumber(value.addOnsTotal, value.add_ons_total);
  const total = firstNumber(value.total);

  if (!currency || roomTotal === undefined || addOnsTotal === undefined || total === undefined) {
    return null;
  }

  return {
    currency,
    roomTotal,
    addOnsTotal,
    total,
    nightlyPrice: firstNumber(value.nightlyPrice, value.nightly_price) ?? null,
    subtotal: firstNumber(value.subtotal) ?? null,
    taxesAndFees: firstNumber(value.taxesAndFees, value.taxes_and_fees) ?? null,
    selectedAddOns: parseConciergeSelectedAddOns(value.selectedAddOns ?? value.selected_add_ons),
  };
}

function parseConciergeClientAction(value: unknown): ConciergeClientAction | null {
  if (!isRecord(value)) {
    return null;
  }

  const type = firstString(value.type);
  if (type === "select_room") {
    const roomTypeId = firstString(value.roomTypeId, value.room_type_id);
    const ratePlanId = firstString(value.ratePlanId, value.rate_plan_id);
    if (!roomTypeId || !ratePlanId) {
      return null;
    }

    return {
      type,
      roomTypeId,
      ratePlanId,
    };
  }

  if (type === "add_addon" || type === "remove_addon") {
    const bundleType = firstString(value.bundleType, value.bundle_type);
    if (!bundleType) {
      return null;
    }

    return {
      type,
      bundleType,
    };
  }

  return null;
}

function parseConciergeReservationPayload(value: unknown): ConciergeReservationPayload | null {
  if (!isRecord(value)) {
    return null;
  }

  const recommendedRoom = value.recommendedRoom ?? value.recommended_room;
  const upgradeLadder = value.upgradeLadder ?? value.upgrade_ladder;
  const recommendedOffers = value.recommendedOffers ?? value.recommended_offers;

  return {
    recommendedRoom: isRecord(recommendedRoom)
      ? { ...recommendedRoom }
      : null,
    upgradeLadder: Array.isArray(upgradeLadder)
      ? upgradeLadder.filter(isRecord).map((entry) => ({ ...entry }))
      : [],
    recommendedOffers: Array.isArray(recommendedOffers)
      ? recommendedOffers.filter(isRecord).map((entry) => ({ ...entry }))
      : [],
    currentSelection: parseConciergeCurrentSelection(
      value.currentSelection ?? value.current_selection,
    ),
    currentPricing: parseConciergeCurrentPricing(value.currentPricing ?? value.current_pricing),
  };
}

function parseConciergeClarification(value: unknown): ConciergeClarification | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    kind: firstString(value.kind) ?? null,
    targetSlots: toStringArray(value.targetSlots ?? value.target_slots),
    prompt: firstString(value.prompt) ?? null,
  };
}

function parseConciergeKnowledgeContext(value: unknown): ConciergeKnowledgeContext | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    entity: firstString(value.entity) ?? null,
    facet: firstString(value.facet) ?? null,
    subject: firstString(value.subject) ?? null,
    subjectTerms: toStringArray(value.subjectTerms ?? value.subject_terms),
    lastQuestion: firstString(value.lastQuestion, value.last_question) ?? null,
    rewrittenQuestion: firstString(value.rewrittenQuestion, value.rewritten_question) ?? null,
  };
}

function parseConciergeConversationState(value: unknown): ConciergeConversationState | null {
  if (!isRecord(value)) {
    return null;
  }

  const sessionId = firstString(value.sessionId, value.session_id);
  if (!sessionId) {
    return null;
  }

  return {
    sessionId,
    mode: firstString(value.mode) ?? null,
    status: firstString(value.status) ?? null,
    slots: isRecord(value.slots) ? { ...value.slots } : null,
    missingFields: toStringArray(value.missingFields ?? value.missing_fields),
    clarification: parseConciergeClarification(value.clarification),
    knowledgeContext: parseConciergeKnowledgeContext(
      value.knowledgeContext ?? value.knowledge_context,
    ),
  };
}

function parseAuditOutboxState(value: unknown): AuditOutboxState | null {
  if (value === "PENDING" || value === "ENQUEUED" || value === "PROCESSED" || value === "DLQ") {
    return value;
  }
  return null;
}

function buildQueryString(params: Record<string, string | number | boolean | undefined>) {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") {
      continue;
    }
    searchParams.set(key, String(value));
  }
  const serialized = searchParams.toString();
  return serialized ? `?${serialized}` : "";
}

export async function fetchUsageMetrics(): Promise<UsageMetric[]> {
  if (isMock) {
    await delay(300);
    return mockData.usage;
  }

  return request<UsageMetric[]>("/analytics/usage", "GET");
}

export async function fetchProjectSummaries(): Promise<ProjectSummary[]> {
  if (isMock) {
    await delay(320);
    return mockData.projects;
  }

  return request<ProjectSummary[]>("/projects", "GET");
}

export async function fetchActivityFeed(): Promise<ActivityItem[]> {
  if (isMock) {
    await delay(280);
    return mockData.activity;
  }

  return request<ActivityItem[]>("/activity", "GET");
}

export async function fetchChatHistory(): Promise<ChatMessage[]> {
  if (isMock) {
    await delay(200);
    return mockData.chat;
  }

  const response = await request<{ sessions: AIChatResponse[] }>(
    "/users/me/sessions",
    "GET",
  );
  return (response.sessions || [])
    .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime())
    .flatMap((entry) => mapSessionToMessages(entry));
}

export async function sendChatMessage(message: string): Promise<ChatMessage> {
  if (isMock) {
    await delay(600);
    return {
      id: crypto.randomUUID(),
      role: "assistant",
      content:
        "Here’s a mocked response describing what your managed LLM endpoint would have answered.",
      createdAt: new Date().toISOString(),
    };
  }

  const response = await request<{ data: AIChatResponse }>(
    "/ai/generate",
    "POST",
    {
      prompt: message,
    },
  );

  return mapToChatMessage(response.data);
}

function toSnakeCaseSearch(search: ConciergeContextSearch): Record<string, unknown> {
  return {
    check_in: search.checkIn,
    check_out: search.checkOut,
    adults: search.adults,
    rooms: search.rooms,
    children: search.children,
    pet_friendly: search.petFriendly,
    accessible_room: search.accessibleRoom,
    needs_two_beds: search.needsTwoBeds,
    parking_needed: search.parkingNeeded,
    breakfast_package: search.breakfastPackage,
    early_check_in: search.earlyCheckIn,
    late_check_out: search.lateCheckOut,
    ...(search.stubScenario ? { stub_scenario: search.stubScenario } : {}),
  };
}

function toSnakeCaseCurrentSelection(
  selection: ConciergeContextSelectionInput | null | undefined,
): Record<string, unknown> | undefined {
  if (!selection) {
    return undefined;
  }

  return {
    room_type_id: selection.roomTypeId,
    rate_plan_id: selection.ratePlanId,
    selected_add_ons: selection.selectedAddOns,
  };
}

export async function syncConciergeContext(
  propertyId: string,
  payload: ConciergeContextSyncPayload,
): Promise<ConciergeContextSyncResult> {
  if (isMock) {
    await delay(320);

    const currentSelection = payload.offerContext.currentSelection
      ? {
          roomTypeId: payload.offerContext.currentSelection.roomTypeId,
          ratePlanId: payload.offerContext.currentSelection.ratePlanId,
          roomType: payload.offerContext.currentSelection.roomTypeId,
          ratePlan: payload.offerContext.currentSelection.ratePlanId,
          selectedAddOns: payload.offerContext.currentSelection.selectedAddOns,
        }
      : null;

    return {
      sessionId: payload.sessionId ?? crypto.randomUUID(),
      offerContext: payload.offerContext.recommendedRoom,
      currentSelection,
      currentPricing: null,
    };
  }

  const response = await request<{
    data?: {
      session_id?: string;
      sessionId?: string;
      offer_context?: unknown;
      offerContext?: unknown;
      current_selection?: unknown;
      currentSelection?: unknown;
      current_pricing?: unknown;
      currentPricing?: unknown;
    };
  }>(`/properties/${encodeURIComponent(propertyId)}/concierge/context`, "POST", {
    ...(payload.sessionId ? { session_id: payload.sessionId } : {}),
    offer_context: {
      search: toSnakeCaseSearch(payload.offerContext.search),
      recommended_room: payload.offerContext.recommendedRoom,
      upgrade_ladder: payload.offerContext.upgradeLadder,
      recommended_offers: payload.offerContext.recommendedOffers,
      currency: payload.offerContext.currency,
      ...(payload.offerContext.generatedAt ? { generated_at: payload.offerContext.generatedAt } : {}),
      ...(payload.offerContext.currentSelection
        ? {
            current_selection: toSnakeCaseCurrentSelection(
              payload.offerContext.currentSelection,
            ),
          }
        : {}),
    },
  });

  const data = isRecord(response.data) ? response.data : {};
  const sessionId = firstString(data.sessionId, data.session_id);
  if (!sessionId) {
    throw new Error("Concierge context sync response is missing session_id.");
  }

  const offerContext = data.offerContext ?? data.offer_context;

  return {
    sessionId,
    offerContext: isRecord(offerContext)
      ? { ...offerContext }
      : null,
    currentSelection: parseConciergeCurrentSelection(
      data.currentSelection ?? data.current_selection,
    ),
    currentPricing: parseConciergeCurrentPricing(data.currentPricing ?? data.current_pricing),
  };
}

export async function answerConciergeQuestion(
  propertyId: string,
  question: string,
  options: AnswerConciergeQuestionOptions = {},
): Promise<ConciergeAnswer> {
  if (isMock) {
    await delay(520);
    return {
      answer: `Mocked concierge answer for ${propertyId}: ${question}`,
      confidence: 0.92,
      sources: [
        {
          id: "mock-source-1",
          title: "Property fact sheet",
          kind: "fact",
        },
      ],
      answerType: "fact",
    };
  }

  const response = await request<{
    data?: {
      answer?: string;
      confidence?: number | null;
      sources?: unknown[];
      answer_type?: string | null;
      answerType?: string | null;
      conversation?: unknown;
      reservation?: unknown;
      client_action?: unknown;
      clientAction?: unknown;
    };
  }>(
    `/properties/${encodeURIComponent(propertyId)}/concierge/answer`,
    "POST",
    {
      question,
      ...(options.sessionId ? { session_id: options.sessionId } : {}),
    },
  );

  const data = isRecord(response.data) ? response.data : {};
  return {
    answer: firstString(data.answer) ?? "",
    confidence: firstNumber(data.confidence) ?? null,
    sources: Array.isArray(data.sources)
      ? data.sources.filter(isRecord).map((source) => ({ ...source }))
      : [],
    answerType: firstString(data.answerType, data.answer_type) ?? null,
    conversation: parseConciergeConversationState(data.conversation),
    reservation: parseConciergeReservationPayload(data.reservation),
    clientAction: parseConciergeClientAction(data.clientAction ?? data.client_action),
  };
}

export async function fetchProperties(
  options: FetchPropertiesOptions = {},
): Promise<PropertyListItem[]> {
  if (isMock) {
    await delay(180);
    return mockOffersData.properties;
  }

  const query = buildQueryString({
    activeOnly: options.activeOnly ?? true,
  });
  const response = await request<{ rows?: PropertyListItem[] }>(`/properties${query}`, "GET");
  return response.rows ?? [];
}

export async function fetchOffersLogs(
  filters: OffersLogsListFilters,
): Promise<OffersLogsListResponse> {
  const query = buildQueryString({
    propertyId: filters.propertyId,
    from: filters.from,
    to: filters.to,
    channel: filters.channel,
    decisionStatus: filters.decisionStatus,
    requestId: filters.requestId,
    decisionId: filters.decisionId,
    truncated: filters.truncated,
    errors: filters.errors,
    fallbackOnly: filters.fallbackOnly,
    slow: filters.slow,
    dlq: filters.dlq,
    limit: filters.limit,
    cursor: filters.cursor,
  });

  if (isMock) {
    await delay(220);
    return {
      serverNow: new Date().toISOString(),
      pageInfo: {
        hasMore: false,
        limit: filters.limit ?? 25,
      },
      rows: [],
    };
  }

  const response = await request<unknown>(`/offers/logs${query}`, "GET");
  return normalizeOffersLogsListResponse(response);
}

export async function fetchOffersLogDetail(
  decisionId: string,
  options: { includeRawPayloads?: boolean; payloadCapKb?: number } = {},
): Promise<OffersLogsDetailResponse> {
  const query = buildQueryString({
    includeRawPayloads: options.includeRawPayloads,
    payloadCapKb: options.payloadCapKb,
  });

  if (isMock) {
    await delay(200);
    throw new Error("Offer logs detail is unavailable in mock mode.");
  }

  return request<OffersLogsDetailResponse>(
    `/offers/logs/${encodeURIComponent(decisionId)}${query}`,
    "GET",
  );
}

function normalizeOffersLogsListResponse(payload: unknown): OffersLogsListResponse {
  const response = isRecord(payload) ? payload : {};
  const pageInfoSource = isRecord(response.pageInfo)
    ? response.pageInfo
    : isRecord(response.page_info)
      ? response.page_info
      : {};
  const rowsSource = Array.isArray(response.rows)
    ? response.rows
    : Array.isArray(response.data)
      ? response.data
      : [];

  return {
    serverNow: firstString(response.serverNow, response.server_now) ?? new Date().toISOString(),
    pageInfo: {
      hasMore: Boolean(pageInfoSource.hasMore ?? pageInfoSource.has_more),
      nextCursor: firstString(pageInfoSource.nextCursor, pageInfoSource.next_cursor),
      limit:
        firstNumber(pageInfoSource.limit) ??
        (Array.isArray(rowsSource) ? rowsSource.length : 25),
    },
    rows: rowsSource.map(normalizeOffersLogsListRow),
  };
}

function normalizeOffersLogsListRow(rawRow: unknown): OffersLogsListRow {
  const row = isRecord(rawRow) ? rawRow : {};
  const createdOutbox = isRecord(row.createdOutbox)
    ? row.createdOutbox
    : isRecord(row.created_outbox)
      ? row.created_outbox
      : null;
  const reasonCodes = toStringArray(
    Array.isArray(row.reasonCodes) ? row.reasonCodes : row.reason_codes,
  );
  const decisionStatus = firstString(row.decisionStatus, row.decision_status);
  const createdOutboxStateRaw = firstString(
    row.createdEventOutboxState,
    row.created_event_outbox_state,
  );

  const parsedOutboxState = parseAuditOutboxState(createdOutboxStateRaw);

  return {
    decisionId: firstString(row.decisionId, row.decision_id) ?? "",
    requestId: firstString(row.requestId, row.request_id) ?? "",
    propertyId: firstString(row.propertyId, row.property_id) ?? "",
    property: firstString(row.property),
    tenantId: firstString(row.tenantId, row.tenant_id),
    eventRecordedAt:
      firstString(row.eventRecordedAt, row.event_recorded_at, row.createdAt, row.created_at) ??
      new Date().toISOString(),
    recordedAt: firstString(row.recordedAt, row.recorded_at, row.eventRecordedAt, row.event_recorded_at),
    channel: firstString(row.channel) ?? "-",
    checkIn: firstString(row.checkIn, row.check_in),
    checkOut: firstString(row.checkOut, row.check_out),
    rooms: firstNumber(row.rooms),
    adults: firstNumber(row.adults),
    children: firstNumber(row.children),
    createdOutbox: createdOutbox
      ? {
          state: parseAuditOutboxState(firstString(createdOutbox.state)) ?? "PENDING",
          attempts: firstNumber(createdOutbox.attempts),
          lastErrorSafeMessage: firstString(
            createdOutbox.lastErrorSafeMessage,
            createdOutbox.last_error_safe_message,
          ),
        }
      : null,
    primaryOfferName: firstString(row.primaryOfferName, row.primary_offer_name),
    primaryOfferTotal: firstNumber(row.primaryOfferTotal, row.primary_offer_total),
    decisionStatus:
      decisionStatus === "OK" ||
      decisionStatus === "NO_OFFERS" ||
      decisionStatus === "FALLBACK_ONLY" ||
      decisionStatus === "ERROR"
        ? decisionStatus
        : "ERROR",
    offersCount: firstNumber(row.offersCount, row.offers_count) ?? 0,
    truncated: Boolean(row.truncated),
    primaryOfferType: firstString(row.primaryOfferType, row.primary_offer_type),
    primaryOfferRoomTypeName: firstString(
      row.primaryOfferRoomTypeName,
      row.primary_offer_room_type_name,
      row.primaryOfferName,
      row.primary_offer_name,
      row.primaryRoomTypeName,
      row.primary_room_type_name,
    ),
    primaryOfferRatePlanName: firstString(
      row.primaryOfferRatePlanName,
      row.primary_offer_rate_plan_name,
      row.primaryRatePlanName,
      row.primary_rate_plan_name,
    ),
    primaryOfferTotalPrice: firstNumber(
      row.primaryOfferTotalPrice,
      row.primary_offer_total_price,
      row.primaryTotal,
      row.primary_total,
      row.primaryOfferTotal,
      row.primary_offer_total,
    ),
    primaryOfferCurrency: firstString(
      row.primaryOfferCurrency,
      row.primary_offer_currency,
      row.primaryTotalCurrency,
      row.primary_total_currency,
      row.currency,
    ),
    primaryOfferRefundability: (() => {
      const raw = row.primaryOfferRefundability ?? row.primary_offer_refundability;
      return typeof raw === "string" || typeof raw === "boolean" ? raw : null;
    })(),
    fallbackActionType: firstString(row.fallbackActionType, row.fallback_action_type),
    httpStatus: firstNumber(row.httpStatus, row.http_status),
    servedAttemptedAt: firstString(row.servedAttemptedAt, row.served_attempted_at),
    servedFinishedAt: firstString(row.servedFinishedAt, row.served_finished_at),
    served: Boolean(row.served),
    servedSuccess: Boolean(row.servedSuccess ?? row.served_success),
    createdEventId: firstString(row.createdEventId, row.created_event_id),
    createdEventRecordedAt: firstString(row.createdEventRecordedAt, row.created_event_recorded_at),
    createdEventOutboxState: parsedOutboxState,
    createdEventOutboxAttempts: firstNumber(row.createdEventOutboxAttempts, row.created_event_outbox_attempts),
    createdEventLastErrorSafeMessage: firstString(
      row.createdEventLastErrorSafeMessage,
      row.created_event_last_error_safe_message,
    ),
    reasonCodes,
    reasonCodesCount: firstNumber(row.reasonCodesCount, row.reason_codes_count) ?? reasonCodes.length,
    reasonCodesTruncated: Boolean(row.reasonCodesTruncated ?? row.reason_codes_truncated),
    latencyMs: firstNumber(row.latencyMs, row.latency_ms) ?? 0,
    decisionAgeMs: firstNumber(row.decisionAgeMs, row.decision_age_ms) ?? 0,
  };
}

export async function updateUserProfile(
  payload: UpdateUserPayload,
): Promise<void> {
  if (isMock) {
    await delay(300);
    return;
  }

  await request("/users/me", "PATCH", payload);
}

export async function changeUserPassword(
  payload: ChangePasswordPayload,
): Promise<void> {
  if (isMock) {
    await delay(300);
    return;
  }

  await request("/users/me/change-password", "POST", payload);
}

function mapToChatMessage(
  payload: AIChatResponse,
  fallbackRole: ChatMessage["role"] = "assistant",
): ChatMessage {
  const content = payload.text ?? payload.response ?? payload.prompt ?? "";
  return {
    id: payload.id || crypto.randomUUID(),
    role: payload.role || fallbackRole,
    content,
    createdAt: payload.createdAt || new Date().toISOString(),
  };
}

function mapSessionToMessages(session: AIChatResponse): ChatMessage[] {
  const messages: ChatMessage[] = [];
  if (session.prompt) {
    messages.push(
      mapToChatMessage(
        {
          id: `${session.id || crypto.randomUUID()}-prompt`,
          role: "user",
          text: session.prompt,
          createdAt: session.createdAt,
        },
        "user",
      ),
    );
  }
  messages.push(
    mapToChatMessage(
      {
        id: `${session.id || crypto.randomUUID()}-response`,
        text: session.response ?? session.text ?? "",
        createdAt: session.createdAt,
      },
      "assistant",
    ),
  );
  return messages;
}
export type UpdateUserPayload = {
  name?: string;
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
  revokeOtherSessions?: boolean;
};
