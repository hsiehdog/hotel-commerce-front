import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ChatOffersList } from "./chat-offers-list";
import type { RecommendedRoom } from "@/lib/offers-demo";

const recommendedRoom: RecommendedRoom = {
  roomType: "Family Suite",
  ratePlan: "Flexible Rate",
  nightlyPrice: 329,
  totalPrice: 987,
  pricingBreakdown: {
    subtotal: 900,
    taxesAndFees: 87,
    includedFees: [],
  },
  score: 0.87,
  reasons: ["Strong fit"],
  policySummary: "Refundable",
  inventoryNote: "Only 2 left",
  roomTypeId: "rt_family_suite",
  ratePlanId: "rp_flex",
};

describe("ChatOffersList", () => {
  it("renders the recommended offer card", () => {
    render(<ChatOffersList recommendedRoom={recommendedRoom} />);

    expect(screen.getByText("Recommended Room")).toBeTruthy();
    expect(screen.getByText("Family Suite | Flexible Rate")).toBeTruthy();
    expect(screen.getByText("$987.00")).toBeTruthy();
    expect(screen.getByText("Why this room")).toBeTruthy();
  });

  it("renders nothing when offers are empty", () => {
    const { container } = render(<ChatOffersList recommendedRoom={null} />);
    expect(container.firstChild).toBeNull();
  });
});
