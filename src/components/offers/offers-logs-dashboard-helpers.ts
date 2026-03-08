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

export function formatPrimaryOfferName(row: {
  primaryOfferName?: string | null;
  primaryOfferRoomTypeName?: string | null;
  primaryOfferRatePlanName?: string | null;
}): string {
  const direct = row.primaryOfferName?.trim();
  if (direct) {
    return direct;
  }

  const room = row.primaryOfferRoomTypeName?.trim();
  const rate = row.primaryOfferRatePlanName?.trim();
  const parts = [room, rate].filter(Boolean);
  return parts.length > 0 ? parts.join(" - ") : "-";
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

  const normalized = toRecordOrNull(detail.normalized) ?? {};
  const normalizedDebug = toRecordOrNull(normalized.rawDebugPayload);
  const normalizedCore = toRecordOrNull(normalized.rawCorePayload);
  const normalizedCoreDebug = toRecordOrNull(normalizedCore?.debug);
  const normalizedDebugNested = toRecordOrNull(normalizedDebug?.debug);
  const responseDebug = toRecordOrNull(responseData.debug);
  const data = {
    ...normalizedCore,
    ...responseData,
    property_id: firstDefined(
      responseData.property_id,
      normalizedCore?.property_id,
      normalizedDebug?.property_id,
      responseData.propertyId,
      detail.decision.propertyId,
      "-",
    ),
    propertyId: firstDefined(
      responseData.propertyId,
      responseData.property_id,
      normalizedCore?.propertyId,
      normalizedCore?.property_id,
      normalizedDebug?.propertyId,
      normalizedDebug?.property_id,
      detail.decision.propertyId,
      "-",
    ),
    channel: firstDefined(
      responseData.channel,
      normalizedCore?.channel,
      normalizedDebug?.channel,
      detail.decision.channel,
      "-",
    ),
    currency: firstDefined(
      responseData.currency,
      normalizedCore?.currency,
      normalizedDebug?.currency,
      detail.decision.currency,
      "USD",
    ),
    price_basis_used: firstDefined(
      responseData.price_basis_used,
      responseData.priceBasisUsed,
      normalizedCore?.price_basis_used,
      normalizedCore?.priceBasisUsed,
      detail.decision.priceBasisUsed,
      "-",
    ),
    priceBasisUsed: firstDefined(
      responseData.priceBasisUsed,
      responseData.price_basis_used,
      normalizedCore?.priceBasisUsed,
      normalizedCore?.price_basis_used,
      detail.decision.priceBasisUsed,
      "-",
    ),
    config_version: firstDefined(
      responseData.config_version,
      responseData.configVersion,
      normalizedCore?.config_version,
      normalizedCore?.configVersion,
      normalized.configVersion,
      "-",
    ),
    configVersion: firstDefined(
      responseData.configVersion,
      responseData.config_version,
      normalizedCore?.configVersion,
      normalizedCore?.config_version,
      normalized.configVersion,
      "-",
    ),
    persona_confidence: firstDefined(
      responseData.persona_confidence,
      normalizedDebug?.persona_confidence,
      normalizedDebugNested?.persona_confidence,
      normalizedCore?.persona_confidence,
      normalizedCoreDebug?.persona_confidence,
      null,
    ),
    debug: {
      ...(normalizedCoreDebug ?? {}),
      ...(normalizedDebug ?? {}),
      ...(normalizedDebugNested ?? {}),
      ...(responseDebug ?? {}),
      resolvedRequest: firstDefined(
        responseDebug?.resolvedRequest,
        responseDebug?.resolved_request,
        normalizedDebug?.resolvedRequest,
        normalizedDebug?.resolved_request,
        normalizedDebugNested?.resolvedRequest,
        normalizedDebugNested?.resolved_request,
        normalizedCoreDebug?.resolvedRequest,
        normalizedCoreDebug?.resolved_request,
        normalized.resolvedRequest,
        null,
      ),
      profilePreAri: firstDefined(
        responseDebug?.profilePreAri,
        responseDebug?.profile_pre_ari,
        normalizedDebug?.profilePreAri,
        normalizedDebug?.profile_pre_ari,
        normalizedDebugNested?.profilePreAri,
        normalizedDebugNested?.profile_pre_ari,
        normalizedCoreDebug?.profilePreAri,
        normalizedCoreDebug?.profile_pre_ari,
        null,
      ),
      profileFinal: firstDefined(
        responseDebug?.profileFinal,
        responseDebug?.profile_final,
        normalizedDebug?.profileFinal,
        normalizedDebug?.profile_final,
        normalizedDebugNested?.profileFinal,
        normalizedDebugNested?.profile_final,
        normalizedCoreDebug?.profileFinal,
        normalizedCoreDebug?.profile_final,
        null,
      ),
      scoring: firstDefined(
        responseDebug?.scoring,
        normalizedDebug?.scoring,
        normalizedDebugNested?.scoring,
        normalizedCoreDebug?.scoring,
        null,
      ),
      selectionSummary: firstDefined(
        responseDebug?.selectionSummary,
        responseDebug?.selection_summary,
        normalizedDebug?.selectionSummary,
        normalizedDebug?.selection_summary,
        normalizedDebugNested?.selectionSummary,
        normalizedDebugNested?.selection_summary,
        normalizedCoreDebug?.selectionSummary,
        normalizedCoreDebug?.selection_summary,
        normalized.selectionSummary,
        null,
      ),
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

  const title = formatPrimaryOfferName(row);
  if (!title || title === "-") {
    return null;
  }

  const total = row.primaryOfferTotal ?? row.primaryOfferTotalPrice ?? null;
  const roomType = row.primaryOfferRoomTypeName?.trim() || row.primaryOfferName?.trim() || title;
  const roomTypeId = row.primaryOfferRoomTypeName?.trim() || roomType;
  const ratePlan = row.primaryOfferRatePlanName?.trim() || "-";

  return {
    roomType,
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
    "upgrade_ladder",
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
