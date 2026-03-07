import type { RecommendedRoom } from "@/lib/offers-demo";

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

export type ChatSession = {
  sessionId: string;
  createdAt: string;
  expiresAt: string;
  propertyId: string;
  language: string | null;
  greeting: string;
};

export type ChatMessageRequest = {
  message: string;
  clientMessageId: string;
  metadata?: { locale?: string; device?: string };
};

export type ChatCommerce = {
  [key: string]: unknown;
};

export type ChatMessageResponse = {
  data: {
    sessionId: string;
    assistantMessage: string;
    status: ChatMessageStatus;
    nextAction: ChatNextAction;
    pendingAction?: ChatPendingAction | null;
    slots: Record<string, unknown>;
    responseUi: ChatResponseUi;
    commerce?: ChatCommerce;
    decisionId?: string;
    debug?: Record<string, unknown>;
  };
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

let mockChatSessionCount = 0;

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

function parseAuditOutboxState(value: unknown): AuditOutboxState | null {
  if (value === "PENDING" || value === "ENQUEUED" || value === "PROCESSED" || value === "DLQ") {
    return value;
  }
  return null;
}

function extractChatRecommendationSource(data: ChatMessageResponse["data"]): Record<string, unknown> | null {
  const commerce = isRecord(data.commerce) ? data.commerce : {};
  const commerceData = isRecord(commerce.data) ? commerce.data : commerce;
  const responseData = isRecord((data as Record<string, unknown>).data)
    ? ((data as Record<string, unknown>).data as Record<string, unknown>)
    : {};

  if (isRecord(commerceData.recommended_room) || Array.isArray(commerceData.ranked_rooms)) {
    return commerceData;
  }

  if (isRecord(responseData.recommended_room) || Array.isArray(responseData.ranked_rooms)) {
    return responseData;
  }

  return null;
}

function toRecommendedRoomPriceRows(value: unknown): Array<{ label: string; amount: number }> {
  if (isRecord(value)) {
    const groups = new Map<string, { total: number | null; perNight: number | null; flatFee: number | null }>();

    for (const [key, rawValue] of Object.entries(value)) {
      const numeric = firstNumber(rawValue);
      if (numeric == null || numeric <= 0) {
        continue;
      }

      if (key.endsWith("_total")) {
        const base = key.slice(0, -"_total".length);
        const current = groups.get(base) ?? { total: null, perNight: null, flatFee: null };
        current.total = numeric;
        groups.set(base, current);
        continue;
      }

      if (key.endsWith("_per_night")) {
        const base = key.slice(0, -"_per_night".length);
        const current = groups.get(base) ?? { total: null, perNight: null, flatFee: null };
        current.perNight = numeric;
        groups.set(base, current);
        continue;
      }

      if (key.endsWith("_flat_fee")) {
        const base = `${key.slice(0, -"_flat_fee".length)}_fee`;
        const current = groups.get(base) ?? { total: null, perNight: null, flatFee: null };
        current.flatFee = numeric;
        groups.set(base, current);
        continue;
      }

      const current = groups.get(key) ?? { total: null, perNight: null, flatFee: null };
      current.total = numeric;
      groups.set(key, current);
    }

    return Array.from(groups.entries())
      .map(([base, values]) => {
        if (values.total === null || values.total <= 0) {
          return null;
        }

        const suffix =
          values.flatFee !== null && values.flatFee > 0
            ? ""
            : values.perNight !== null && values.perNight > 0
              ? ` (${formatCompactCurrency(values.perNight)}/night)`
              : "";

        return {
          label: `${toTitleLabel(base)}${suffix}`,
          amount: values.total,
        };
      })
      .filter((entry): entry is { label: string; amount: number } => entry !== null);
  }

  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      const row = isRecord(entry) ? entry : {};
      const label = firstString(row.label, row.name, row.type);
      const amount = firstNumber(row.amount, row.value, row.price);

      if (!label || amount === null) {
        return null;
      }

      return { label, amount };
    })
    .filter((entry): entry is { label: string; amount: number } => entry !== null);
}

