import {
  ParsedOffersResponse,
} from "@/lib/offers-demo";
import { TimelineStep } from "./timeline-nav";
import {
  asRecord,
  firstNumber,
  toPercent,
  toString,
  countObjectKeys,
} from "./utils";

export function buildTimelineSteps(
  parsedResponse: ParsedOffersResponse | null,
  requestPayload: Record<string, unknown> | null,
  funnelStages: Array<{ count: number }>,
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
