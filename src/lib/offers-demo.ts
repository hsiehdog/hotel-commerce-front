export type OfferChannel = "voice" | "web" | "agent";

export type RoomOccupancy = {
  adults: number;
  children: number;
};

export type OfferPreferences = {
  needs_space: boolean;
  late_arrival: boolean;
};

export type OffersGenerateRequest = {
  property_id: string;
  channel: OfferChannel;
  check_in: string;
  check_out: string;
  nights?: number;
  currency: string;
  rooms: number;
  adults: number;
  children: number;
  child_ages: number[];
  roomOccupancies: RoomOccupancy[];
  preferences: OfferPreferences;
  stub_scenario?: string;
  debug: boolean;
} & Record<string, unknown>;

export type OffersDraft = {
  property_id: string;
  channel: OfferChannel;
  check_in: string;
  check_out: string;
  nights: string;
  currency: string;
  rooms: string;
  adults: string;
  children: string;
  child_ages: number[];
  roomOccupancies: RoomOccupancy[];
  preferences: OfferPreferences;
  stub_scenario: string;
  debug: boolean;
  extraJson: string;
};

export type ScenarioPreset = {
  id: string;
  label: string;
  description: string;
  values: Partial<OffersDraft>;
  extraJson?: Record<string, unknown>;
};

export const scenarioPresets: ScenarioPreset[] = [
  {
    id: "family-trip",
    label: "Family trip",
    description: "Two adults + kids, larger room preference",
    values: {
      property_id: "hotel-lake-001",
      channel: "web",
      check_in: "2026-05-12",
      check_out: "2026-05-16",
      currency: "USD",
      rooms: "1",
      adults: "2",
      children: "2",
      child_ages: [5, 8],
      roomOccupancies: [{ adults: 2, children: 2 }],
      preferences: {
        needs_space: true,
        late_arrival: false,
      },
      stub_scenario: "family_space_priority",
      debug: true,
    },
  },
  {
    id: "late-arrival",
    label: "Late arrival",
    description: "Check-in after midnight and flexible plan",
    values: {
      property_id: "hotel-city-007",
      channel: "voice",
      check_in: "2026-04-03",
      check_out: "2026-04-05",
      currency: "USD",
      rooms: "1",
      adults: "1",
      children: "0",
      child_ages: [],
      roomOccupancies: [{ adults: 1, children: 0 }],
      preferences: {
        needs_space: false,
        late_arrival: true,
      },
      stub_scenario: "late_arrival_after_midnight",
      debug: true,
    },
  },
  {
    id: "compression-weekend",
    label: "Compression weekend",
    description: "High demand period with stricter policies",
    values: {
      property_id: "hotel-stadium-021",
      channel: "agent",
      check_in: "2026-09-18",
      check_out: "2026-09-20",
      currency: "USD",
      rooms: "2",
      adults: "4",
      children: "0",
      child_ages: [],
      roomOccupancies: [
        { adults: 2, children: 0 },
        { adults: 2, children: 0 },
      ],
      preferences: {
        needs_space: false,
        late_arrival: false,
      },
      stub_scenario: "compression_weekend_event",
      debug: true,
    },
    extraJson: {
      loyalty_tier: "none",
      demand_signal: "high",
    },
  },
  {
    id: "currency-mismatch",
    label: "Currency mismatch",
    description: "Guest requests unsupported billing currency",
    values: {
      property_id: "hotel-euro-014",
      channel: "web",
      check_in: "2026-06-10",
      check_out: "2026-06-13",
      currency: "JPY",
      rooms: "1",
      adults: "2",
      children: "1",
      child_ages: [10],
      roomOccupancies: [{ adults: 2, children: 1 }],
      preferences: {
        needs_space: false,
        late_arrival: false,
      },
      stub_scenario: "currency_fallback",
      debug: true,
    },
  },
  {
    id: "agent-upgrade",
    label: "Agent upsell",
    description: "Agent-assisted premium upsell path",
    values: {
      property_id: "hotel-bay-033",
      channel: "agent",
      check_in: "2026-07-21",
      check_out: "2026-07-24",
      currency: "USD",
      rooms: "1",
      adults: "2",
      children: "0",
      child_ages: [],
      roomOccupancies: [{ adults: 2, children: 0 }],
      preferences: {
        needs_space: true,
        late_arrival: false,
      },
      stub_scenario: "agent_upgrade_path",
      debug: true,
    },
    extraJson: {
      loyalty_tier: "gold",
      upgrade_preference: "suite",
    },
  },
];

export type OffersApiError = {
  status: number;
  message: string;
  body: unknown;
};

export class OffersRequestError extends Error {
  status: number;
  body: unknown;

  constructor(payload: OffersApiError) {
    super(payload.message);
    this.name = "OffersRequestError";
    this.status = payload.status;
    this.body = payload.body;
  }
}

