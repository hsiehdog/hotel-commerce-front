
import {
  OffersDraft,
  ParsedOffersResponse,
  ParsedOfferCard,
} from "@/lib/offers-demo";
import { TimelineStep } from "./timeline-nav";
import {
  asRecord,
  firstNumber,
  inferLeadTimeDays,
  inferTripTypeFromDraft,
  toPercent,
  toString,
  countObjectKeys
} from "./utils";

export function buildTimelineSteps(
  parsedResponse: ParsedOffersResponse | null,
  requestPayload: Record<string, unknown> | null,
  funnelStages: any[], // FunnelStage[]
  selectionSummary: Record<string, unknown>,
): TimelineStep[] {
  const topCandidates = parsedResponse?.debug.topCandidates.length ?? 0;
  const offers = parsedResponse?.offers.length ?? 0;
  const hasSelection = Object.keys(selectionSummary).length > 0 || Boolean(parsedResponse?.decisionTrace);

  return [
    {
      id: "input",
      label: "Input",
      state: requestPayload ? "green" : "red",
      count: countObjectKeys(requestPayload),
    },
    {
      id: "property",
      label: "Context",
      state: parsedResponse?.propertyContext.propertyId ? "green" : "red",
      count: countObjectKeys(parsedResponse?.propertyContext ?? null),
    },
    {
      id: "profile",
      label: "Intent",
      state: parsedResponse?.debug.profileFinal ? "green" : "red",
      count: countObjectKeys(parsedResponse?.debug.profileFinal ?? null),
    },
    {
      id: "funnel",
      label: "Funnel",
      state: topCandidates > 0 ? "green" : parsedResponse ? "yellow" : "red",
      count: funnelStages.at(-1)?.count ?? topCandidates,
    },
    {
      id: "scoring", // mapped to same section as funnel/ranking
      label: "Ranking",
      state: topCandidates > 0 ? "green" : parsedResponse ? "yellow" : "red",
      count: topCandidates,
    },
    {
      id: "selection",
      label: "Selection",
      state: hasSelection ? "green" : parsedResponse ? "yellow" : "red",
      count: parsedResponse?.reasonCodes.length ?? 0,
    },
    {
      id: "final",
      label: "Offers",
      state: offers > 0 ? "green" : parsedResponse ? "yellow" : "red",
      count: offers,
    },
  ];
}