function toTitleLabel(value: string): string {
  return value
    .replace(/_/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
}

function formatCompactCurrency(amount: number): string {
  if (Number.isInteger(amount)) {
    return `$${amount}`;
  }
  return `$${amount.toFixed(2)}`;
}

function normalizeRecommendedRoomForDisplay(raw: Record<string, unknown>): RecommendedRoom {
  const pricingBreakdown = isRecord(raw.pricing_breakdown) ? raw.pricing_breakdown : {};

  return {
    roomType: firstString(raw.room_type, raw.room_type_name) ?? "Recommended room",
    ratePlan: firstString(raw.rate_plan, raw.rate_plan_name) ?? "Rate plan",
    nightlyPrice: firstNumber(raw.nightly_price) ?? null,
    totalPrice: firstNumber(raw.total_price, raw.price) ?? null,
    pricingBreakdown: {
      subtotal: firstNumber(pricingBreakdown.subtotal, raw.subtotal) ?? null,
      taxesAndFees: firstNumber(
        pricingBreakdown.taxes_and_fees,
        pricingBreakdown.taxesAndFees,
        raw.taxes_and_fees,
      ) ?? null,
      includedFees: toRecommendedRoomPriceRows(
        pricingBreakdown.included_fees ?? pricingBreakdown.includedFees ?? raw.fee_breakdown,
      ),
    },
    score: firstNumber(raw.score) ?? null,
    reasons: toStringArray(raw.reasons),
    policySummary: firstString(raw.policy_summary, raw.cancellation_policy) ?? "-",
    inventoryNote: firstString(raw.inventory_note) ?? "",
    roomTypeId: firstString(raw.room_type_id) ?? "",
    ratePlanId: firstString(raw.rate_plan_id) ?? "",
  };
}

function normalizeRankedRoomForDisplay(raw: Record<string, unknown>): RecommendedRoom {
  return {
    roomType: firstString(raw.room_type_name, raw.room_type_id) ?? "Recommended room",
    ratePlan: firstString(raw.rate_plan_name, raw.rate_plan_id) ?? "Rate plan",
    nightlyPrice: firstNumber(raw.price) ?? null,
    totalPrice: firstNumber(raw.price) ?? null,
    pricingBreakdown: {
      subtotal: firstNumber(raw.price) ?? null,
      taxesAndFees: null,
      includedFees: [],
    },
    score: firstNumber(raw.score) ?? null,
    reasons: toStringArray(raw.reasons),
    policySummary: firstString(raw.policy_summary, raw.cancellation_summary) ?? "Offer details available.",
    inventoryNote: firstString(raw.inventory_note) ?? "",
    roomTypeId: firstString(raw.room_type_id) ?? "",
    ratePlanId: firstString(raw.rate_plan_id) ?? "",
  };
}

export function getChatRecommendedRoomFromResponse(
  data: ChatMessageResponse["data"],
): RecommendedRoom | null {
  const source = extractChatRecommendationSource(data);
  if (!source) {
    return null;
  }

  if (isRecord(source.recommended_room)) {
    return normalizeRecommendedRoomForDisplay(source.recommended_room);
  }

  if (Array.isArray(source.ranked_rooms) && isRecord(source.ranked_rooms[0])) {
    return normalizeRankedRoomForDisplay(source.ranked_rooms[0]);
  }

  return null;
}

function normalizeChatSlotHints(value: unknown): ChatResponseUiQuestion["slotHints"] | undefined {
  const raw = isRecord(value) ? value : {};
  const missingRequired = toStringArray(raw.missingRequired ?? raw.missing_required);
  const collected = toStringArray(raw.collected);

  if (missingRequired.length === 0 && collected.length === 0) {
    return undefined;
  }

  return {
    missingRequired,
    collected,
  };
}

function normalizeChatTargetSlots(value: unknown): string[] | undefined {
  const targetSlots = toStringArray(value);
  return targetSlots.length > 0 ? targetSlots : undefined;
}

function normalizeChatAnswerMode(value: unknown): ChatAnswerMode | null {
  if (value === "yes_no" || value === "numeric" || value === "single_choice" || value === "free_text") {
    return value;
  }
  return null;
}

function normalizeChatResponseOptions(value: unknown): ChatResponseUiOption[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (typeof entry === "string") {
      const normalized = entry.trim();
      return normalized ? [{ label: normalized, value: normalized }] : [];
    }

    if (!isRecord(entry)) {
      return [];
    }

    const label = firstString(entry.label, entry.text, entry.name, entry.value);
    const optionValue = firstString(entry.value, entry.id, entry.key, entry.label, entry.text);
    if (!label || !optionValue) {
      return [];
    }

    return [{
      label,
      value: optionValue,
      description: firstString(entry.description, entry.helper) ?? null,
    }];
  });
}

