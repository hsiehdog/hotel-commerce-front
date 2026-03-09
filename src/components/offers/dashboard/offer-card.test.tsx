import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DecisionOfferCard } from "./offer-card";
import type { RecommendedRoom } from "@/lib/offers-demo";

const offer: RecommendedRoom = {
  roomType: "Family Suite",
  ratePlan: "Flexible Rate",
  nightlyPrice: 329,
  totalPrice: 987,
  pricingBreakdown: {
    subtotal: 750,
    taxesAndFees: 87,
    includedFees: [
      { label: "Pet Fee ($25/night)", amount: 50 },
      { label: "Early Check In Fee", amount: 35 },
      { label: "Parking Fee Total", amount: 0 },
    ],
  },
  score: 0.8731,
  reasons: ["Strong fit"],
  policySummary: "Refundable",
  inventoryNote: "Only 2 left",
  roomTypeId: "rt_family_suite",
  ratePlanId: "rp_flex",
};

describe("DecisionOfferCard", () => {
  it("renders full recommended room details", () => {
    render(<DecisionOfferCard title="Recommended Room" offer={offer} />);

    expect(screen.getByText("Family Suite | Flexible Rate")).toBeTruthy();
    expect(screen.getByText("$987")).toBeTruthy();
    expect(screen.getByText("Subtotal")).toBeTruthy();
    expect(screen.getByText("Taxes & fees")).toBeTruthy();
    expect(screen.getByText("Pet Fee ($25/night)")).toBeTruthy();
    expect(screen.getByText("Early Check In Fee")).toBeTruthy();
    expect(screen.queryByText("Early Check In Fee ($35/night)")).toBeNull();
    expect(screen.queryByText("Parking Fee Total")).toBeNull();
    expect(screen.queryByText("Nightly price")).toBeNull();
    expect(screen.queryByText("Add-ons (est.)")).toBeNull();
    expect(screen.queryByText("Score")).toBeNull();
    expect(screen.getByText("Strong fit")).toBeTruthy();
    expect(screen.getByText("Only 2 left")).toBeTruthy();
  });

  it("renders empty state when offer is null", () => {
    render(<DecisionOfferCard title="Recommended Room" offer={null} />);
    expect(screen.getByText("No recommendation returned.")).toBeTruthy();
  });
});
