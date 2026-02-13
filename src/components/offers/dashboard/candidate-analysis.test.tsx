import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CandidateAnalysis } from "./candidate-analysis";
import type { ParsedOffersResponse } from "@/lib/offers-demo";

function buildParsedResponse(): ParsedOffersResponse {
  return {
    propertyId: "demo_property",
    channel: "web",
    currency: "USD",
    priceBasisUsed: "afterTax",
    configVersion: "1",
    offers: [],
    decisionTrace: null,
    reasonCodes: [],
    propertyContext: {
      propertyId: "demo_property",
      currency: "USD",
      strategyMode: "balanced",
      timezone: "America/Los_Angeles",
      policies: [],
      capabilities: [],
    },
    debug: {
      resolvedRequest: null,
      profilePreAri: null,
      profileFinal: null,
      scoring: null,
      selectionSummary: null,
      topCandidates: [],
    },
    raw: {},
  };
}

describe("CandidateAnalysis", () => {
  it("hides component columns in main ranking table and strips candidate prefix", () => {
    render(
      <CandidateAnalysis
        funnelStages={[]}
        selectedFunnelStage="active-basis"
        setSelectedFunnelStage={vi.fn()}
        displayedCandidates={[
          {
            offerId: "candidate-alpha",
            roomTypeName: "Accessible King Room",
            ratePlanName: "Flexible",
            archetype: "SAFE",
            totalPrice: 283.36,
            components: {
              valueScore: 37.95,
              conversionScore: 85,
              experienceScore: 20,
              marginProxyScore: 62.05,
              riskScore: 15,
            },
          },
        ]}
        scoringWeights={{ value: 0.7816, conversion: 0.1954, experience: 0.023, margin: 0, risk: 0.13 }}
        expandedCandidate={null}
        setExpandedCandidate={vi.fn()}
        parsedResponse={buildParsedResponse()}
      />,
    );

    expect(screen.queryByRole("columnheader", { name: "Value" })).toBeNull();
    expect(screen.queryByRole("columnheader", { name: "Conv" })).toBeNull();
    expect(screen.queryByRole("columnheader", { name: "Exp" })).toBeNull();
    expect(screen.queryByRole("columnheader", { name: "Margin" })).toBeNull();
    expect(screen.queryByRole("columnheader", { name: "Risk" })).toBeNull();

    expect(screen.queryByText("candidate-alpha")).toBeNull();
    expect(screen.getByText("alpha")).toBeTruthy();
  });

  it("uses passed scoring weights in formula and shows missing-weight message without defaults", () => {
    const candidate = {
      offerId: "candidate-beta",
      roomTypeName: "Accessible King Room",
      ratePlanName: "Flexible",
      archetype: "SAFE",
      totalPrice: 283.36,
      components: {
        valueScore: 100,
        conversionScore: 25,
        experienceScore: 20,
        marginProxyScore: 0,
        riskScore: 60,
      },
    };

    const { rerender } = render(
      <CandidateAnalysis
        funnelStages={[]}
        selectedFunnelStage="active-basis"
        setSelectedFunnelStage={vi.fn()}
        displayedCandidates={[candidate]}
        scoringWeights={{ value: 0.7816, conversion: 0.1954, experience: 0.023, margin: 0, risk: 0.13 }}
        expandedCandidate="candidate-beta-0"
        setExpandedCandidate={vi.fn()}
        parsedResponse={buildParsedResponse()}
      />,
    );

    expect(screen.getByText(/100\.00\*0\.78/)).toBeTruthy();
    expect(screen.queryByText("Weights missing in debug.scoring.weights")).toBeNull();

    rerender(
      <CandidateAnalysis
        funnelStages={[]}
        selectedFunnelStage="active-basis"
        setSelectedFunnelStage={vi.fn()}
        displayedCandidates={[candidate]}
        scoringWeights={{}}
        expandedCandidate="candidate-beta-0"
        setExpandedCandidate={vi.fn()}
        parsedResponse={buildParsedResponse()}
      />,
    );

    expect(screen.getByText("Weights missing in debug.scoring.weights")).toBeTruthy();
  });
});
