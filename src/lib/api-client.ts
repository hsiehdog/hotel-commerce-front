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

export type ChatOffer = {
  id: string;
  name: string;
  description: string;
  rate_type: "flexible" | "non_refundable";
  rate_label?: string;
  cancellation_policy: string;
  payment_policy: string;
  enhancements?: string[];
  disclosures?: string[];
  fee_breakdown?: Array<{
    label: string;
    amount: number;
  }>;
  price: {
    currency: string;
    per_night: number;
    subtotal: number;
    taxes_and_fees: number;
    total: number;
    add_ons_total?: number;
    total_with_add_ons?: number;
  };
};

export type ChatCommerceOffer = Record<string, unknown>;

export type ChatCommerce = {
  offers?: ChatCommerceOffer[];
  [key: string]: unknown;
};

export type ChatMessageResponse = {
  data: {
    sessionId: string;
    assistantMessage: string;
    status: ChatMessageStatus;
    nextAction: ChatNextAction;
    slots: Record<string, unknown>;
    offers?: ChatOffer[];
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
    primaryOfferType?: string | null;
    fallbackActionType?: string | null;
    offersCount: number;
    decisionStatus: OffersLogDecisionStatus;
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
    reasonDetailsVersion: number;
    globalReasonCodes: string[];
    selectionSummary?: string | null;
    reasonDetails?: unknown;
    reasonsByOfferId?: Record<string, string[]> | null;
    presentedOffers: OffersLogPresentedOffer[];
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
    data?: Record<string, unknown>;
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

function normalizeLabel(value: string): string {
  const withSpaces = value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();
  if (!withSpaces) {
    return "";
  }
  return withSpaces
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function toTitleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
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

function looksGenericOfferName(value: string): boolean {
  return /^offer\s*\d+$/i.test(value.trim());
}

function normalizeChatOffer(rawOffer: unknown, fallbackIndex: number): ChatOffer {
  const offer = isRecord(rawOffer) ? rawOffer : {};
  const roomType = isRecord(offer.roomType) ? offer.roomType : {};
  const ratePlan = isRecord(offer.ratePlan) ? offer.ratePlan : {};
  const price = isRecord(offer.price) ? offer.price : {};
  const pricing = isRecord(offer.pricing) ? offer.pricing : {};
  const breakdown = isRecord(pricing.breakdown) ? pricing.breakdown : {};
  const includedFees = isRecord(breakdown.includedFees) ? breakdown.includedFees : {};

  const currency =
    firstString(price.currency, pricing.currency, offer.currency) ?? "USD";
  const subtotal =
    firstNumber(price.subtotal, breakdown.baseRateSubtotal, breakdown.subtotal, pricing.subtotal) ?? 0;
  const taxesAndFees =
    firstNumber(price.taxes_and_fees, breakdown.taxesAndFees, pricing.taxesAndFees) ?? 0;
  const addOnsTotal =
    firstNumber(
      price.add_ons_total,
      breakdown.addOnsTotal,
      includedFees.totalIncludedFees,
      includedFees.total_included_fees,
    ) ?? 0;
  const total =
    firstNumber(price.total, pricing.total, subtotal + taxesAndFees + addOnsTotal) ?? 0;
  const totalWithAddOns =
    firstNumber(price.total_with_add_ons, pricing.totalWithAddOns) ??
    (addOnsTotal > 0 ? total : undefined);

  const rateTypeRaw = firstString(
    offer.rate_type,
    offer.rateType,
    offer.refundability,
    offer.type,
  );
  const rateType: ChatOffer["rate_type"] =
    rateTypeRaw === "non_refundable" ||
    rateTypeRaw?.toLowerCase().includes("non") ||
    rateTypeRaw?.toLowerCase().includes("no_refund")
      ? "non_refundable"
      : "flexible";

  const feeBreakdown = Object.entries(includedFees)
    .filter(([key, value]) => {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes("totalincludedfees") ||
        lowerKey.includes("total_included_fees") ||
        lowerKey.includes("pernight") ||
        lowerKey.includes("per_night") ||
        lowerKey === "nights" ||
        lowerKey.includes("addon")
      ) {
        return false;
      }
      return typeof value === "number" && Number.isFinite(value) && value > 0;
    })
    .map(([key, value]) => ({
      label: normalizeLabel(
        key
          .replace(/total$/i, "")
          .replace(/_total$/i, ""),
      ),
      amount: Number(value),
    }));

  const enhancements = toStringArray(offer.enhancements);
  const disclosures = toStringArray(offer.disclosures);
  const rateLabelRaw =
    firstString(
      offer.ratePlanName,
      offer.rate_plan_name,
      ratePlan.name,
      ratePlan.id,
      offer.ratePlan,
      offer.rate_plan,
      offer.rate_type,
    ) ?? rateType;

  const normalizedRateLabel =
    rateLabelRaw.toLowerCase() === "flexible"
      ? "Flexible"
      : rateLabelRaw.toLowerCase() === "non_refundable"
        ? "Non-refundable"
        : toTitleCase(rateLabelRaw);

  const paymentPolicy =
    firstString(
      offer.payment_policy,
      offer.paymentTiming,
      offer.payment_timing,
    ) ??
    (rateType === "non_refundable" ? "Pay now" : "Pay at property");

  const cancellationPolicy =
    firstString(
      offer.cancellation_policy,
      offer.cancellationSummary,
      offer.policySummary,
      offer.cancellation_policy_summary,
    ) ??
    (rateType === "non_refundable"
      ? "This rate is non-refundable."
      : "You can cancel for free up to a day before check-in.");

  const preferredName = firstString(
    offer.roomTypeName,
    offer.room_type_name,
    roomType.name,
    roomType.id,
    offer.roomType,
    offer.room_type,
    offer.optionTitle,
    offer.offerName,
    offer.name,
  );
  const normalizedName =
    preferredName && !looksGenericOfferName(preferredName)
      ? preferredName
      : firstString(
          offer.roomTypeName,
          offer.room_type_name,
          roomType.name,
          roomType.id,
          offer.roomType,
          offer.room_type,
          offer.offerName,
          offer.name,
        );

  return {
    id: firstString(offer.id, offer.offerId, offer.offer_id) ?? `offer-${fallbackIndex + 1}`,
    name:
      normalizedName ??
      firstString(offer.ratePlanName, offer.rate_plan_name, ratePlan.name, ratePlan.id) ??
      `Offer ${fallbackIndex + 1}`,
    description:
      firstString(
        offer.description,
        offer.summary,
        offer.roomTypeDescription,
        offer.room_type_description,
      ) ?? "Offer details available.",
    rate_type: rateType,
    rate_label: normalizedRateLabel,
    cancellation_policy: cancellationPolicy,
    payment_policy: paymentPolicy,
    enhancements,
    disclosures,
    fee_breakdown: feeBreakdown,
    price: {
      currency,
      per_night:
        firstNumber(price.per_night, price.perNight, pricing.perNight) ?? 0,
      subtotal,
      taxes_and_fees: taxesAndFees,
      total,
      add_ons_total: addOnsTotal > 0 ? addOnsTotal : undefined,
      total_with_add_ons: totalWithAddOns,
    },
  };
}

export function getChatOffersFromResponse(data: ChatMessageResponse["data"]): ChatOffer[] {
  const commerceOffers = data.commerce?.offers;
  if (Array.isArray(commerceOffers) && commerceOffers.length > 0) {
    return commerceOffers.map((entry, index) => normalizeChatOffer(entry, index));
  }

  if (Array.isArray(data.offers) && data.offers.length > 0) {
    return data.offers.map((entry, index) => normalizeChatOffer(entry, index));
  }

  return [];
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
        "Thanks. I can help with that request. Here are two mock offers you can inspect.",
      status: "OK",
      nextAction: "PRESENT_OFFERS",
      slots: {},
      commerce: {
        offers: [
          {
            id: "offer-1",
            name: "Deluxe Flexible",
            description: "King room with breakfast included.",
            rate_type: "flexible",
            cancellation_policy: "Free cancellation until 24h before check-in.",
            payment_policy: "Pay at property",
            pricing: {
              currency: "USD",
              perNight: 189,
              total: 440,
              breakdown: {
                baseRateSubtotal: 378,
                taxesAndFees: 62,
                includedFees: {
                  totalIncludedFees: 0,
                },
              },
            },
          },
          {
            id: "offer-2",
            name: "Saver Non-refundable",
            description: "Best value room-only rate.",
            rate_type: "non_refundable",
            cancellation_policy: "Non-refundable after booking.",
            payment_policy: "Pay now",
            pricing: {
              currency: "USD",
              perNight: 162,
              total: 380,
              breakdown: {
                baseRateSubtotal: 324,
                taxesAndFees: 56,
                includedFees: {
                  totalIncludedFees: 0,
                },
              },
            },
          },
        ],
      },
      offers: [
        {
          id: "offer-1",
          name: "Deluxe Flexible",
          description: "King room with breakfast included.",
          rate_type: "flexible",
          cancellation_policy: "Free cancellation until 24h before check-in.",
          payment_policy: "Pay at property",
          price: {
            currency: "USD",
            per_night: 189,
            subtotal: 378,
            taxes_and_fees: 62,
            total: 440,
          },
        },
        {
          id: "offer-2",
          name: "Saver Non-refundable",
          description: "Best value room-only rate.",
          rate_type: "non_refundable",
          cancellation_policy: "Non-refundable after booking.",
          payment_policy: "Pay now",
          price: {
            currency: "USD",
            per_night: 162,
            subtotal: 324,
            taxes_and_fees: 56,
            total: 380,
          },
        },
      ],
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
