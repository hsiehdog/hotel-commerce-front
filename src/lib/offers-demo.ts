export type OfferChannel = "voice" | "web" | "agent";

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
  children: number;
  child_ages: number[];
  roomOccupancies: RoomOccupancy[];
  pet_friendly?: boolean;
  accessible_room?: boolean;
  needs_two_beds?: boolean;
  budget_cap?: number;
  parking_needed?: boolean;
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
  budget_cap: string;
  parking_needed: boolean;
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
    id: "family-stay",
    label: "Family stay",
    description: "Family profile with child ages",
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
      needs_two_beds: true,
      stub_scenario: "family_space_priority",
    },
  },
  {
    id: "short-stay",
    label: "Short stay",
    description: "Single-night profile with standard constraints",
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
      parking_needed: true,
      stub_scenario: "solo_short_stay",
    },
  },
  {
    id: "high-demand-weekend",
    label: "High-demand weekend",
    description: "Compression demand profile with tighter controls",
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
      stub_scenario: "compression_weekend_event",
    },
    extraJson: {
      demand_signal: "high",
    },
  },
  {
    id: "price-sensitive-guest",
    label: "Price-sensitive guest",
    description: "Cost-first selection path with saver fallback",
    values: {
      property_id: "hotel-euro-014",
      channel: "web",
      check_in: "2026-06-10",
      check_out: "2026-06-13",
      currency: "USD",
      rooms: "1",
      adults: "2",
      children: "0",
      child_ages: [],
      roomOccupancies: [{ adults: 2, children: 0 }],
      budget_cap: "350",
      stub_scenario: "price_sensitive_guest",
    },
    extraJson: {
      budget_priority: "high",
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
    pet_friendly: false,
    accessible_room: false,
    needs_two_beds: false,
    budget_cap: "",
    parking_needed: false,
    stub_scenario: "",
    extraJson: "",
  };
}