export function buildFunnelStages(parsedResponse: ParsedOffersResponse | null) {
  if (!parsedResponse) {
    return [];
  }

  const topCandidates = parsedResponse.debug.topCandidates;
  const fallbackIds = topCandidates
    .map((candidate) => toString(candidate.offerId ?? candidate.offer_id ?? candidate.candidateId ?? candidate.candidate_id))
    .filter(Boolean);

  const selectionSummary = asRecord(parsedResponse.debug.selectionSummary);
  const funnelSource = asRecord(
    selectionSummary.candidateFunnel ??
      selectionSummary.candidate_funnel ??
      parsedResponse.raw.candidateFunnel ??
      parsedResponse.raw.candidate_funnel,
  );

  const generated =
    firstNumber(
      funnelSource.generated,
      selectionSummary.generatedCandidates,
      selectionSummary.generated_candidates,
      parsedResponse.raw.generatedCandidates,
      parsedResponse.raw.generated_candidates,
    ) ?? topCandidates.length;

  const accessibilityRemoved = firstNumber(
    funnelSource.removedAccessibility,
    funnelSource.removed_accessibility,
    funnelSource.accessibility,
    selectionSummary.removedByAccessibility,
    selectionSummary.removed_by_accessibility,
  ) ?? 0;

  const occupancyRemoved = firstNumber(
    funnelSource.removedOccupancy,
    funnelSource.removed_occupancy,
    funnelSource.occupancy,
    selectionSummary.removedByOccupancy,
    selectionSummary.removed_by_occupancy,
  ) ?? 0;

  const restrictionsRemoved = firstNumber(
    funnelSource.removedRestrictions,
    funnelSource.removed_restrictions,
    funnelSource.restrictions,
    selectionSummary.removedByRestrictions,
    selectionSummary.removed_by_restrictions,
  ) ?? 0;

  const currencyRemoved = firstNumber(
    funnelSource.removedCurrency,
    funnelSource.removed_currency,
    funnelSource.currency,
    selectionSummary.removedByCurrency,
    selectionSummary.removed_by_currency,
  ) ?? 0;

  const missingPriceRemoved = firstNumber(
    funnelSource.removedMissingPrice,
    funnelSource.removed_missing_price,
    funnelSource.missingPrice,
    selectionSummary.removedByMissingPrice,
    selectionSummary.removed_by_missing_price,
  ) ?? 0;

  const remaining = Math.max(
    generated - accessibilityRemoved - occupancyRemoved - restrictionsRemoved - currencyRemoved - missingPriceRemoved,
    topCandidates.length,
  );

  const basisBucketCount =
    firstNumber(
      funnelSource.remainingByBasisBucket,
      funnelSource.remaining_by_basis_bucket,
      selectionSummary.remainingByBasisBucket,
      selectionSummary.remaining_by_basis_bucket,
    ) ?? remaining;

  const activeBasis = firstNumber(
    funnelSource.activeBasisSelected,
    funnelSource.active_basis_selected,
    selectionSummary.activeBasisSelected,
    selectionSummary.active_basis_selected,
  ) ?? topCandidates.length;

  return [
    {
      id: "generated",
      label: "Generated",
      count: generated,
      percentOfGenerated: toPercent(generated, generated),
      candidateIds: fallbackIds,
    },
    {
      id: "accessibility",
      label: "Removed by accessibility",
      count: accessibilityRemoved,
      percentOfGenerated: toPercent(accessibilityRemoved, generated),
      candidateIds: [],
    },
    {
      id: "occupancy",
      label: "Removed by occupancy",
      count: occupancyRemoved,
      percentOfGenerated: toPercent(occupancyRemoved, generated),
      candidateIds: [],
    },
    {
      id: "restrictions",
      label: "Removed by restrictions",
      count: restrictionsRemoved,
      percentOfGenerated: toPercent(restrictionsRemoved, generated),
      candidateIds: [],
    },
    {
      id: "currency",
      label: "Removed by currency",
      count: currencyRemoved,
      percentOfGenerated: toPercent(currencyRemoved, generated),
      candidateIds: [],
    },
    {
      id: "missing-price",
      label: "Removed by missing price",
      count: missingPriceRemoved,
      percentOfGenerated: toPercent(missingPriceRemoved, generated),
      candidateIds: [],
    },
    {
      id: "basis-bucket",
      label: "Remaining by basis bucket",
      count: basisBucketCount,
      percentOfGenerated: toPercent(basisBucketCount, generated),
      candidateIds: fallbackIds,
    },
    {
      id: "active-basis",
      label: "Active basis selected",
      count: activeBasis,
      percentOfGenerated: toPercent(activeBasis, generated),
      candidateIds: fallbackIds,
    },
  ];
}

export function buildWhyChips(
  profilePreAri: Record<string, unknown>,
  profileFinal: Record<string, unknown>,
  resolvedRequest: Record<string, unknown>,
  draft: OffersDraft,
): Array<{ label: string; reason: string }> {
  const chips: Array<{ label: string; reason: string }> = [];

  const leadTimeDays =
    firstNumber(
      profileFinal.leadTimeDays,
      profileFinal.lead_time_days,
      resolvedRequest.leadTimeDays,
      resolvedRequest.lead_time_days,
    ) ?? inferLeadTimeDays(draft.check_in);

  if (leadTimeDays !== null && leadTimeDays <= 1) {
    chips.push({ label: `leadTimeDays=${leadTimeDays} -> short-lead`, reason: "Short lead time" });
  }

  const tripType =
    toString(
      profilePreAri.tripType ??
        profilePreAri.trip_type ??
        profileFinal.tripType ??
        profileFinal.trip_type,
    ) || inferTripTypeFromDraft(draft);
  if (tripType.toLowerCase() === "family") {
    chips.push({ label: "tripType=family -> family enhancements eligible", reason: "Family trip profile" });
  }

  const roomsAvailable = firstNumber(
    profileFinal.roomsAvailable,
    profileFinal.rooms_available,
    resolvedRequest.roomsAvailable,
    resolvedRequest.rooms_available,
  );
  if (roomsAvailable !== null && roomsAvailable <= 2) {
    chips.push({ label: `roomsAvailable=${roomsAvailable} -> inventoryState=low`, reason: "Low inventory state" });
  }

  return chips;
}

