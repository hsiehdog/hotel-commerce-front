import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ChatOffersList } from "./chat-offers-list";
import type { ChatOffer } from "@/lib/api-client";

const offer: ChatOffer = {
  id: "offer-1",
  name: "Family Suite",
  description: "Flexible Rate | Only 2 left",
  rate_type: "flexible",
  rate_label: "Flexible Rate",
  cancellation_policy: "Refundable",
  payment_policy: "Pay at property",
  enhancements: [],
  disclosures: [],
  fee_breakdown: [],
  price: {
    currency: "USD",
    per_night: 329,
    subtotal: 987,
    taxes_and_fees: 0,
    total: 987,
  },
};

describe("ChatOffersList", () => {
  it("renders the recommended offer card", () => {
    render(<ChatOffersList offers={[offer]} />);

    expect(screen.getByText("Recommended Room")).toBeTruthy();
    expect(screen.getByText("Family Suite")).toBeTruthy();
    expect(screen.getByText("Total: $987.00")).toBeTruthy();
  });

  it("renders nothing when offers are empty", () => {
    const { container } = render(<ChatOffersList offers={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
