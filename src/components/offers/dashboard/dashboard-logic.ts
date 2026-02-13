import {
  ParsedOffersResponse,
} from "@/lib/offers-demo";

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
