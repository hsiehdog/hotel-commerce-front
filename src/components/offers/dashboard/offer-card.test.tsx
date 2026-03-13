import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DecisionOfferCard } from "./offer-card";
import type { RecommendedRoom } from "@/lib/offers-demo";

const offer: RecommendedRoom = {
  roomType: "Family Suite",
  roomDescription: "A larger suite with a separate living area for families.",
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

    const subtotal = screen.getByText("Subtotal");
    const taxesAndFees = screen.getByText("Taxes & fees");
    const addOn = screen.getByText("Pet Fee ($25/night)");
    const secondAddOn = screen.getByText("Early Check In Fee");
    const totalPrice = screen.getByText("Total Price");

    expect(screen.getByText("Family Suite | Flexible Rate")).toBeTruthy();
    expect(screen.getByText("Per night")).toBeTruthy();
    expect(screen.getByText("$329")).toBeTruthy();
    expect(screen.getByText("$987")).toBeTruthy();
    expect(subtotal.compareDocumentPosition(taxesAndFees) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(taxesAndFees.compareDocumentPosition(addOn) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(addOn.compareDocumentPosition(secondAddOn) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(secondAddOn.compareDocumentPosition(totalPrice) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByText("Early Check In Fee ($35/night)")).toBeNull();
    expect(screen.queryByText("Parking Fee Total")).toBeNull();
    expect(screen.queryByText("Add-ons (est.)")).toBeNull();
    expect(screen.queryByText("Score")).toBeNull();
    expect(screen.getByText("A larger suite with a separate living area for families.")).toBeTruthy();
    expect(screen.getByText("Strong fit")).toBeTruthy();
    expect(screen.getByText("Only 2 left")).toBeTruthy();
  });

  it("renders empty state when offer is null", () => {
    render(<DecisionOfferCard title="Recommended Room" offer={null} />);
    expect(screen.getByText("No recommendation returned.")).toBeTruthy();
  });
});
