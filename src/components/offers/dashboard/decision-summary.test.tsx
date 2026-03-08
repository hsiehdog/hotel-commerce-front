import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DecisionSummary } from "./decision-summary";
import type {
  FallbackGuidance,
  RecommendedRoom,
  RecommendedUpsell,
  UpgradeLadderEntry,
} from "@/lib/offers-demo";

const room: RecommendedRoom = {
  roomType: "Family Suite",
  ratePlan: "Flexible Rate",
  nightlyPrice: 329,
  totalPrice: 987,
  pricingBreakdown: {
    subtotal: 750,
    taxesAndFees: 87,
    includedFees: [],
  },
  score: 0.8731,
  reasons: ["Strong fit"],
  policySummary: "Refundable",
  inventoryNote: "Only 2 left",
  roomTypeId: "rt_family_suite",
  ratePlanId: "rp_flex",
};

const upsells: RecommendedUpsell[] = [
  {
    bundleType: "breakfast",
    label: "Breakfast package",
    score: 0.71,
    reasons: ["Attach probability high"],
    estimatedPriceDelta: 18,
  },
];

const upgradeLadder: UpgradeLadderEntry[] = [
  {
    roomTypeId: "rt_bunk_suite",
    roomType: "Bunk Suite",
    ratePlanId: "rp_suite_standard",
    ratePlan: "Standard Rate - Suites",
    totalPrice: 598,
    nightlyPrice: 299,
    priceDeltaTotal: 140,
    priceDeltaPerNight: 70,
    upgradeLevel: "next_step",
    reasons: ["Only $70 more per night than your current option"],
    benefitSummary: ["Suite-level upgrade with more living space"],
    ladderScore: 0.74,
  },
];

const fallback: FallbackGuidance = {
  type: "suggest_alternate_dates",
  reason: "No eligible room remained.",
  suggestions: [],
};

describe("DecisionSummary", () => {
  it("renders recommendation, upgrade ladder, and upsells", () => {
    render(
      <DecisionSummary
        recommendedRoom={room}
        upgradeLadder={upgradeLadder}
        recommendedOffers={upsells}
        fallback={null}
      />,
    );

    expect(screen.getAllByText("Recommended Room").length).toBeGreaterThan(0);
    expect(screen.getByText("Upgrade Ladder")).toBeTruthy();
    expect(screen.getByText("Bunk Suite | Standard Rate - Suites")).toBeTruthy();
    expect(screen.getByText("Only $70 more per night than your current option")).toBeTruthy();
    expect(screen.getByText("Recommended Upsells")).toBeTruthy();
    expect(screen.getByText("Breakfast package")).toBeTruthy();
    expect(screen.getByText("Attach probability high")).toBeTruthy();
  });

  it("renders fallback branch when recommendation is null", () => {
    render(
      <DecisionSummary
        recommendedRoom={null}
        upgradeLadder={[]}
        recommendedOffers={[]}
        fallback={fallback}
      />,
    );

    expect(screen.getByText("No Recommendation")).toBeTruthy();
    expect(screen.getByText("No eligible room remained.")).toBeTruthy();
    expect(screen.getByText("suggest_alternate_dates")).toBeTruthy();
  });
});
