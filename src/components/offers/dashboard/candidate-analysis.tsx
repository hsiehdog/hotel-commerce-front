"use client";

import { Dispatch, SetStateAction, Fragment } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ParsedOffersResponse, ParsedOfferCard } from "@/lib/offers-demo";
import {
  cn,
  toString,
  toNumber,
  firstNumber,
  asRecord,
  formatMoney,
  scoreCell,
  toStringArray,
  safeStringify
} from "./utils";

interface CandidateAnalysisProps {
  displayedCandidates: Array<Record<string, unknown>>;
  scoringWeights: Record<string, unknown>;
  expandedCandidate: string | null;
  setExpandedCandidate: Dispatch<SetStateAction<string | null>>;
  parsedResponse: ParsedOffersResponse;
}

export function CandidateAnalysis({
  displayedCandidates,
  scoringWeights,
  expandedCandidate,
  setExpandedCandidate,
  parsedResponse,
}: CandidateAnalysisProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Offer Ranking</CardTitle>
          <CardDescription>Candidate-level components and final score substitution.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-muted/50">
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Candidate</th>
                  <th className="px-3 py-2 font-medium">Room / Plan / Archetype / Price</th>
                  <th className="px-3 py-2 font-medium">Drivers</th>
                  <th className="px-3 py-2 font-medium text-right">Final Score</th>
                </tr>
              </thead>
              <tbody>
                {displayedCandidates.map((candidate, index) => {
                  const rawCandidateId = toString(candidate.offerId ?? candidate.offer_id) || `candidate-${index + 1}`;
                  const candidateId = rawCandidateId.replace(/^candidate-/i, "");
                  const rowId = `${rawCandidateId}-${index}`;
                  const scoring = getScoringModel(candidate, scoringWeights);
                  const selected = isSelectedCandidate(candidate, parsedResponse);
                  const matchedOffer = findOfferForCandidate(candidate, parsedResponse.offers);
                  const drivers = buildCandidateDrivers(candidate, matchedOffer);

                  return (
                    <Fragment key={rowId}>
                      <tr
                        className={cn(
                          "border-b transition-colors hover:bg-muted/30",
                          selected && "bg-emerald-50 dark:bg-emerald-950/30"
                        )}
                      >
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() =>
                                setExpandedCandidate((prev) => (prev === rowId ? null : rowId))
                              }
                            >
                              {expandedCandidate === rowId ? "▼" : "▶"}
                            </Button>
                            <span className="font-mono text-xs">{candidateId}</span>
                            {selected && <Badge className="h-5 px-1.5 text-[10px]">Sel</Badge>}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-xs">
                          <div className="flex flex-col">
                            <span>
                                {toString(candidate.roomTypeName ?? candidate.roomType ?? candidate.room_type)}
                            </span>
                             <span className="text-muted-foreground">
                                {toString(candidate.ratePlanName ?? candidate.ratePlan ?? candidate.rate_plan)}
                             </span>
                             <div className="flex gap-2 text-[10px] text-muted-foreground">
                                <span>{toString(candidate.archetype ?? candidate.offerType ?? candidate.type) || "-"}</span>
                                <span>•</span>
                                <span>{formatMoney(toNumber(candidate.total ?? candidate.totalPrice ?? candidate.price))}</span>
                             </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {drivers.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                                {drivers.map(d => <Badge key={d} variant="outline" className="h-5 px-1 text-[10px] font-normal">{d}</Badge>)}
                            </div>
                          ) : "-"}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-foreground">{scoreCell(scoring.finalScore)}</td>
                      </tr>
                      {expandedCandidate === rowId && (
                        <tr className="bg-muted/10">
                          <td className="px-3 py-3" colSpan={4}>
                            <div className="rounded-md border bg-background p-4 shadow-sm">
                              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Score Calculation</p>
                              <div className="mb-4 rounded bg-muted/30 p-2 font-mono text-xs">
                                {scoring.formula}
                              </div>
                              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Raw Components</p>
                              <pre className="max-h-40 overflow-auto rounded border bg-muted/10 p-2 font-mono text-[10px]">
                                {safeStringify(candidate.scoreComponents ?? candidate.scoringComponents ?? candidate.components ?? null)}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
                {displayedCandidates.length === 0 && (
                  <tr>
                    <td className="px-3 py-8 text-center text-muted-foreground" colSpan={4}>
                      No candidates found for this stage.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// --- Helpers ---

function getScoringModel(candidate: Record<string, unknown>, scoringWeights: Record<string, unknown>) {
  const components = asRecord(candidate.scoreComponents ?? candidate.scoringComponents ?? candidate.components);
  const weights = asRecord(scoringWeights);

  const value = firstNumber(components.value, components.valueScore, components.value_score) ?? 0;
  const conversion = firstNumber(components.conversion, components.conversionScore, components.conversion_score) ?? 0;
  const experience = firstNumber(components.experience, components.experienceScore, components.experience_score) ?? 0;
  const margin =
    firstNumber(
      components.margin,
      components.marginScore,
      components.margin_score,
      components.marginProxyScore,
      components.margin_proxy_score,
    ) ?? 0;
  const risk =
    firstNumber(
      components.risk,
      components.riskPenalty,
      components.risk_penalty,
      components.riskScore,
      components.risk_score,
    ) ?? 0;

  const valueW = firstNumber(weights.value, weights.valueWeight, weights.value_weight);
  const conversionW = firstNumber(weights.conversion, weights.conversionWeight, weights.conversion_weight);
  const experienceW = firstNumber(weights.experience, weights.experienceWeight, weights.experience_weight);
  const marginW = firstNumber(weights.margin, weights.marginWeight, weights.margin_weight);
  const riskW = firstNumber(weights.risk, weights.riskWeight, weights.risk_weight);

  const directFinal = firstNumber(candidate.score, candidate.totalScore, candidate.scoreTotal);
  if (
    valueW === null ||
    conversionW === null ||
    experienceW === null ||
    marginW === null ||
    riskW === null
  ) {
    return {
      value,
      conversion,
      experience,
      margin,
      risk,
      finalScore: directFinal ?? null,
      formula: "Weights missing in debug.scoring.weights",
    };
  }

  const computed = value * valueW + conversion * conversionW + experience * experienceW + margin * marginW - risk * riskW;
  const finalScore = directFinal ?? Number(computed.toFixed(2));
  const formula = `${scoreCell(finalScore)} = ${value.toFixed(2)}*${valueW.toFixed(2)} + ${conversion.toFixed(2)}*${conversionW.toFixed(2)} + ${experience.toFixed(2)}*${experienceW.toFixed(2)} + ${margin.toFixed(2)}*${marginW.toFixed(2)} - ${risk.toFixed(2)}*${riskW.toFixed(2)}`;

  return {
    value,
    conversion,
    experience,
    margin,
    risk,
    finalScore,
    formula,
  };
}

function findOfferForCandidate(
  candidate: Record<string, unknown>,
  offers: ParsedOfferCard[],
): ParsedOfferCard | null {
  const byOfferId = toString(candidate.offerId ?? candidate.offer_id);
  if (byOfferId) {
    const matched = offers.find((offer) => offer.offerId === byOfferId);
    if (matched) {
      return matched;
    }
  }

  const roomTypeId = toString(candidate.roomTypeId ?? candidate.room_type_id).toLowerCase();
  const ratePlanId = toString(candidate.ratePlanId ?? candidate.rate_plan_id).toLowerCase();

  return (
    offers.find((offer) => {
      const offerRoomType = toString(
        (offer.raw.roomType as { id?: string } | undefined)?.id ?? offer.raw.room_type_id,
      ).toLowerCase();
      const offerRatePlan = toString(
        (offer.raw.ratePlan as { id?: string } | undefined)?.id ?? offer.raw.rate_plan_id,
      ).toLowerCase();
      return roomTypeId && ratePlanId && roomTypeId === offerRoomType && ratePlanId === offerRatePlan;
    }) ?? null
  );
}

function buildCandidateDrivers(
  candidate: Record<string, unknown>,
  matchedOffer: ParsedOfferCard | null,
): string[] {
  const drivers: string[] = [];
  const riskContributors = toStringArray(
    candidate.riskContributors ?? candidate.risk_contributors ?? candidate.risks ?? [],
  );

  if (matchedOffer?.cancellationSummary.toLowerCase().includes("refund")) {
    drivers.push("+ refundable");
  }
  if (matchedOffer?.paymentSummary.toLowerCase().includes("property")) {
    drivers.push("+ pay at property");
  }
  if (riskContributors.some((item) => item.toLowerCase().includes("low_inventory"))) {
    drivers.push("- low inventory");
  }

  return drivers;
}

function isSelectedCandidate(
  candidate: Record<string, unknown>,
  parsedResponse: ParsedOffersResponse,
): boolean {
  const recommendedOffer = parsedResponse.offers.find((offer) => offer.recommended);
  if (!recommendedOffer) {
    return false;
  }

  const candidateOfferId = toString(candidate.offerId ?? candidate.offer_id);
  if (candidateOfferId && candidateOfferId === recommendedOffer.offerId) {
    return true;
  }

  const candidateRoomTypeId = toString(candidate.roomTypeId ?? candidate.room_type_id);
  const candidateRatePlanId = toString(candidate.ratePlanId ?? candidate.rate_plan_id);
  const offerRoomTypeId = toString(
    (recommendedOffer.raw.roomType as { id?: string } | undefined)?.id ??
      recommendedOffer.raw.room_type_id,
  );
  const offerRatePlanId = toString(
    (recommendedOffer.raw.ratePlan as { id?: string } | undefined)?.id ??
      recommendedOffer.raw.rate_plan_id,
  );

  return Boolean(
    candidateRoomTypeId &&
      candidateRatePlanId &&
      offerRoomTypeId &&
      offerRatePlanId &&
      candidateRoomTypeId === offerRoomTypeId &&
      candidateRatePlanId === offerRatePlanId,
  );
}
