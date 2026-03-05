import { OffersLogsDetailResponse, OffersLogsListRow } from "@/lib/api-client";
import { ParsedOffersResponse, RecommendedRoom, parseOffersResponse } from "@/lib/offers-demo";

export type BasicOfferDetails = {
  checkIn?: string | null;
  checkOut?: string | null;
  rooms?: number | null;
  adults?: number | null;
  children?: number | null;
};

export function formatPrimaryOfferTotal(amount?: number | null): string {
  if (amount === null || amount === undefined) {
    return "-";
  }

  return formatCurrency(amount);
}

export function formatPropertyLabel(label: string): string {
  return label
    .replace(/[_-]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function formatBasicOfferDetails(details: BasicOfferDetails): string {
  const dateRange = formatStayDateRange(details.checkIn, details.checkOut);
  const rooms = details.rooms ?? 0;
  const adults = details.adults ?? 0;
  const children = details.children ?? 0;
  return `${dateRange} | ${rooms} room${rooms === 1 ? "" : "s"} | ${adults}A/${children}C`;
}

export function toRecordOrNull(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

export function mapDetailToParsedOffersResponse(
  detail: OffersLogsDetailResponse,
): ParsedOffersResponse | null {
  const responseData = extractOffersPayloadRecord(detail.generateResponse);
  if (!responseData) {
    return null;
  }

  const responseDebug = toRecordOrNull(responseData.debug);
  const data = {
    ...responseData,
    property_id: firstDefined(
      responseData.property_id,
      responseData.propertyId,
      detail.decision.propertyId,
      "-",
    ),
    propertyId: firstDefined(
      responseData.propertyId,
      responseData.property_id,
      detail.decision.propertyId,
      "-",
    ),
    channel: firstDefined(responseData.channel, detail.decision.channel, "-"),
    currency: firstDefined(responseData.currency, detail.decision.currency, "USD"),
    price_basis_used: firstDefined(
      responseData.price_basis_used,
      responseData.priceBasisUsed,
      detail.decision.priceBasisUsed,
      "-",
    ),
    priceBasisUsed: firstDefined(
      responseData.priceBasisUsed,
      responseData.price_basis_used,
      detail.decision.priceBasisUsed,
      "-",
    ),
    config_version: firstDefined(responseData.config_version, responseData.configVersion, "-"),
    configVersion: firstDefined(responseData.configVersion, responseData.config_version, "-"),
    debug: {
      ...(responseDebug ?? {}),
      topPersona: firstDefined(
        responseDebug?.topPersona,
        responseDebug?.top_persona,
        detail.decision.topPersona,
        null,
      ),
      reasonCodes: firstDefined(
        responseDebug?.reasonCodes,
        responseDebug?.reason_codes,
        detail.decision.reasonCodes,
        [],
      ),
    },
  };

  const parsed = parseOffersResponse({ data });

  return {
    ...parsed,
    propertyId: parsed.propertyId === "-" ? detail.decision.propertyId : parsed.propertyId,
    channel: parsed.channel === "-" ? detail.decision.channel || "-" : parsed.channel,
    currency: parsed.currency === "-" ? detail.decision.currency || "USD" : parsed.currency,
    raw: {
      ...parsed.raw,
      decision: detail.decision,
      events: detail.events,
      normalized: detail.normalized,
      generateResponse: detail.generateResponse,
    },
  };
}

export function buildRoomFallbackFromRow(
  row: OffersLogsListRow | undefined,
): RecommendedRoom | null {
  if (!row) {
    return null;
  }

  const title = row.primaryOfferName?.trim();
  if (!title) {
    return null;
  }

  const total = row.primaryOfferTotal ?? row.primaryOfferTotalPrice ?? null;
  const roomTypeId = row.primaryOfferRoomTypeName?.trim() || title;
  const ratePlan = row.primaryOfferRatePlanName?.trim() || "-";

  return {
    roomType: title,
    ratePlan,
    nightlyPrice: null,
    totalPrice: total,
    pricingBreakdown: {
      subtotal: null,
      taxesAndFees: null,
      includedFees: [],
    },
    score: null,
    reasons: [],
    policySummary: "-",
    inventoryNote: "",
    roomTypeId,
    ratePlanId: ratePlan === "-" ? "" : ratePlan,
  };
}

function formatCurrency(amount?: number | null): string {
  if (amount === null || amount === undefined) {
    return "-";
  }

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

function formatMonthDayYear(date: Date): string {
  const month = new Intl.DateTimeFormat("en-US", { month: "short" }).format(date);
  return `${month} ${date.getDate()}, ${date.getFullYear()}`;
}

function formatStayDateRange(checkIn?: string | null, checkOut?: string | null): string {
  if (!checkIn || !checkOut) {
    return "-";
  }

  const start = new Date(checkIn);
  const end = new Date(checkOut);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "-";
  }

  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();
  const sameDay = sameMonth && start.getDate() === end.getDate();
  const startMonth = new Intl.DateTimeFormat("en-US", { month: "short" }).format(start);
  const endMonth = new Intl.DateTimeFormat("en-US", { month: "short" }).format(end);

  if (sameDay) {
    return formatMonthDayYear(start);
  }

  if (sameMonth) {
    return `${startMonth} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`;
  }

  if (sameYear) {
    return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${start.getFullYear()}`;
  }

  return `${formatMonthDayYear(start)} - ${formatMonthDayYear(end)}`;
}

function firstDefined<T>(...values: Array<T | null | undefined>): T | undefined {
  for (const value of values) {
    if (value !== undefined && value !== null) {
      return value;
    }
  }
  return undefined;
}

function isOffersPayloadRecord(value: unknown): value is Record<string, unknown> {
  const record = toRecordOrNull(value);
  if (!record) {
    return false;
  }

  return [
    "recommended_room",
    "recommended_offers",
    "ranked_rooms",
    "persona_confidence",
    "price_basis_used",
    "config_version",
  ].some((key) => key in record);
}

function extractOffersPayloadRecord(value: unknown): Record<string, unknown> | null {
  const record = toRecordOrNull(value);
  if (!record) {
    return null;
  }

  return isOffersPayloadRecord(record) ? record : toRecordOrNull(record["data"]);
}