export function getDefaultOffersDraft(): OffersDraft {
  return {
    property_id: "hotel-demo-001",
    channel: "web",
    check_in: "",
    check_out: "",
    nights: "",
    currency: "USD",
    rooms: "1",
    adults: "2",
    children: "0",
    child_ages: [],
    roomOccupancies: [{ adults: 2, children: 0 }],
    preferences: {
      needs_space: false,
      late_arrival: false,
    },
    stub_scenario: "",
    debug: true,
    extraJson: "",
  };
}

export function parseAdvancedJson(input: string): {
  data: Record<string, unknown>;
  error: string | null;
} {
  const trimmed = input.trim();
  if (!trimmed) {
    return { data: {}, error: null };
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (!isRecord(parsed)) {
      return { data: {}, error: "Advanced JSON must be a top-level object." };
    }
    return { data: parsed, error: null };
  } catch {
    return { data: {}, error: "Advanced JSON is not valid JSON." };
  }
}

export function validateOffersDraft(
  draft: OffersDraft,
  advancedJsonError: string | null,
): string[] {
  const errors: string[] = [];

  if (!draft.property_id.trim()) {
    errors.push("property_id is required.");
  }
  if (!draft.check_in) {
    errors.push("check_in is required.");
  }
  if (!draft.check_out) {
    errors.push("check_out is required.");
  }
  if (!draft.currency.trim()) {
    errors.push("currency is required.");
  }

  const rooms = toPositiveInt(draft.rooms);
  const adults = toPositiveInt(draft.adults);
  const children = toNonNegativeInt(draft.children);

  if (!rooms) {
    errors.push("rooms must be a number greater than 0.");
  }
  if (!adults) {
    errors.push("adults must be a number greater than 0.");
  }
  if (children === null) {
    errors.push("children must be 0 or greater.");
  }

  const checkInDate = new Date(draft.check_in);
  const checkOutDate = new Date(draft.check_out);
  if (draft.check_in && draft.check_out && !(checkOutDate > checkInDate)) {
    errors.push("check_out must be after check_in.");
  }

  if (children !== null && draft.child_ages.length !== children) {
    errors.push("child_ages length must match children.");
  }

  if (draft.child_ages.some((age) => age < 0 || Number.isNaN(age))) {
    errors.push("child_ages must contain valid non-negative numbers.");
  }

  if (rooms && draft.roomOccupancies.length !== rooms) {
    errors.push("roomOccupancies length must match rooms.");
  }

  if (
    draft.roomOccupancies.some(
      (occupancy) => occupancy.adults <= 0 || occupancy.children < 0,
    )
  ) {
    errors.push("Each roomOccupancy must have adults > 0 and children >= 0.");
  }

  if (draft.nights.trim()) {
    const nights = toPositiveInt(draft.nights);
    if (!nights) {
      errors.push("nights must be a number greater than 0 when provided.");
    }
  }

  if (advancedJsonError) {
    errors.push(advancedJsonError);
  }

  return errors;
}

export function buildOffersGenerateRequest(
  draft: OffersDraft,
  advancedFields: Record<string, unknown>,
): OffersGenerateRequest {
  const rooms = Number(draft.rooms);
  const adults = Number(draft.adults);
  const children = Number(draft.children);

  const payload: OffersGenerateRequest = {
    property_id: draft.property_id.trim(),
    channel: draft.channel,
    check_in: draft.check_in,
    check_out: draft.check_out,
    currency: draft.currency.trim().toUpperCase(),
    rooms,
    adults,
    children,
    child_ages: draft.child_ages,
    roomOccupancies: draft.roomOccupancies,
    preferences: {
      needs_space: draft.preferences.needs_space,
      late_arrival: draft.preferences.late_arrival,
    },
    stub_scenario: draft.stub_scenario.trim() || undefined,
    debug: draft.debug,
    ...advancedFields,
  };

  if (draft.nights.trim()) {
    payload.nights = Number(draft.nights);
  }

  return payload;
}

export type ParsedOfferCard = {
  offerId: string;
  type: string;
  recommended: boolean;
  room: string;
  ratePlan: string;
  policy: unknown;
  pricing: unknown;
  enhancements: unknown;
  disclosures: unknown;
  urgency: unknown;
  raw: Record<string, unknown>;
};

export type ParsedOffersResponse = {
  propertyId: string;
  channel: string;
  currency: string;
  priceBasisUsed: string;
  configVersion: string;
  offers: ParsedOfferCard[];
  decisionTrace: unknown;
  reasonCodes: string[];
  debug: {
    resolvedRequest: unknown;
    profilePreAri: unknown;
    profileFinal: unknown;
    selectionSummary: unknown;
    topCandidates: Array<Record<string, unknown>>;
  };
  raw: Record<string, unknown>;
};

