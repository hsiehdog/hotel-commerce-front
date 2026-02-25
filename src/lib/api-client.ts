type HttpMethod = "GET" | "POST" | "PATCH";

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
  tenantId?: string;
  eventRecordedAt: string;
  channel: string;
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
  ratePlanId?: string | null;
  score?: number | null;
  rank?: number | null;
  totalPrice?: number | null;
  currency?: string | null;
  basis?: string | null;
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
    const message = await response.text();
    throw new Error(message || "Unexpected API error");
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

  return request<OffersLogsListResponse>(`/offers/logs${query}`, "GET");
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
