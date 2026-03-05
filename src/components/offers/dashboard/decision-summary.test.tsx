import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DecisionSummary } from "./decision-summary";
import type { FallbackGuidance, RecommendedRoom, RecommendedUpsell } from "@/lib/offers-demo";

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

const fallback: FallbackGuidance = {
  type: "suggest_alternate_dates",
  reason: "No eligible room remained.",
  suggestions: [],
};

describe("DecisionSummary", () => {
  it("renders recommendation and upsells", () => {
    render(<DecisionSummary recommendedRoom={room} recommendedOffers={upsells} fallback={null} />);

    expect(screen.getAllByText("Recommended Room").length).toBeGreaterThan(0);
    expect(screen.getByText("Recommended Upsells")).toBeTruthy();
    expect(screen.getByText("Breakfast package")).toBeTruthy();
    expect(screen.getByText("Attach probability high")).toBeTruthy();
  });

  it("renders fallback branch when recommendation is null", () => {
    render(<DecisionSummary recommendedRoom={null} recommendedOffers={[]} fallback={fallback} />);

    expect(screen.getByText("No Recommendation")).toBeTruthy();
    expect(screen.getByText("No eligible room remained.")).toBeTruthy();
    expect(screen.getByText("suggest_alternate_dates")).toBeTruthy();
  });
});
