"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  OffersLogsDetailResponse,
  AuditOutboxState,
  fetchOffersLogDetail,
  fetchOffersLogs,
  fetchProperties,
} from "@/lib/api-client";
import {
  buildDeltaLine,
  getPrimaryOffer,
  getSecondaryOffer,
  groupReasonCodes,
  parseOffersResponse,
} from "@/lib/offers-demo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { asRecord } from "./dashboard/utils";
import { buildEffectiveConfigRows } from "./dashboard/dashboard-logic";
import { DecisionSummary } from "./dashboard/decision-summary";
import { GuestProfile } from "./dashboard/guest-profile";
import { CandidateAnalysis } from "./dashboard/candidate-analysis";
import { DebugPanel } from "./dashboard/debug-panel";

const DEFAULT_PROPERTY_ID = "demo_property";
const ALL_TIME_FROM_ISO = "1970-01-01T00:00:00.000Z";
const ALL_TIME_TO_ISO = "9999-12-31T23:59:59.999Z";

function formatDateTime(value?: string | null): string {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString();
}

function formatDateTimeWithoutSeconds(value?: string | null): string {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString(undefined, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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

function getOutboxBadgeVariant(state?: AuditOutboxState | null): "outline" | "secondary" | "destructive" {
  if (state === "DLQ") {
    return "destructive";
  }
  if (state === "PROCESSED") {
    return "secondary";
  }
  return "outline";
}

function getPrimaryOfferNameFromRow(row: {
  primaryOfferRoomTypeName?: string | null;
  primaryOfferRatePlanName?: string | null;
}) {
  const parts = [
    row.primaryOfferRoomTypeName,
    row.primaryOfferRatePlanName,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" - ") : "-";
}

function formatPrimaryOfferTotal(amount?: number | null): string {
  if (amount === null || amount === undefined) {
    return "-";
  }

  return formatCurrency(amount);
}

function formatPropertyLabel(label: string): string {
  return label
    .replace(/[_-]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

type BasicOfferDetails = {
  checkIn?: string | null;
  checkOut?: string | null;
  rooms?: number | null;
  adults?: number | null;
  children?: number | null;
};

function toRecordOrNull(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function toRecord(value: unknown): Record<string, unknown> {
  return toRecordOrNull(value) ?? {};
}

function pickFirstDefined(...values: unknown[]): unknown {
  for (const value of values) {
    if (value !== undefined && value !== null) {
      return value;
    }
  }
  return null;
}

function pickFirstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return null;
}

function buildProfileFallback(
  detail: OffersLogsDetailResponse,
  generateResponseData: Record<string, unknown>,
  generatedDebug: Record<string, unknown>,
  corePayload: Record<string, unknown>,
): Record<string, unknown> {
  const coreProfile = asRecord(corePayload.profile);
  const requestContext = asRecord(corePayload.requestContext);
  const profile = asRecord(generateResponseData.profile);
  const profileFinal = asRecord(generateResponseData.profileFinal);
  const profilePreAri = asRecord(generateResponseData.profilePreAri);
  const fallback: Record<string, unknown> = {};
  const tripType = pickFirstString(
    generatedDebug.tripType,
    generatedDebug.trip_type,
    coreProfile.tripType,
    coreProfile.trip_type,
    profile.tripType,
    profile.trip_type,
    profileFinal.tripType,
    profileFinal.trip_type,
    profilePreAri.tripType,
    profilePreAri.trip_type,
    generateResponseData.tripType,
    generateResponseData.trip_type,
  );
  const decisionPosture = pickFirstString(
    generatedDebug.decisionPosture,
    generatedDebug.decision_posture,
    coreProfile.decisionPosture,
    coreProfile.decision_posture,
    profile.decisionPosture,
    profile.decision_posture,
    profileFinal.decisionPosture,
    profileFinal.decision_posture,
    profilePreAri.decisionPosture,
    profilePreAri.decision_posture,
    generateResponseData.decisionPosture,
    generateResponseData.decision_posture,
  );

  if (tripType) {
    fallback.tripType = tripType;
  }
  if (decisionPosture) {
    fallback.decisionPosture = decisionPosture;
  }
  if (!tripType) {
    const children = Number(
      pickFirstDefined(
        requestContext.children,
        detail.decision.children,
        0,
      ),
    );
    const adults = Number(
      pickFirstDefined(
        requestContext.adults,
        detail.decision.adults,
        0,
      ),
    );
    if (children > 0) {
      fallback.tripType = "family";
    } else if (adults <= 1) {
      fallback.tripType = "solo";
    } else if (adults >= 2) {
      fallback.tripType = "couple";
    }
  }
  return fallback;
}

function mergeProfileWithFallback(
  source: unknown,
  fallback: Record<string, unknown>,
): Record<string, unknown> {
  const merged = { ...asRecord(source) };
  const currentTripType = pickFirstString(merged.tripType, merged.trip_type);
  const fallbackTripType = pickFirstString(fallback.tripType, fallback.trip_type);
  const currentPosture = pickFirstString(merged.decisionPosture, merged.decision_posture);
  const fallbackPosture = pickFirstString(fallback.decisionPosture, fallback.decision_posture);

  if ((!currentTripType || currentTripType.toLowerCase() === "unknown") && fallbackTripType) {
    merged.tripType = fallbackTripType;
  }
  if ((!currentPosture || currentPosture.toLowerCase() === "unknown") && fallbackPosture) {
    merged.decisionPosture = fallbackPosture;
  }

  return merged;
}

function normalizeId(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function humanizeCandidateId(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) {
    return "";
  }
  const normalized = value
    .trim()
    .replace(/^rt_/i, "")
    .replace(/^rp_/i, "")
    .replace(/_/g, " ")
    .toLowerCase();

  return normalized
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      if (word === "acc") {
        return "Accessible";
      }
      if (word === "qn") {
        return "Queen";
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

function enrichTopCandidatesWithNames(
  candidates: Array<Record<string, unknown>>,
  offers: Array<{ offerId: string; room: string; ratePlan: string; raw: Record<string, unknown> }>,
): Array<Record<string, unknown>> {
  const byOfferId = new Map<string, { room: string; ratePlan: string }>();
  const byRoomRate = new Map<string, { room: string; ratePlan: string }>();

  for (const offer of offers) {
    const offerIdKey = normalizeId(offer.offerId);
    const roomTypeId = normalizeId((offer.raw.roomType as { id?: string } | undefined)?.id ?? offer.raw.room_type_id);
    const ratePlanId = normalizeId((offer.raw.ratePlan as { id?: string } | undefined)?.id ?? offer.raw.rate_plan_id);
    const names = { room: offer.room, ratePlan: offer.ratePlan };
    if (offerIdKey) {
      byOfferId.set(offerIdKey, names);
    }
    if (roomTypeId && ratePlanId) {
      byRoomRate.set(`${roomTypeId}:${ratePlanId}`, names);
    }
  }

  return candidates.map((candidate) => {
    const existingRoom = pickFirstString(candidate.roomTypeName, candidate.roomType, candidate.room_type);
    const existingRate = pickFirstString(candidate.ratePlanName, candidate.ratePlan, candidate.rate_plan);
    if (existingRoom && existingRate) {
      return candidate;
    }

    const offerIdKey = normalizeId(candidate.offerId ?? candidate.offer_id);
    const roomTypeIdKey = normalizeId(candidate.roomTypeId ?? candidate.room_type_id);
    const ratePlanIdKey = normalizeId(candidate.ratePlanId ?? candidate.rate_plan_id);
    const fromOfferId = offerIdKey ? byOfferId.get(offerIdKey) : undefined;
    const fromRoomRate =
      !fromOfferId && roomTypeIdKey && ratePlanIdKey
        ? byRoomRate.get(`${roomTypeIdKey}:${ratePlanIdKey}`)
        : undefined;
    const match = fromOfferId ?? fromRoomRate;
    if (!match) {
      const derivedRoom = humanizeCandidateId(candidate.roomTypeId ?? candidate.room_type_id);
      const derivedRate = humanizeCandidateId(candidate.ratePlanId ?? candidate.rate_plan_id);
      if (!derivedRoom && !derivedRate) {
        return candidate;
      }
      return {
        ...candidate,
        roomTypeName: existingRoom ?? derivedRoom,
        ratePlanName: existingRate ?? derivedRate,
      };
    }

    return {
      ...candidate,
      roomTypeName: existingRoom ?? match.room,
      ratePlanName: existingRate ?? match.ratePlan,
    };
  });
}

function toFiniteNumber(value: unknown): number | null {
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

function solveLinearSystem(matrix: number[][], vector: number[]): number[] | null {
  const n = matrix.length;
  const a = matrix.map((row, i) => [...row, vector[i]]);
  for (let col = 0; col < n; col += 1) {
    let pivot = col;
    for (let row = col + 1; row < n; row += 1) {
      if (Math.abs(a[row][col]) > Math.abs(a[pivot][col])) {
        pivot = row;
      }
    }
    if (Math.abs(a[pivot][col]) < 1e-9) {
      return null;
    }
    if (pivot !== col) {
      [a[col], a[pivot]] = [a[pivot], a[col]];
    }
    const pivotValue = a[col][col];
    for (let j = col; j <= n; j += 1) {
      a[col][j] /= pivotValue;
    }
    for (let row = 0; row < n; row += 1) {
      if (row === col) {
        continue;
      }
      const factor = a[row][col];
      for (let j = col; j <= n; j += 1) {
        a[row][j] -= factor * a[col][j];
      }
    }
  }
  return a.map((row) => row[n]);
}

function inferScoringWeightsFromCandidates(candidates: Array<Record<string, unknown>>): Record<string, number> | null {
  const rows: Array<{ x: number[]; y: number }> = [];
  for (const candidate of candidates) {
    const components = asRecord(candidate.components ?? candidate.scoreComponents ?? candidate.scoringComponents);
    const value = toFiniteNumber(components.valueScore ?? components.value_score ?? components.value);
    const conversion = toFiniteNumber(components.conversionScore ?? components.conversion_score ?? components.conversion);
    const experience = toFiniteNumber(components.experienceScore ?? components.experience_score ?? components.experience);
    const margin = toFiniteNumber(
      components.marginProxyScore ??
      components.margin_proxy_score ??
      components.marginScore ??
      components.margin_score ??
      components.margin,
    );
    const risk = toFiniteNumber(components.riskScore ?? components.risk_score ?? components.riskPenalty ?? components.risk_penalty ?? components.risk);
    const score = toFiniteNumber(candidate.scoreTotal ?? candidate.totalScore ?? candidate.score);
    if (
      value === null ||
      conversion === null ||
      experience === null ||
      margin === null ||
      risk === null ||
      score === null
    ) {
      continue;
    }
    rows.push({ x: [value, conversion, experience, margin, -risk], y: score });
  }
  if (rows.length < 5) {
    return null;
  }

  const size = 5;
  const ata = Array.from({ length: size }, () => Array.from({ length: size }, () => 0));
  const atb = Array.from({ length: size }, () => 0);
  for (const row of rows) {
    for (let i = 0; i < size; i += 1) {
      atb[i] += row.x[i] * row.y;
      for (let j = 0; j < size; j += 1) {
        ata[i][j] += row.x[i] * row.x[j];
      }
    }
  }
  const solution = solveLinearSystem(ata, atb);
  if (!solution) {
    return null;
  }
  const [value, conversion, experience, margin, risk] = solution;
  if ([value, conversion, experience, margin, risk].some((entry) => !Number.isFinite(entry))) {
    return null;
  }

  return { value, conversion, experience, margin, risk };
}

function mapDetailToParsedOffersResponse(detail: OffersLogsDetailResponse) {
  const generateResponseData = toRecord((toRecordOrNull(detail.generateResponse) ?? {}).data);
  const corePayload = toRecord(detail.normalized.rawCorePayload);
  const debugPayload = toRecord(detail.normalized.rawDebugPayload);
  const generatedDebug = toRecord(generateResponseData.debug);
  const strategyPayload = asRecord(corePayload.strategy);
  const strategyWeights = toRecordOrNull(
    pickFirstDefined(
      strategyPayload.weights,
      strategyPayload.scoringWeights,
      strategyPayload.scoring_weights,
      strategyPayload.weightVector,
      strategyPayload.weight_vector,
    ),
  );
  const coreDebug = toRecord(corePayload.debug);
  const nestedDebug = toRecord(debugPayload.debug);

  const mergedDebug: Record<string, unknown> = {
    ...generatedDebug,
    ...coreDebug,
    ...nestedDebug,
    ...debugPayload,
    resolvedRequest: pickFirstDefined(
      generatedDebug.resolvedRequest,
      generatedDebug.resolved_request,
      coreDebug.resolvedRequest,
      coreDebug.resolved_request,
      nestedDebug.resolvedRequest,
      nestedDebug.resolved_request,
      debugPayload.resolvedRequest,
      debugPayload.resolved_request,
      detail.normalized.resolvedRequest,
    ),
    profilePreAri: pickFirstDefined(
      generatedDebug.profilePreAri,
      generatedDebug.profile_pre_ari,
      coreDebug.profilePreAri,
      coreDebug.profile_pre_ari,
      nestedDebug.profilePreAri,
      nestedDebug.profile_pre_ari,
      debugPayload.profilePreAri,
      debugPayload.profile_pre_ari,
    ),
    profileFinal: pickFirstDefined(
      generatedDebug.profileFinal,
      generatedDebug.profile_final,
      coreDebug.profileFinal,
      coreDebug.profile_final,
      nestedDebug.profileFinal,
      nestedDebug.profile_final,
      debugPayload.profileFinal,
      debugPayload.profile_final,
    ),
    scoring: pickFirstDefined(
      generatedDebug.scoring,
      generateResponseData.scoring,
      toRecordOrNull(generateResponseData.weights) ? { weights: generateResponseData.weights } : null,
      toRecordOrNull(generateResponseData.scoringWeights) ? { weights: generateResponseData.scoringWeights } : null,
      toRecordOrNull(generatedDebug.weights) ? { weights: generatedDebug.weights } : null,
      strategyWeights ? { weights: strategyWeights } : null,
      coreDebug.scoring,
      nestedDebug.scoring,
      debugPayload.scoring,
    ),
    selectionSummary: pickFirstDefined(
      generatedDebug.selectionSummary,
      generatedDebug.selection_summary,
      coreDebug.selectionSummary,
      coreDebug.selection_summary,
      nestedDebug.selectionSummary,
      nestedDebug.selection_summary,
      debugPayload.selectionSummary,
      debugPayload.selection_summary,
      detail.normalized.selectionSummary,
    ),
    topCandidates: pickFirstDefined(
      generatedDebug.topCandidates,
      generatedDebug.top_candidates,
      coreDebug.topCandidates,
      coreDebug.top_candidates,
      nestedDebug.topCandidates,
      nestedDebug.top_candidates,
      debugPayload.topCandidates,
      debugPayload.top_candidates,
      detail.normalized.topCandidates,
    ),
  };

  const parseInput = {
    ...corePayload,
    ...generateResponseData,
    propertyId: pickFirstString(
      generateResponseData.propertyId,
      generateResponseData.property_id,
      corePayload.propertyId,
      corePayload.property_id,
      detail.decision.propertyId,
    ),
    channel: pickFirstString(generateResponseData.channel, corePayload.channel, detail.decision.channel) ?? "-",
    currency: pickFirstString(
      generateResponseData.currency,
      corePayload.currency,
      detail.decision.currency,
      detail.normalized.presentedOffers[0]?.currency,
      "USD",
    ),
    priceBasisUsed: pickFirstString(
      generateResponseData.priceBasisUsed,
      generateResponseData.price_basis_used,
      corePayload.priceBasisUsed,
      corePayload.price_basis_used,
      detail.decision.priceBasisUsed,
      detail.normalized.presentedOffers[0]?.basis,
      "afterTax",
    ),
    configVersion: pickFirstDefined(
      generateResponseData.configVersion,
      generateResponseData.config_version,
      corePayload.configVersion,
      corePayload.config_version,
      detail.normalized.configVersion,
      detail.events[0]?.configVersion,
      "-",
    ),
    offers: pickFirstDefined(
      generateResponseData.offers,
      generateResponseData.selectedOffers,
      generateResponseData.selected_offers,
      generateResponseData.recommendations,
      corePayload.offers,
      corePayload.selectedOffers,
      corePayload.selected_offers,
      corePayload.recommendations,
      detail.normalized.presentedOffers,
    ),
    reasonCodes: pickFirstDefined(
      generateResponseData.reasonCodes,
      generateResponseData.reason_codes,
      corePayload.reasonCodes,
      corePayload.reason_codes,
      detail.normalized.globalReasonCodes,
    ),
    debug: mergedDebug,
  };

  const parsed = parseOffersResponse({ data: parseInput });
  const profileFallback = buildProfileFallback(detail, generateResponseData, generatedDebug, corePayload);
  const enrichedTopCandidates = enrichTopCandidatesWithNames(parsed.debug.topCandidates, parsed.offers);
  const inferredWeights = inferScoringWeightsFromCandidates(enrichedTopCandidates);
  const parsedScoring = asRecord(parsed.debug.scoring);
  const parsedWeights = asRecord(parsedScoring.weights);
  const mergedScoring = {
    ...parsedScoring,
    weights: Object.keys(parsedWeights).length > 0
      ? parsedWeights
      : (inferredWeights ?? parsedWeights),
  };
  return {
    ...parsed,
    propertyId: parsed.propertyId === "-" ? detail.decision.propertyId : parsed.propertyId,
    channel: parsed.channel === "-" ? (detail.decision.channel || "-") : parsed.channel,
    currency: parsed.currency === "-" ? (detail.decision.currency || "USD") : parsed.currency,
    priceBasisUsed:
      parsed.priceBasisUsed === "-"
        ? pickFirstString(detail.decision.priceBasisUsed, detail.normalized.presentedOffers[0]?.basis, "afterTax") ?? "afterTax"
        : parsed.priceBasisUsed,
    configVersion:
      parsed.configVersion === "-"
        ? String(detail.normalized.configVersion ?? detail.events[0]?.configVersion ?? "-")
        : parsed.configVersion,
    reasonCodes: parsed.reasonCodes.length > 0 ? parsed.reasonCodes : detail.normalized.globalReasonCodes,
    debug: {
      ...parsed.debug,
      resolvedRequest: parsed.debug.resolvedRequest ?? detail.normalized.resolvedRequest ?? null,
      selectionSummary: parsed.debug.selectionSummary ?? detail.normalized.selectionSummary ?? null,
      profilePreAri: mergeProfileWithFallback(parsed.debug.profilePreAri, profileFallback),
      profileFinal: mergeProfileWithFallback(parsed.debug.profileFinal, profileFallback),
      scoring: mergedScoring,
      topCandidates:
        enrichedTopCandidates.length > 0
          ? enrichedTopCandidates
          : (detail.normalized.topCandidates ?? []).map((candidate) => ({ ...candidate })),
    },
    raw: {
      ...parsed.raw,
      decision: detail.decision,
      events: detail.events,
      normalized: detail.normalized,
    },
  };
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

function formatBasicOfferDetails(details: BasicOfferDetails): string {
  const dateRange = formatStayDateRange(details.checkIn, details.checkOut);
  const rooms = details.rooms ?? 0;
  const adults = details.adults ?? 0;
  const children = details.children ?? 0;
  return `${dateRange} | ${rooms} room${rooms === 1 ? "" : "s"} | ${adults}A/${children}C`;
}

export function OffersLogsDashboard() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [propertyId, setPropertyId] = useState(() => searchParams.get("propertyId") ?? DEFAULT_PROPERTY_ID);
  const [selectedDecisionId, setSelectedDecisionId] = useState(
    () => searchParams.get("selectedDecisionId") ?? "",
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [expandedCandidate, setExpandedCandidate] = useState<string | null>(null);

  const propertiesQuery = useQuery({
    queryKey: ["offer-log-properties"],
    queryFn: () => fetchProperties({ activeOnly: true }),
  });

  const propertyOptions = useMemo(() => {
    const apiProperties = propertiesQuery.data ?? [];
    const filtered = apiProperties.filter((property) => property.propertyId !== DEFAULT_PROPERTY_ID);
    return [{ propertyId: DEFAULT_PROPERTY_ID, name: DEFAULT_PROPERTY_ID }, ...filtered];
  }, [propertiesQuery.data]);

  const listQuery = useInfiniteQuery({
    queryKey: ["offer-logs", propertyId],
    queryFn: ({ pageParam }) =>
      fetchOffersLogs({
        propertyId,
        from: ALL_TIME_FROM_ISO,
        to: ALL_TIME_TO_ISO,
        cursor: pageParam as string | undefined,
        limit: 25,
      }),
    enabled: Boolean(propertyId),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.pageInfo.hasMore ? lastPage.pageInfo.nextCursor : undefined),
  });

  const rows = useMemo(
    () => listQuery.data?.pages.flatMap((page) => page.rows) ?? [],
    [listQuery.data?.pages],
  );

  const detailQuery = useQuery({
    queryKey: ["offer-log-detail", selectedDecisionId],
    queryFn: () => fetchOffersLogDetail(selectedDecisionId, { includeRawPayloads: true, payloadCapKb: 512 }),
    enabled: Boolean(selectedDecisionId),
  });

  useEffect(() => {
    const params = new URLSearchParams();
    if (propertyId) {
      params.set("propertyId", propertyId);
    }
    if (selectedDecisionId) {
      params.set("selectedDecisionId", selectedDecisionId);
    }

    const next = params.toString();
    const current = searchParams.toString();
    if (next !== current) {
      router.replace(`${pathname}?${next}`, { scroll: false });
    }
  }, [pathname, propertyId, router, searchParams, selectedDecisionId]);

  function openDetail(decisionId: string) {
    setSelectedDecisionId(decisionId);
    setIsDrawerOpen(true);
    setExpandedCandidate(null);
  }
  const parsedDetailResponse = useMemo(
    () => (detailQuery.data ? mapDetailToParsedOffersResponse(detailQuery.data) : null),
    [detailQuery.data],
  );
  const primaryOffer = parsedDetailResponse ? getPrimaryOffer(parsedDetailResponse.offers) : null;
  const secondaryOffer = parsedDetailResponse ? getSecondaryOffer(parsedDetailResponse.offers) : null;
  const deltaLine = buildDeltaLine(primaryOffer, secondaryOffer);
  const reasonGroups = groupReasonCodes(parsedDetailResponse?.reasonCodes ?? []);
  const allCandidates = parsedDetailResponse?.debug.topCandidates ?? [];
  const requestPayload = toRecordOrNull(parsedDetailResponse?.debug.resolvedRequest ?? null);
  const effectiveConfigRows = buildEffectiveConfigRows(parsedDetailResponse, requestPayload);
  const profilePreAri = useMemo(() => asRecord(parsedDetailResponse?.debug.profilePreAri), [parsedDetailResponse]);
  const profileFinal = useMemo(() => asRecord(parsedDetailResponse?.debug.profileFinal), [parsedDetailResponse]);
  const scoringWeights = useMemo(
    () => asRecord(asRecord(parsedDetailResponse?.debug.scoring).weights),
    [parsedDetailResponse],
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Offer Logs</CardTitle>
          <CardDescription>Table-first operations log of offer decisions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1 pr-2">
              <label htmlFor="propertyId" className="text-sm font-medium">Property</label>
              <select
                id="propertyId"
                value={propertyId}
                onChange={(event) => {
                  setPropertyId(event.target.value);
                  setSelectedDecisionId("");
                  setIsDrawerOpen(false);
                  setExpandedCandidate(null);
                }}
                className="block h-9 min-w-[260px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
              >
                {propertyOptions.map((property) => (
                  <option key={property.propertyId} value={property.propertyId}>
                    {formatPropertyLabel(property.name || property.propertyId)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Decision Log</CardTitle>
          <CardDescription>
            Server now: {listQuery.data?.pages[0]?.serverNow ? formatDateTime(listQuery.data.pages[0].serverNow) : "-"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!propertyId ? (
            <p className="text-sm text-muted-foreground">Select a property to load logs.</p>
          ) : listQuery.isPending ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : listQuery.isError ? (
            <p className="text-sm text-destructive">{(listQuery.error as Error).message}</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No rows for current property/time window.</p>
          ) : (
            <>
              <div className="overflow-x-hidden">
                <table className="w-full table-fixed text-left text-sm">
                  <colgroup>
                    <col className="w-[14%]" />
                    <col className="w-[8%]" />
                    <col className="w-[14%]" />
                    <col className="w-[22%]" />
                    <col className="w-[14%]" />
                    <col className="w-[14%]" />
                    <col className="w-[14%]" />
                  </colgroup>
                  <thead className="text-xs uppercase tracking-wide text-muted-foreground">
                    <tr className="border-b">
                      <th className="px-2 py-2">Recorded At</th>
                      <th className="px-2 py-2">Channel</th>
                      <th className="px-2 py-2">Property</th>
                      <th className="px-2 py-2">Basic Offer Details</th>
                      <th className="px-2 py-2">Created Outbox</th>
                      <th className="px-2 py-2">Primary Offer Name</th>
                      <th className="px-2 py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      const resolvedBasic: BasicOfferDetails = {
                        checkIn: row.checkIn ?? null,
                        checkOut: row.checkOut ?? null,
                        rooms: row.rooms ?? null,
                        adults: row.adults ?? null,
                        children: row.children ?? null,
                      };
                      const primaryName = row.primaryOfferName ?? getPrimaryOfferNameFromRow(row);
                      const primaryTotal = row.primaryOfferTotal ?? row.primaryOfferTotalPrice ?? null;
                      const createdOutboxState = row.createdOutbox?.state ?? row.createdEventOutboxState;
                      return (
                      <tr
                        key={row.decisionId}
                        className={cn(
                          "cursor-pointer border-b align-top transition hover:bg-muted/50",
                          selectedDecisionId === row.decisionId ? "bg-muted/40" : "",
                        )}
                        onClick={() => openDetail(row.decisionId)}
                      >
                        <td className="px-2 py-3">{formatDateTimeWithoutSeconds(row.recordedAt ?? row.eventRecordedAt)}</td>
                        <td className="px-2 py-3">{row.channel || "-"}</td>
                        <td className="px-2 py-3">{formatPropertyLabel(row.property || row.propertyId || "-")}</td>
                        <td className="px-2 py-3 break-words">{formatBasicOfferDetails(resolvedBasic)}</td>
                        <td className="px-2 py-3">
                          {createdOutboxState ? (
                            <Badge variant={getOutboxBadgeVariant(createdOutboxState)}>{createdOutboxState}</Badge>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-2 py-3">{primaryName || "-"}</td>
                        <td className="px-2 py-3">
                          {formatPrimaryOfferTotal(primaryTotal)}
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {listQuery.hasNextPage ? (
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => listQuery.fetchNextPage()}
                    disabled={listQuery.isFetchingNextPage}
                  >
                    {listQuery.isFetchingNextPage ? "Loading..." : "Load more"}
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      {isDrawerOpen ? (
        <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setIsDrawerOpen(false)}>
          <aside
            className="absolute right-0 top-0 h-full w-full max-w-3xl bg-background shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <h2 className="text-base font-semibold">Decision Detail</h2>
                <Button type="button" variant="outline" size="sm" onClick={() => setIsDrawerOpen(false)}>
                  Close
                </Button>
              </div>

              <ScrollArea className="h-[calc(100vh-58px)] px-4 py-4">
                {detailQuery.isPending ? (
                  <div className="space-y-3">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : detailQuery.isError || !detailQuery.data ? (
                  <p className="text-sm text-destructive">{(detailQuery.error as Error)?.message ?? "Failed to load detail."}</p>
                ) : (
                  <div className="space-y-5 pb-8">
                    {parsedDetailResponse ? (
                      <>
                        <div id="selection" className="scroll-mt-24">
                          <DecisionSummary
                            primaryOffer={primaryOffer}
                            secondaryOffer={secondaryOffer}
                            deltaLine={deltaLine}
                          />
                        </div>

                        <div id="profile" className="scroll-mt-24">
                          <GuestProfile
                            scoringWeights={scoringWeights}
                            profileFinal={profileFinal}
                            profilePreAri={profilePreAri}
                          />
                        </div>

                        <div id="funnel" className="scroll-mt-24">
                          <CandidateAnalysis
                            displayedCandidates={allCandidates}
                            scoringWeights={scoringWeights}
                            expandedCandidate={expandedCandidate}
                            setExpandedCandidate={setExpandedCandidate}
                            parsedResponse={parsedDetailResponse}
                          />
                        </div>

                        <div id="debug" className="scroll-mt-24">
                          <DebugPanel
                            parsedResponse={parsedDetailResponse}
                            requestPayload={requestPayload}
                            rawResponse={parsedDetailResponse.raw}
                            allCandidates={allCandidates}
                            effectiveConfigRows={effectiveConfigRows}
                            reasonGroups={reasonGroups}
                          />
                        </div>
                      </>
                    ) : null}
                  </div>
                )}
              </ScrollArea>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