export function buildTopReasonSummary(
  parsedResponse: ParsedOffersResponse | null,
  whyChips: Array<{ label: string; reason: string }>,
  selectionSummary: Record<string, unknown>,
  primaryOffer: ParsedOfferCard | null,
): { primary: string; secondary: string } {
  if (!parsedResponse) {
    return {
      primary: "Run a decision to see primary causality.",
      secondary: "Run a decision to see secondary fallback causality.",
    };
  }

  const reasons = parsedResponse.reasonCodes.map((item) => item.toUpperCase());
  const topChip = whyChips[0] ?? null;
  const primaryMode = toString(selectionSummary.primaryArchetype ?? selectionSummary.primary_archetype) || primaryOffer?.type || "PRIMARY";
  const primary = topChip
    ? `${topChip.label} -> ${primaryMode} primary`
    : reasons.find((code) => code.includes("SELECT_PRIMARY")) || "Primary selected based on ranking and guardrails.";

  const noOpposite = reasons.some((code) => code.includes("SECONDARY_POOL_EMPTY_OPPOSITE_ARCHETYPE"));
  const sameFallback = reasons.some((code) => code.includes("SAME_ARCHETYPE_FALLBACK"));
  const secondary = noOpposite || sameFallback
    ? "No opposite-archetype option eligible -> same-archetype fallback (alternate dates/text link/waitlist/contact property)"
    : reasons.find((code) => code.includes("SELECT_SECONDARY")) || "Secondary chosen as best available tradeoff option.";

  return { primary, secondary };
}

export function buildEffectiveConfigRows(
  parsedResponse: ParsedOffersResponse | null,
  requestPayload: Record<string, unknown> | null,
) {
  if (!parsedResponse) {
    return [];
  }

  const strategyMode = "balanced";
  const currency = parsedResponse.propertyContext.currency || parsedResponse.currency || "-";

  return [
    {
      label: "strategy_mode",
      value: strategyMode,
      source: "engine default",
      impact: "affects scoring weights",
    },
    {
      label: "currency",
      value: currency,
      source: requestPayload?.currency ? "request" : "property default",
      impact: "affects filtering",
    },
  ];
}

export function buildNotUsedInputs(
  requestPayload: Record<string, unknown> | null,
  reasonCodes: string[],
  decisionTrace: unknown,
): string[] {
  if (!requestPayload) {
    return [];
  }

  const reasons = reasonCodes.join(" ").toLowerCase();
  const trace = typeof decisionTrace === "string" ? decisionTrace.toLowerCase() : JSON.stringify(decisionTrace ?? {}).toLowerCase();
  const text = `${reasons} ${trace}`;
  const checks: Array<{ label: string; value: unknown; token: string }> = [
    { label: "pet_friendly", value: requestPayload.pet_friendly, token: "pet" },
    { label: "accessible_room", value: requestPayload.accessible_room, token: "accessible" },
    { label: "needs_two_beds", value: requestPayload.needs_two_beds, token: "two bed" },
    { label: "parking_needed", value: requestPayload.parking_needed, token: "parking" },
  ];

  return checks
    .filter((item) => {
      const present = item.value !== undefined && item.value !== null && item.value !== "";
      if (!present) {
        return false;
      }
      return !text.includes(item.token);
    })
    .map((item) => `${item.label}=${String(item.value)}`);
}