function normalizeResponseUi(value: unknown): ChatResponseUi | null {
  if (!isRecord(value) || typeof value.type !== "string") {
    return null;
  }

  const answerMode =
    normalizeChatAnswerMode(value.answerMode) ??
    normalizeChatAnswerMode(value.input) ??
    normalizeChatAnswerMode(value.variant);
  const targetSlots = normalizeChatTargetSlots(value.targetSlots ?? value.target_slots);
  const slotHints = normalizeChatSlotHints(value.slotHints);

  if (value.type === "question") {
    return {
      type: "question",
      answerMode: answerMode ?? "free_text",
      targetSlots,
      slotHints,
    };
  }

  if (value.type === "confirmation") {
    return {
      type: "confirmation",
      answerMode: answerMode ?? "yes_no",
      targetSlots,
      slotHints,
      summary: isRecord(value.summary) ? value.summary : null,
    };
  }

  if (value.type === "selection") {
    return {
      type: "selection",
      answerMode: answerMode ?? "single_choice",
      targetSlots,
      slotHints,
      options: normalizeChatResponseOptions(value.options),
    };
  }

  if (value.type === "offer_recommendation") {
    return {
      type: "offer_recommendation",
      showRecommendedRoom: Boolean(value.showRecommendedRoom),
      showRecommendedOffers: Boolean(value.showRecommendedOffers),
      showRankedRooms: Boolean(value.showRankedRooms),
    };
  }

  if (value.type === "error") {
    return {
      type: "error",
      retryable: Boolean(value.retryable),
    };
  }

  return null;
}

export function getChatResponseUi(data: ChatMessageResponse["data"]): ChatResponseUi {
  const explicit = normalizeResponseUi((data as Record<string, unknown>).responseUi);
  if (explicit) {
    return explicit;
  }

  if (data.status === "ERROR") {
    return {
      type: "error",
      retryable: false,
    };
  }

  if (getChatRecommendedRoomFromResponse(data)) {
    return {
      type: "offer_recommendation",
      showRecommendedRoom: true,
      showRecommendedOffers: false,
      showRankedRooms: false,
    };
  }

  if (data.nextAction === "CONFIRM") {
    return {
      type: "confirmation",
      answerMode: "yes_no",
      targetSlots: undefined,
      slotHints: undefined,
      summary: null,
    };
  }

  return {
    type: "question",
    answerMode: "free_text",
    targetSlots: undefined,
    slotHints: undefined,
  };
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

export async function createChatSession(input: {
  property_id?: string;
  timezone?: string;
  language?: string;
  clientConversationId?: string;
}): Promise<ChatSession> {
  if (isMock) {
    await delay(240);
    mockChatSessionCount += 1;
    return {
      sessionId: `mock-session-${mockChatSessionCount}`,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      propertyId: input.property_id ?? "demo_property",
      language: input.language ?? null,
      greeting: `Welcome to ${input.property_id ?? "demo_property"}. How can I help with your stay?`,
    };
  }

  const response = await request<{ data: ChatSession }>("/chat/sessions", "POST", input);
  return response.data;
}

export async function sendChatSessionMessage(
  sessionId: string,
  input: ChatMessageRequest,
): Promise<ChatMessageResponse["data"]> {
  if (isMock) {
    await delay(520);
    return {
      sessionId,
      assistantMessage:
        "Thanks. I found one recommended room for your request.",
      status: "OK",
      nextAction: "PRESENT_OFFERS",
      slots: {},
      responseUi: {
        type: "offer_recommendation",
        showRecommendedRoom: true,
        showRecommendedOffers: false,
        showRankedRooms: false,
      },
      commerce: {
        currency: "USD",
        recommended_room: {
          room_type: "Deluxe King",
          rate_plan: "Flexible Rate",
          nightly_price: 189,
          total_price: 440,
          score: 0.88,
          reasons: ["Strong fit for party size", "Good relative value"],
          policy_summary: "Refundable rate with flexible cancellation.",
          inventory_note: "Only 2 left at this rate.",
          room_type_id: "rt_deluxe_king",
          rate_plan_id: "rp_flex",
        },
        recommended_offers: [],
        ranked_rooms: [],
        fallback: null,
      },
      decisionId: `mock-decision-${input.clientMessageId}`,
    };
  }

  const response = await request<ChatMessageResponse>(
    `/chat/sessions/${encodeURIComponent(sessionId)}/messages`,
    "POST",
    input,
  );
  return response.data;
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
};