export function parseOffersResponse(payload: unknown): ParsedOffersResponse {
  const record = isRecord(payload) ? payload : {};
  const debug = isRecord(record.debug) ? record.debug : {};

  const offersSource = firstArray(
    record.offers,
    record.selectedOffers,
    record.recommendations,
  );

  const offers = offersSource.map((entry, index) => {
    const raw = isRecord(entry) ? entry : {};
    return {
      offerId: toStringOrFallback(
        raw.offerId,
        raw.offer_id,
        raw.id,
        `offer-${index + 1}`,
      ),
      type: toStringOrFallback(raw.type, raw.offerType, "unknown"),
      recommended: Boolean(raw.recommended ?? raw.isRecommended),
      room: toStringOrFallback(raw.room, raw.roomType, raw.room_type, "-"),
      ratePlan: toStringOrFallback(raw.ratePlan, raw.rate_plan, "-"),
      policy: raw.policy ?? raw.cancellationPolicy ?? raw.terms ?? null,
      pricing: raw.pricing ?? raw.price ?? raw.totalPrice ?? null,
      enhancements: raw.enhancements ?? raw.upsells ?? [],
      disclosures: raw.disclosures ?? raw.notices ?? [],
      urgency: raw.urgency ?? raw.fallbackUrgency ?? null,
      raw,
    };
  });

  return {
    propertyId: toStringOrFallback(record.propertyId, record.property_id, "-"),
    channel: toStringOrFallback(record.channel, "-"),
    currency: toStringOrFallback(record.currency, "-"),
    priceBasisUsed: toStringOrFallback(
      record.priceBasisUsed,
      record.price_basis_used,
      "-",
    ),
    configVersion: toStringOrFallback(
      record.configVersion,
      record.config_version,
      "-",
    ),
    offers,
    decisionTrace: record.decisionTrace ?? null,
    reasonCodes: firstStringArray(record.reasonCodes, record.reason_codes),
    debug: {
      resolvedRequest: debug.resolvedRequest ?? null,
      profilePreAri: debug.profilePreAri ?? null,
      profileFinal: debug.profileFinal ?? null,
      selectionSummary: debug.selectionSummary ?? null,
      topCandidates: firstArray(debug.topCandidates).map((item) =>
        isRecord(item) ? item : {},
      ),
    },
    raw: record,
  };
}

export async function requestOfferGeneration(
  payload: OffersGenerateRequest,
): Promise<unknown> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
  const response = await fetch(`${baseUrl}/offers/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const body = await parseResponseBody(response);

  if (!response.ok) {
    const fallbackMessage =
      response.status === 400
        ? "Schema validation error (400)."
        : response.status === 422
          ? "Clarification required (422)."
          : "Request failed.";

    const message = extractErrorMessage(body) || fallbackMessage;
    throw new OffersRequestError({
      status: response.status,
      message,
      body,
    });
  }

  return body;
}

export type RunComparison = {
  changedOfferIds: {
    added: string[];
    removed: string[];
  };
  summaryChanges: string[];
};

export function compareRuns(
  previous: ParsedOffersResponse | null,
  current: ParsedOffersResponse,
): RunComparison | null {
  if (!previous) {
    return null;
  }

  const previousIds = new Set(previous.offers.map((offer) => offer.offerId));
  const currentIds = new Set(current.offers.map((offer) => offer.offerId));

  const added = Array.from(currentIds).filter((id) => !previousIds.has(id));
  const removed = Array.from(previousIds).filter((id) => !currentIds.has(id));

  const summaryChanges: string[] = [];

  if (previous.priceBasisUsed !== current.priceBasisUsed) {
    summaryChanges.push(
      `priceBasisUsed: ${previous.priceBasisUsed} -> ${current.priceBasisUsed}`,
    );
  }
  if (previous.configVersion !== current.configVersion) {
    summaryChanges.push(
      `configVersion: ${previous.configVersion} -> ${current.configVersion}`,
    );
  }
  if (previous.currency !== current.currency) {
    summaryChanges.push(`currency: ${previous.currency} -> ${current.currency}`);
  }

  return {
    changedOfferIds: {
      added,
      removed,
    },
    summaryChanges,
  };
}

function toPositiveInt(value: string): number | null {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function toNonNegativeInt(value: string): number | null {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return null;
  }
  return parsed;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function firstArray(...values: unknown[]): unknown[] {
  for (const value of values) {
    if (Array.isArray(value)) {
      return value;
    }
  }
  return [];
}

function firstStringArray(...values: unknown[]): string[] {
  for (const value of values) {
    if (Array.isArray(value)) {
      return value
        .map((item) => (typeof item === "string" ? item : String(item ?? "")))
        .filter(Boolean);
    }
  }
  return [];
}

function toStringOrFallback(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return "";
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { message: text };
  }
}

function extractErrorMessage(body: unknown): string | null {
  if (!isRecord(body)) {
    return null;
  }

  if (typeof body.message === "string" && body.message) {
    return body.message;
  }

  if (typeof body.error === "string" && body.error) {
    return body.error;
  }

  return null;
}