export function getComputedNights(checkIn: string, checkOut: string): number | null {
  if (!checkIn || !checkOut) {
    return null;
  }

  const start = new Date(checkIn);
  const end = new Date(checkOut);
  if (!(end > start)) {
    return null;
  }

  const ms = end.getTime() - start.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
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

  if (draft.budget_cap.trim()) {
    const budgetCap = Number(draft.budget_cap);
    if (!Number.isFinite(budgetCap) || budgetCap <= 0) {
      errors.push("budget_cap must be a number greater than 0 when provided.");
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
  const payload: OffersGenerateRequest = {
    property_id: draft.property_id.trim(),
    channel: draft.channel,
    check_in: draft.check_in,
    check_out: draft.check_out,
    currency: draft.currency.trim().toUpperCase(),
    rooms: Number(draft.rooms),
    adults: Number(draft.adults),
    children: Number(draft.children),
    child_ages: draft.child_ages,
    roomOccupancies: draft.roomOccupancies,
    pet_friendly: draft.pet_friendly,
    accessible_room: draft.accessible_room,
    needs_two_beds: draft.needs_two_beds,
    parking_needed: draft.parking_needed,
    stub_scenario: draft.stub_scenario.trim() || undefined,
    debug: true,
    ...advancedFields,
  };

  if (draft.nights.trim()) {
    payload.nights = Number(draft.nights);
  }

  if (draft.budget_cap.trim()) {
    payload.budget_cap = Number(draft.budget_cap);
  }

  return payload;
}

export type ParsedOfferCard = {
  offerId: string;
  type: string;
  recommended: boolean;
  room: string;
  roomTypeDescription: string;
  features: string[];
  ratePlan: string;
  policy: unknown;
  pricing: unknown;
  enhancements: unknown;
  disclosures: unknown;
  totalPrice: number | null;
  pricingBreakdown: {
    subtotal: number | null;
    taxesFees: number | null;
    addOns: number | null;
    total: number | null;
  };
  cancellationSummary: string;
  paymentSummary: string;
  raw: Record<string, unknown>;
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
  offers: ParsedOfferCard[];
  decisionTrace: unknown;
  reasonCodes: string[];
  propertyContext: PropertyContext;
  debug: {
    resolvedRequest: unknown;
    profilePreAri: unknown;
    profileFinal: unknown;
    selectionSummary: unknown;
    topCandidates: Array<Record<string, unknown>>;
  };
  raw: Record<string, unknown>;
};

export type ReasonCodeGroups = {
  filters: string[];
  selection: string[];
  fallback: string[];
  other: string[];
};

export function parseOffersResponse(payload: unknown): ParsedOffersResponse {
  const record = unwrapOffersResponseRecord(payload);
  const debug = isRecord(record.debug) ? record.debug : {};

  const offersSource = firstArray(
    record.offers,
    record.selectedOffers,
    record.selected_offers,
    record.recommendations,
  );

  const offers = offersSource.map((entry, index) => {
    const raw = isRecord(entry) ? entry : {};
    const roomType = isRecord(raw.roomType) ? raw.roomType : {};
    const ratePlan = isRecord(raw.ratePlan) ? raw.ratePlan : {};

    return {
      offerId: toStringOrFallback(
        raw.offerId,
        raw.offer_id,
        raw.id,
        `offer-${index + 1}`,
      ),
      type: toStringOrFallback(raw.type, raw.offerType, "unknown"),
      recommended: Boolean(raw.recommended ?? raw.isRecommended),
      room: toStringOrFallback(
        raw.room,
        raw.room_name,
        raw.roomType,
        raw.room_type,
        roomType.name,
        roomType.id,
        "-",
      ),
      roomTypeDescription: toStringOrFallback(
        raw.roomTypeDescription,
        raw.room_type_description,
        roomType.description,
        "",
      ),
      features: firstStringArray(raw.features, raw.featureFlags, roomType.features),
      ratePlan: toStringOrFallback(
        raw.ratePlan,
        raw.rate_plan,
        raw.rate_plan_name,
        ratePlan.name,
        ratePlan.id,
        "-",
      ),
      policy: raw.policy ?? raw.cancellationPolicy ?? raw.terms ?? null,
      pricing: raw.pricing ?? raw.price ?? raw.totalPrice ?? null,
      enhancements: raw.enhancements ?? raw.upsells ?? [],
      disclosures: raw.disclosures ?? raw.notices ?? [],
      totalPrice: extractTotalPrice(raw),
      pricingBreakdown: extractPricingBreakdown(raw),
      cancellationSummary: extractCancellationSummary(raw),
      paymentSummary: extractPaymentSummary(raw),
      raw,
    };
  });

  const propertyContext = parsePropertyContext(record, debug);

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
    decisionTrace: record.decisionTrace ?? record.decision_trace ?? null,
    reasonCodes: firstStringArray(
      record.reasonCodes,
      record.reason_codes,
      debug.reasonCodes,
      debug.reason_codes,
    ),
    propertyContext,
    debug: {
      resolvedRequest: debug.resolvedRequest ?? null,
      profilePreAri: debug.profilePreAri ?? null,
      profileFinal: debug.profileFinal ?? null,
      selectionSummary: debug.selectionSummary ?? null,
      topCandidates: firstArray(debug.topCandidates, debug.top_candidates).map((item) =>
        isRecord(item) ? item : {},
      ),
    },
    raw: record,
  };
}

export function groupReasonCodes(reasonCodes: string[]): ReasonCodeGroups {
  const groups: ReasonCodeGroups = {
    filters: [],
    selection: [],
    fallback: [],
    other: [],
  };

  for (const code of reasonCodes) {
    const normalized = code.toLowerCase();
    if (
      normalized.includes("filter") ||
      normalized.includes("eligib") ||
      normalized.includes("blocked")
    ) {
      groups.filters.push(code);
      continue;
    }
    if (
      normalized.includes("select") ||
      normalized.includes("recommend") ||
      normalized.includes("rank")
    ) {
      groups.selection.push(code);
      continue;
    }
    if (
      normalized.includes("fallback") ||
      normalized.includes("waitlist") ||
      normalized.includes("transfer") ||
      normalized.includes("text")
    ) {
      groups.fallback.push(code);
      continue;
    }
    groups.other.push(code);
  }

  return groups;
}

export function getPrimaryOffer(offers: ParsedOfferCard[]): ParsedOfferCard | null {
  return offers.find((offer) => offer.recommended) ?? offers[0] ?? null;
}

export function getSecondaryOffer(offers: ParsedOfferCard[]): ParsedOfferCard | null {
  const primaryIndex = offers.findIndex((offer) => offer.recommended);
  if (primaryIndex === -1) {
    return offers[1] ?? null;
  }

  if (offers.length < 2) {
    return null;
  }

  const secondaryIndex = primaryIndex === 0 ? 1 : 0;
  return offers[secondaryIndex] ?? null;
}

export function buildDeltaLine(
  primary: ParsedOfferCard | null,
  secondary: ParsedOfferCard | null,
): string {
  if (!primary || !secondary) {
    return "No secondary tradeoff available for this run.";
  }

  if (primary.totalPrice !== null && secondary.totalPrice !== null) {
    const delta = secondary.totalPrice - primary.totalPrice;
    if (delta > 0) {
      return `Save ${formatCurrency(delta)} vs secondary option.`;
    }
    if (delta < 0) {
      return `${formatCurrency(Math.abs(delta))} higher for lower risk/flexibility.`;
    }
  }

  if (primary.cancellationSummary.toLowerCase().includes("refundable")) {
    return "Lower risk due to refundability.";
  }

  return "Tradeoff balances price, flexibility, and conversion likelihood.";
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

function parsePropertyContext(
  record: Record<string, unknown>,
  debug: Record<string, unknown>,
): PropertyContext {
  const resolvedRequest = pickRecord(debug.resolvedRequest, debug.resolved_request);
  const profileFinal = pickRecord(debug.profileFinal, debug.profile_final);
  const resolvedProperty = pickRecord(
    record.propertyContext,
    record.property_context,
    profileFinal.propertyContext,
    profileFinal.property_context,
    profileFinal.property,
  );

  const strategySource = pickRecord(record.strategy, record.strategy_context);
  const policySource = pickRecord(
    record.stayPolicies,
    record.stay_policies,
    record.policy,
    record.policy_context,
    profileFinal.stayPolicies,
    profileFinal.stay_policies,
    profileFinal.policy,
  );

  const capabilities = flattenCapabilityFlags(
    record.capabilities,
    record.fallbackCapabilities,
    record.fallback_capabilities,
    resolvedProperty.capabilities,
    profileFinal.capabilities,
    profileFinal.fallbackCapabilities,
    profileFinal.fallback_capabilities,
  );

  const policies = collectStringValues(
    record.policies,
    record.disclosures,
    record.stayPolicies,
    record.stay_policies,
    policySource.policies,
    policySource.disclosures,
    policySource.summary,
    profileFinal.policies,
    profileFinal.disclosures,
    profileFinal.stayPolicies,
    profileFinal.stay_policies,
    resolvedProperty.policies,
    resolvedProperty.disclosures,
  );

  return {
    propertyId: toStringOrFallback(
      record.propertyId,
      record.property_id,
      resolvedProperty.propertyId,
      resolvedProperty.property_id,
      resolvedRequest.property_id,
      "-",
    ),
    currency: toStringOrFallback(record.currency, resolvedRequest.currency, "-"),
    strategyMode: toStringOrFallback(
      record.strategyMode,
      record.strategy_mode,
      strategySource.mode,
      strategySource.strategyMode,
      strategySource.strategy_mode,
      resolvedRequest.strategyMode,
      resolvedRequest.strategy_mode,
      profileFinal.strategyMode,
      profileFinal.strategy_mode,
      resolvedProperty.strategyMode,
      resolvedProperty.strategy_mode,
      "-",
    ),
    timezone: toStringOrFallback(
      record.timezone,
      record.time_zone,
      resolvedProperty.timezone,
      resolvedProperty.time_zone,
      profileFinal.timezone,
      profileFinal.time_zone,
      "-",
    ),
    policies,
    capabilities,
  };
}

function flattenCapabilityFlags(...inputs: unknown[]): string[] {
  const flags = new Set<string>();

  for (const input of inputs) {
    if (!input) {
      continue;
    }

    if (Array.isArray(input)) {
      for (const item of input) {
        if (typeof item === "string" && item.trim()) {
          flags.add(item);
        }
      }
      continue;
    }

    if (isRecord(input)) {
      collectCapabilityFlags(input, "", flags);
    }
  }

  return Array.from(flags);
}

function collectCapabilityFlags(
  value: Record<string, unknown>,
  prefix: string,
  output: Set<string>,
) {
  for (const [key, entry] of Object.entries(value)) {
    const label = prefix ? `${prefix}.${key}` : key;

    if (typeof entry === "boolean") {
      output.add(`${label}: ${entry ? "on" : "off"}`);
      continue;
    }

    if (typeof entry === "string" && entry.trim()) {
      output.add(`${label}: ${entry}`);
      continue;
    }

    if (Array.isArray(entry)) {
      const list = entry
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean);
      if (list.length > 0) {
        output.add(`${label}: ${list.join(", ")}`);
      }
      continue;
    }

    if (isRecord(entry)) {
      collectCapabilityFlags(entry, label, output);
    }
  }
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
        } else if (isRecord(item)) {
          const fromRecord = toStringOrFallback(
            item.summary,
            item.label,
            item.description,
            item.name,
          );
          if (fromRecord) {
            output.add(fromRecord);
          }
        }
      }
      continue;
    }

    if (isRecord(value)) {
      const fromRecord = toStringOrFallback(
        value.summary,
        value.label,
        value.description,
        value.name,
      );
      if (fromRecord) {
        output.add(fromRecord);
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

function extractTotalPrice(offer: Record<string, unknown>): number | null {
  const breakdown = extractPricingBreakdown(offer);
  if (breakdown.total !== null) {
    return breakdown.total;
  }

  const pricing = isRecord(offer.pricing) ? offer.pricing : null;
  const direct = [
    offer.total,
    offer.totalPrice,
    offer.total_amount,
    pricing?.total,
    pricing?.amount,
    pricing?.totalPrice,
  ];

  for (const value of direct) {
    const numeric = toNumber(value);
    if (numeric !== null) {
      return numeric;
    }
  }

  return null;
}

function extractPricingBreakdown(offer: Record<string, unknown>): {
  subtotal: number | null;
  taxesFees: number | null;
  addOns: number | null;
  total: number | null;
} {
  const pricing = isRecord(offer.pricing) ? offer.pricing : {};
  const breakdown = isRecord(pricing.breakdown) ? pricing.breakdown : {};
  const includedFees = isRecord(breakdown.includedFees)
    ? breakdown.includedFees
    : isRecord(breakdown.included_fees)
      ? breakdown.included_fees
      : {};

  const subtotal = firstNumber(
    breakdown.subtotal,
    breakdown.sub_total,
    breakdown.baseRateSubtotal,
    breakdown.base_rate_subtotal,
    pricing.subtotal,
    pricing.sub_total,
    pricing.totalBeforeTax,
    pricing.total_before_tax,
  );

  const taxesFees = firstNumber(
    breakdown.taxesFees,
    breakdown.taxes_and_fees,
    breakdown.taxesAndFees,
    pricing.taxesFees,
    pricing.taxes_and_fees,
    pricing.taxesAndFees,
    pricing.taxes,
    pricing.fees,
  );

  const addOns = firstNumber(
    breakdown.addOns,
    breakdown.add_ons,
    breakdown.addons,
    includedFees.totalIncludedFees,
    includedFees.total_included_fees,
    pricing.addOns,
    pricing.add_ons,
    pricing.addons,
  );

  const total = firstNumber(
    breakdown.total,
    pricing.total,
    pricing.totalAfterTax,
    pricing.total_after_tax,
    offer.total,
    offer.totalPrice,
    offer.total_amount,
  );

  return {
    subtotal,
    taxesFees,
    addOns,
    total,
  };
}

function extractCancellationSummary(offer: Record<string, unknown>): string {
  const policy = isRecord(offer.policy)
    ? offer.policy
    : isRecord(offer.cancellationPolicy)
      ? offer.cancellationPolicy
      : null;

  if (!policy) {
    return "Policy details unavailable";
  }

  if (typeof policy.summary === "string" && policy.summary) {
    return policy.summary;
  }
  if (
    typeof policy.cancellationSummary === "string" &&
    policy.cancellationSummary
  ) {
    return policy.cancellationSummary;
  }

  const refundable = policy.refundable;
  if (typeof refundable === "boolean") {
    return refundable ? "Refundable" : "Non-refundable";
  }
  if (typeof policy.refundability === "string" && policy.refundability) {
    return policy.refundability.replaceAll("_", " ");
  }

  return "Policy details available";
}

function extractPaymentSummary(offer: Record<string, unknown>): string {
  const pricing = isRecord(offer.pricing) ? offer.pricing : null;
  const policy = isRecord(offer.policy) ? offer.policy : null;
  const source = [
    offer.paymentType,
    offer.payment,
    pricing?.paymentType,
    pricing?.payment,
    policy?.paymentTiming,
    policy?.payment_timing,
  ];

  for (const value of source) {
    if (typeof value === "string" && value) {
      return value;
    }
  }

  return "Pay at property";
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
    const parsed = toNumber(value);
    if (parsed !== null) {
      return parsed;
    }
  }
  return null;
}

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
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
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
    if (typeof value === "boolean") {
      return value ? "true" : "false";
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

function unwrapOffersResponseRecord(payload: unknown): Record<string, unknown> {
  const record = isRecord(payload) ? payload : {};
  if (hasOfferFields(record)) {
    return record;
  }

  const candidates = [
    record.data,
    record.result,
    record.response,
    record.offerDecision,
    record.offer_decision,
  ];

  for (const candidate of candidates) {
    if (isRecord(candidate) && hasOfferFields(candidate)) {
      return candidate;
    }
  }

  return record;
}

function hasOfferFields(value: Record<string, unknown>): boolean {
  return Boolean(
    value.offers ||
      value.selectedOffers ||
      value.selected_offers ||
      value.recommendations ||
      value.decisionTrace ||
      value.decision_trace ||
      value.reasonCodes ||
      value.reason_codes,
  );
}
