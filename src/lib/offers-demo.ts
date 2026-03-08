export type OfferChannel = "voice" | "web" | "agent" | "chat";

export type RoomOccupancy = {
  adults: number;
  children: number;
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
  children?: number;
  child_ages: number[];
  roomOccupancies: RoomOccupancy[];
  bed_type_preference?: string;
  pet_friendly?: boolean;
  accessible_room?: boolean;
  needs_two_beds?: boolean;
  parking_needed?: boolean;
  breakfast_package?: boolean;
  early_check_in?: boolean;
  late_check_out?: boolean;
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
  pet_friendly: boolean;
  accessible_room: boolean;
  needs_two_beds: boolean;
  parking_needed: boolean;
  breakfast_package: boolean;
  early_check_in: boolean;
  late_check_out: boolean;
  stub_scenario: string;
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
    id: "inn-family-stay",
    label: "Family stay",
    description: "Inn at Mount Shasta family stay. Shows family_traveler, Bunk Suite, and property-limited upsells.",
    values: {
      channel: "web",
      check_in: "2026-06-16",
      check_out: "2026-06-18",
      rooms: "1",
      adults: "2",
      children: "2",
      child_ages: [7, 10],
      roomOccupancies: [{ adults: 2, children: 2 }],
    },
  },
  {
    id: "inn-couple-getaway",
    label: "Couple getaway",
    description: "Inn at Mount Shasta couple getaway. Shows weekend_couple, leisure fit, and late checkout upsell.",
    values: {
      channel: "web",
      check_in: "2026-06-19",
      check_out: "2026-06-21",
      rooms: "1",
      adults: "2",
      children: "0",
      child_ages: [],
      roomOccupancies: [{ adults: 2, children: 0 }],
    },
  },
  {
    id: "inn-solo-weekday",
    label: "Solo weekday traveler",
    description: "Inn at Mount Shasta solo weekday traveler. Shows solo_business_traveler and a simple fit-first room recommendation.",
    values: {
      channel: "web",
      check_in: "2026-05-12",
      check_out: "2026-05-14",
      rooms: "1",
      adults: "1",
      children: "0",
      child_ages: [],
      roomOccupancies: [{ adults: 1, children: 0 }],
    },
  },
  {
    id: "inn-group-booking",
    label: "Group booking",
    description: "Inn at Mount Shasta group booking. Shows group and multi-room handling.",
    values: {
      channel: "agent",
      check_in: "2026-06-12",
      check_out: "2026-06-15",
      rooms: "2",
      adults: "4",
      children: "0",
      child_ages: [],
      roomOccupancies: [
        { adults: 2, children: 0 },
        { adults: 2, children: 0 },
      ],
    },
  },
  {
    id: "inn-late-checkout-choice",
    label: "Late checkout choice",
    description: "Late checkout choice. Reuse the couple scenario, then ask for late checkout and choose Noon for $25 or 1 PM for $50.",
    values: {
      channel: "web",
      check_in: "2026-06-19",
      check_out: "2026-06-21",
      rooms: "1",
      adults: "2",
      children: "0",
      child_ages: [],
      roomOccupancies: [{ adults: 2, children: 0 }],
    },
  },
  {
    id: "demo-extended-stay",
    label: "Extended stay",
    description: "Extended-stay scenario for demo_property. Best long-stay showcase with long-stay pricing and a stronger parking upsell from per-night pricing.",
    values: {
      channel: "web",
      check_in: "2026-05-11",
      check_out: "2026-05-18",
      rooms: "1",
      adults: "1",
      children: "0",
      child_ages: [],
      roomOccupancies: [{ adults: 1, children: 0 }],
    },
  },
  {
    id: "demo-last-minute",
    label: "Last-minute",
    description: "Last-minute scenario for demo_property. Shows short lead-time booking behavior and a short-stay upsell pattern.",
    values: {
      channel: "web",
      check_in: "2026-03-09",
      check_out: "2026-03-10",
      rooms: "1",
      adults: "1",
      children: "0",
      child_ages: [],
      roomOccupancies: [{ adults: 1, children: 0 }],
    },
  },
  {
    id: "demo-general-traveler",
    label: "General traveler fallback",
    description: "General traveler fallback for demo_property. Use this as a non-specialized traveler example, not a guarantee of a clean top-label win.",
    values: {
      channel: "web",
      check_in: "2026-08-18",
      check_out: "2026-08-20",
      rooms: "1",
      adults: "3",
      children: "0",
      child_ages: [],
      roomOccupancies: [{ adults: 3, children: 0 }],
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

export type RecommendedRoom = {
  roomType: string;
  ratePlan: string;
  nightlyPrice: number | null;
  totalPrice: number | null;
  pricingBreakdown: {
    subtotal: number | null;
    taxesAndFees: number | null;
    includedFees: Array<{ label: string; amount: number }>;
  };
  score: number | null;
  reasons: string[];
  policySummary: string;
  inventoryNote: string;
  roomTypeId: string;
  ratePlanId: string;
};

export type RecommendedUpsell = {
  bundleType: string;
  label: string;
  score: number | null;
  reasons: string[];
  estimatedPriceDelta: number | null;
};

export type RankedRoom = {
  roomTypeId: string;
  roomTypeName: string;
  ratePlanId: string;
  price: number | null;
  score: number | null;
  componentScores: Record<string, number>;
  reasons: string[];
};

export type FallbackGuidance = {
  type: string;
  reason: string;
  suggestions: unknown[];
};

export type PropertyContext = {
  propertyId: string;
  currency: string;
  strategyMode: string;
  timezone: string;
  policies: string[];
  capabilities: string[];
};

export type ParsedOffersResponse = {
  propertyId: string;
  channel: string;
  currency: string;
  priceBasisUsed: string;
  configVersion: string;
  personaConfidence: Record<string, number>;
  recommendedRoom: RecommendedRoom | null;
  recommendedOffers: RecommendedUpsell[];
  rankedRooms: RankedRoom[];
  fallback: FallbackGuidance | null;
  propertyContext: PropertyContext;
  debug: {
    resolvedRequest: unknown;
    profilePreAri: unknown;
    profileFinal: unknown;
    scoring: unknown;
    selectionSummary: unknown;
  };
  raw: Record<string, unknown>;
};

export function getDefaultOffersDraft(): OffersDraft {
  return {
    property_id: "demo_property",
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
    pet_friendly: false,
    accessible_room: false,
    needs_two_beds: false,
    parking_needed: false,
    breakfast_package: false,
    early_check_in: false,
    late_check_out: false,
    stub_scenario: "",
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
  if (rooms && adults && adults < rooms) {
    errors.push("adults must be at least rooms so each room has one adult.");
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
    currency: "USD",
    rooms,
    adults,
    children,
    child_ages: draft.child_ages,
    roomOccupancies: buildRoomOccupancies(rooms, adults, children),
    pet_friendly: draft.pet_friendly,
    accessible_room: draft.accessible_room,
    needs_two_beds: draft.needs_two_beds,
    parking_needed: draft.parking_needed,
    breakfast_package: draft.breakfast_package,
    early_check_in: draft.early_check_in,
    late_check_out: draft.late_check_out,
    stub_scenario: draft.stub_scenario.trim() || undefined,
    debug: true,
    ...advancedFields,
  };

  if (draft.nights.trim()) {
    payload.nights = Number(draft.nights);
  }

  if (payload.children === 0) {
    delete payload.children;
  }

  return payload;
}

export function buildRoomOccupancies(
  rooms: number,
  adults: number,
  children: number,
): RoomOccupancy[] {
  if (
    !Number.isFinite(rooms) ||
    rooms <= 0 ||
    !Number.isFinite(adults) ||
    adults <= 0 ||
    !Number.isFinite(children) ||
    children < 0
  ) {
    return [];
  }

  return Array.from({ length: rooms }, (_, index) => ({
    adults: distributeGuests(adults, rooms, index),
    children: distributeGuests(children, rooms, index),
  }));
}

export function parseOffersResponse(payload: unknown): ParsedOffersResponse {
  const data = unwrapOffersResponseRecord(payload);
  const debug = isRecord(data.debug) ? data.debug : {};

  const recommendedRoom = parseRecommendedRoom(data.recommended_room);
  const recommendedOffers = parseRecommendedOffers(data.recommended_offers);
  const rankedRooms = parseRankedRooms(data.ranked_rooms);
  const fallback = parseFallback(data.fallback);
  const propertyContext = parsePropertyContext(data, debug);

  return {
    propertyId: toStringOrFallback(data.propertyId, data.property_id, "-"),
    channel: toStringOrFallback(data.channel, "-"),
    currency: toStringOrFallback(data.currency, "-"),
    priceBasisUsed: toStringOrFallback(data.priceBasisUsed, data.price_basis_used, "-"),
    configVersion: toStringOrFallback(data.configVersion, data.config_version, "-"),
    personaConfidence: parsePersonaConfidence(data.persona_confidence),
    recommendedRoom,
    recommendedOffers,
    rankedRooms,
    fallback,
    propertyContext,
    debug: {
      resolvedRequest: debug.resolvedRequest ?? null,
      profilePreAri: debug.profilePreAri ?? null,
      profileFinal: debug.profileFinal ?? null,
      scoring: debug.scoring ?? null,
      selectionSummary: debug.selectionSummary ?? null,
    },
    raw: data,
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

function parseRecommendedRoom(value: unknown): RecommendedRoom | null {
  if (!isRecord(value)) {
    return null;
  }

  const pricingBreakdown = parseRecommendedRoomPricingBreakdown(value.pricing_breakdown);

  return {
    roomType: toStringOrFallback(value.room_type, "-"),
    ratePlan: toStringOrFallback(value.rate_plan, "-"),
    nightlyPrice: firstNumber(value.nightly_price),
    totalPrice: firstNumber(value.total_price),
    pricingBreakdown,
    score: firstNumber(value.score),
    reasons: firstStringArray(value.reasons),
    policySummary: toStringOrFallback(value.policy_summary, "-"),
    inventoryNote: toStringOrFallback(value.inventory_note, ""),
    roomTypeId: toStringOrFallback(value.room_type_id, ""),
    ratePlanId: toStringOrFallback(value.rate_plan_id, ""),
  };
}

function parseRecommendedOffers(value: unknown): RecommendedUpsell[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((entry) => {
    const row = isRecord(entry) ? entry : {};
    return {
      bundleType: toStringOrFallback(row.bundle_type, ""),
      label: toStringOrFallback(row.label, "-"),
      score: firstNumber(row.score),
      reasons: firstStringArray(row.reasons),
      estimatedPriceDelta: firstNumber(row.estimated_price_delta),
    };
  });
}

function parseRankedRooms(value: unknown): RankedRoom[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((entry) => {
    const row = isRecord(entry) ? entry : {};
    const components = isRecord(row.component_scores) ? row.component_scores : {};
    return {
      roomTypeId: toStringOrFallback(row.room_type_id, ""),
      roomTypeName: toStringOrFallback(row.room_type_name, "-"),
      ratePlanId: toStringOrFallback(row.rate_plan_id, ""),
      price: firstNumber(row.price),
      score: firstNumber(row.score),
      componentScores: Object.fromEntries(
        Object.entries(components)
          .map(([key, val]) => [key, toNumber(val)])
          .filter((entry): entry is [string, number] => entry[1] !== null),
      ),
      reasons: firstStringArray(row.reasons),
    };
  });
}

function parseFallback(value: unknown): FallbackGuidance | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    type: toStringOrFallback(value.type, "unknown"),
    reason: toStringOrFallback(value.reason, "No recommendation available."),
    suggestions: Array.isArray(value.suggestions) ? value.suggestions : [],
  };
}

function parseRecommendedRoomPricingBreakdown(value: unknown): RecommendedRoom["pricingBreakdown"] {
  if (!isRecord(value)) {
    return {
      subtotal: null,
      taxesAndFees: null,
      includedFees: [],
    };
  }

  const includedFeesSource = isRecord(value.included_fees) ? value.included_fees : {};
  const groups = new Map<string, { total: number | null; perNight: number | null; flatFee: number | null }>();

  for (const [key, rawValue] of Object.entries(includedFeesSource)) {
    const numeric = toNumber(rawValue);
    if (numeric === null || numeric <= 0) {
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

  const includedFees = Array.from(groups.entries())
    .map(([base, values]) => {
      if (values.total === null || values.total <= 0) {
        return null;
      }

      const labelBase = toTitleLabel(base);
      const suffix =
        values.flatFee !== null && values.flatFee > 0
          ? ""
          : values.perNight !== null && values.perNight > 0
          ? ` (${formatCompactCurrency(values.perNight)}/night)`
          : "";

      return {
        label: `${labelBase}${suffix}`,
        amount: values.total,
      };
    })
    .filter((entry): entry is { label: string; amount: number } => entry !== null);

  return {
    subtotal: firstNumber(value.subtotal),
    taxesAndFees: firstNumber(value.taxes_and_fees),
    includedFees,
  };
}

function parsePersonaConfidence(value: unknown): Record<string, number> {
  if (!isRecord(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value)
      .map(([key, item]) => [key, toNumber(item)])
      .filter((entry): entry is [string, number] => entry[1] !== null),
  );
}

function parsePropertyContext(
  data: Record<string, unknown>,
  debug: Record<string, unknown>,
): PropertyContext {
  const resolvedRequest = pickRecord(debug.resolvedRequest, debug.resolved_request);
  const profileFinal = pickRecord(debug.profileFinal, debug.profile_final);

  return {
    propertyId: toStringOrFallback(
      data.propertyId,
      data.property_id,
      resolvedRequest.property_id,
      "-",
    ),
    currency: toStringOrFallback(data.currency, resolvedRequest.currency, "-"),
    strategyMode: toStringOrFallback(
      profileFinal.strategyMode,
      profileFinal.strategy_mode,
      resolvedRequest.strategyMode,
      resolvedRequest.strategy_mode,
      "-",
    ),
    timezone: toStringOrFallback(
      data.timezone,
      data.time_zone,
      profileFinal.timezone,
      profileFinal.time_zone,
      "-",
    ),
    policies: collectStringValues(data.policies, data.disclosures),
    capabilities: collectStringValues(profileFinal.capabilities),
  };
}

function collectStringValues(...values: unknown[]): string[] {
  const output = new Set<string>();

  for (const value of values) {
    if (!value) {
      continue;
    }

    if (typeof value === "string" && value.trim()) {
      output.add(value);
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string" && item.trim()) {
          output.add(item);
        }
      }
    }
  }

  return Array.from(output);
}

function pickRecord(...values: unknown[]): Record<string, unknown> {
  for (const value of values) {
    if (isRecord(value)) {
      return value;
    }
  }
  return {};
}

function toPositiveInt(value: string): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return Math.floor(parsed);
}

function toNonNegativeInt(value: string): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  return Math.floor(parsed);
}

function distributeGuests(total: number, rooms: number, index: number): number {
  if (total <= 0 || rooms <= 0) {
    return 0;
  }

  const base = Math.floor(total / rooms);
  const remainder = total % rooms;
  return base + (index < remainder ? 1 : 0);
}

function unwrapOffersResponseRecord(payload: unknown): Record<string, unknown> {
  if (!isRecord(payload)) {
    return {};
  }

  if (isRecord(payload.data)) {
    return payload.data;
  }

  return payload;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toStringOrFallback(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }

  return "";
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

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

function firstNumber(...values: unknown[]): number | null {
  for (const value of values) {
    const numeric = toNumber(value);
    if (numeric !== null) {
      return numeric;
    }
  }

  return null;
}

function firstStringArray(...values: unknown[]): string[] {
  for (const value of values) {
    if (!Array.isArray(value)) {
      continue;
    }

    const mapped = value
      .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
      .filter(Boolean);

    if (mapped.length > 0) {
      return mapped;
    }
  }

  return [];
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function extractErrorMessage(body: unknown): string | null {
  if (typeof body === "string" && body.trim()) {
    return body;
  }

  if (isRecord(body)) {
    const nested = body.error;
    if (isRecord(nested)) {
      return toStringOrFallback(nested.message, nested.detail, nested.title);
    }

    return toStringOrFallback(body.message, body.detail, body.error_description);
  }

  return null;
}
