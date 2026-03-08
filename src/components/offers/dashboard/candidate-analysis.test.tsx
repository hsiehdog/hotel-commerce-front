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
    personaConfidence: {},
    recommendedRoom: {
      roomType: "Accessible King Room",
      ratePlan: "Flexible",
      nightlyPrice: 140,
      totalPrice: 283.36,
      pricingBreakdown: {
        subtotal: 250,
        taxesAndFees: 33.36,
        includedFees: [],
      },
      score: 0.91,
      reasons: ["Best fit"],
      policySummary: "Refundable",
      inventoryNote: "Only 2 left",
      roomTypeId: "rt_king",
      ratePlanId: "rp_flex",
    },
    recommendedOffers: [],
    rankedRooms: [
      {
        roomTypeId: "rt_king",
        roomTypeName: "Accessible King Room",
        ratePlanId: "rp_flex",
        price: 283.36,
        score: 0.91,
        componentScores: {
          fit: 0.95,
          value: 0.72,
        },
        reasons: ["Strong fit"],
      },
    ],
    fallback: null,
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
    },
    raw: {},
  };
}

describe("CandidateAnalysis", () => {
  it("renders ranked rooms and marks the recommended selection", () => {
    render(
      <CandidateAnalysis
        expandedCandidate={null}
        setExpandedCandidate={vi.fn()}
        parsedResponse={buildParsedResponse()}
      />,
    );

    expect(screen.getByText("Room Ranking")).toBeTruthy();
    expect(screen.getByText("Accessible King Room")).toBeTruthy();
    expect(screen.getByText("Sel")).toBeTruthy();
    expect(screen.getByText("Strong fit")).toBeTruthy();
    expect(screen.getByText("0.91")).toBeTruthy();
  });

  it("shows the full score when requested", () => {
    const parsed = buildParsedResponse();
    parsed.rankedRooms = [
      {
        ...parsed.rankedRooms[0],
        score: 0.8731,
      },
    ];

    render(
      <CandidateAnalysis
        expandedCandidate={null}
        setExpandedCandidate={vi.fn()}
        parsedResponse={parsed}
        showFullScore
      />,
    );

    expect(screen.getByText("0.8731")).toBeTruthy();
  });

  it("shows empty state when ranked rooms are empty", () => {
    const parsed = buildParsedResponse();
    parsed.rankedRooms = [];

    render(
      <CandidateAnalysis
        expandedCandidate={null}
        setExpandedCandidate={vi.fn()}
        parsedResponse={parsed}
      />,
    );

    expect(screen.getByText("No ranked rooms returned for this request.")).toBeTruthy();
  });

  it("humanizes ids and falls back to recommended room reasons for the selected row", () => {
    const parsed = buildParsedResponse();
    parsed.rankedRooms = [
      {
        roomTypeId: "rt_premier_suite",
        roomTypeName: "RT_PREMIER_SUITE",
        ratePlanId: "rp_paynow",
        price: 406.56,
        score: 0.91,
        componentScores: {
          fit: 0.95,
        },
        reasons: [],
      },
    ];
    parsed.recommendedRoom = {
      ...parsed.recommendedRoom!,
      roomTypeId: "rt_premier_suite",
      ratePlanId: "rp_paynow",
      reasons: ["Limited remaining inventory at this rate"],
    };

    render(
      <CandidateAnalysis
        expandedCandidate={null}
        setExpandedCandidate={vi.fn()}
        parsedResponse={parsed}
      />,
    );

    expect(screen.getByText("Premier Suite")).toBeTruthy();
    expect(screen.getByText("Pay Now")).toBeTruthy();
    expect(screen.getByText("Limited remaining inventory at this rate")).toBeTruthy();
  });

  it("formats raw coded room names like RT_KING into human-readable labels", () => {
    const parsed = buildParsedResponse();
    parsed.rankedRooms = [
      {
        roomTypeId: "RT_KING",
        roomTypeName: "RT_KING",
        ratePlanId: "RP_PAYNOW",
        price: 213.14,
        score: 0.71,
        componentScores: {},
        reasons: [],
      },
    ];
    parsed.recommendedRoom = {
      ...parsed.recommendedRoom!,
      roomTypeId: "RT_KING",
      ratePlanId: "RP_PAYNOW",
      reasons: ["Good relative value for this search"],
    };

    render(
      <CandidateAnalysis
        expandedCandidate={null}
        setExpandedCandidate={vi.fn()}
        parsedResponse={parsed}
      />,
    );

    expect(screen.getByText("King Room")).toBeTruthy();
    expect(screen.getByText("Pay Now")).toBeTruthy();
    expect(screen.getByText("Good relative value for this search")).toBeTruthy();
  });
});
