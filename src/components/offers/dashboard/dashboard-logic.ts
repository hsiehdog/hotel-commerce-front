import {
  ParsedOffersResponse,
} from "@/lib/offers-demo";
import { TimelineStep } from "./timeline-nav";
import {
  countObjectKeys,
} from "./utils";

export function buildTimelineSteps(
  parsedResponse: ParsedOffersResponse | null,
  requestPayload: Record<string, unknown> | null,
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
      count: topCandidates,
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
