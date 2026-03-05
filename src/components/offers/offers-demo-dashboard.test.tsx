import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OffersDemoDashboard } from "@/components/offers/offers-demo-dashboard";
import * as offersDemo from "@/lib/offers-demo";

vi.mock("@/lib/offers-demo", async () => {
  const actual = await vi.importActual<typeof import("@/lib/offers-demo")>(
    "@/lib/offers-demo",
  );

  return {
    ...actual,
    requestOfferGeneration: vi.fn(),
  };
});

const mockedRequestOfferGeneration = vi.mocked(offersDemo.requestOfferGeneration);

describe("OffersDemoDashboard", () => {
  beforeEach(() => {
    mockedRequestOfferGeneration.mockReset();
  });

  it("keeps advanced controls hidden in Basic mode and shows them in Advanced mode", async () => {
    const user = userEvent.setup();

    render(<OffersDemoDashboard />);

    expect(screen.queryByLabelText("Demo scenario")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Adv" }));

    expect(screen.getByLabelText("Demo scenario")).toBeTruthy();
  });

  it("renders single recommended room and upsells", async () => {
    const user = userEvent.setup();

    mockedRequestOfferGeneration.mockResolvedValue({
      data: {
        propertyId: "hotel-9",
        channel: "web",
        currency: "USD",
        priceBasisUsed: "afterTax",
        configVersion: 1,
        recommended_room: {
          room_type: "Family Suite",
          rate_plan: "Flexible Rate",
          nightly_price: 329,
          total_price: 987,
          score: 0.8731,
          reasons: ["Strong fit"],
          policy_summary: "Refundable rate.",
          inventory_note: "Only 2 left",
          room_type_id: "rt_family_suite",
          rate_plan_id: "rp_flex",
        },
        recommended_offers: [
          {
            bundle_type: "breakfast",
            label: "Breakfast package",
            score: 0.71,
            reasons: ["Attach probability high"],
            estimated_price_delta: 18,
          },
        ],
        ranked_rooms: [
          {
            room_type_id: "rt_family_suite",
            room_type_name: "Family Suite",
            rate_plan_id: "rp_flex",
            price: 987,
            score: 0.8731,
            component_scores: { fit: 0.95 },
            reasons: ["Strong fit"],
          },
        ],
        fallback: null,
      },
    });

    render(<OffersDemoDashboard />);

    await user.type(screen.getByLabelText("Check-in"), "2026-03-10");
    await user.type(screen.getByLabelText("Check-out"), "2026-03-12");
    await user.click(screen.getByRole("button", { name: "Run Decision" }));

    await waitFor(() => {
      expect(screen.getAllByText("Recommended Room").length).toBeGreaterThan(0);
    });

    expect(screen.getByText("Family Suite | Flexible Rate")).toBeTruthy();
    expect(screen.getByText("Recommended Upsells")).toBeTruthy();
    expect(screen.getByText("Attach probability high")).toBeTruthy();
    expect(screen.getByText("Room Ranking")).toBeTruthy();
  });

  it("renders fallback UI when recommendation is null", async () => {
    const user = userEvent.setup();

    mockedRequestOfferGeneration.mockResolvedValue({
      data: {
        recommended_room: null,
        recommended_offers: [],
        ranked_rooms: [],
        fallback: {
          type: "suggest_alternate_dates",
          reason: "No eligible room remained. Try nearby dates.",
          suggestions: [],
        },
      },
    });

    render(<OffersDemoDashboard />);

    await user.type(screen.getByLabelText("Check-in"), "2026-03-10");
    await user.type(screen.getByLabelText("Check-out"), "2026-03-12");
    await user.click(screen.getByRole("button", { name: "Run Decision" }));

    await waitFor(() => {
      expect(screen.getByText("No Recommendation")).toBeTruthy();
    });

    expect(screen.getByText("No eligible room remained. Try nearby dates.")).toBeTruthy();
  });
});
