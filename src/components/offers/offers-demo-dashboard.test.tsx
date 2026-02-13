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

  it("renders single-screen decision audit trail when response includes debug payload", async () => {
    const user = userEvent.setup();

    mockedRequestOfferGeneration.mockResolvedValue({
      property_id: "hotel-9",
      channel: "web",
      currency: "USD",
      price_basis_used: "LOS",
      config_version: "v1",
      strategy_mode: "balanced",
      timezone: "America/New_York",
      policies: ["ID required"],
      reason_codes: ["filter_inventory", "selection_margin_priority", "fallback_waitlist"],
      decisionTrace: ["inventory filter", "margin rank", "recommended offer selected"],
      offers: [
        {
          offer_id: "offer-safe",
          recommended: true,
          room_type: "Deluxe King",
          rate_plan: "flex",
          pricing: { total: 350, paymentType: "pay_now" },
          cancellationPolicy: { refundable: true },
        },
        {
          offer_id: "offer-saver",
          recommended: false,
          room_type: "Standard",
          rate_plan: "prepay",
          pricing: { total: 300, paymentType: "pay_at_property" },
          cancellationPolicy: { refundable: false },
        },
      ],
      debug: {
        selectionSummary: {
          selectedOfferId: "offer-safe",
        },
        scoring: {
          weights: {
            value: 0.3,
            conversion: 0.35,
            experience: 0.1,
            margin: 0.1,
            risk: 0.15,
          },
        },
        resolvedRequest: { property_id: "hotel-9" },
        profilePreAri: { profile: "pre" },
        profileFinal: {
          tripType: "family",
          decisionPosture: "safe",
          capabilities: {
            text_link: true,
            waitlist: true,
          },
        },
        topCandidates: [
          {
            offerId: "offer-safe",
            roomTypeName: "Deluxe King",
            roomTypeDescription: "High floor",
            features: ["balcony"],
            priceBasis: "LOS",
            total: 350,
            riskContributors: ["none"],
            score: 0.91,
            scoreComponents: { conversion: 0.5, margin: 0.4 },
          },
        ],
      },
    });

    render(<OffersDemoDashboard />);

    await user.type(screen.getByLabelText("check_in"), "2026-03-10");
    await user.type(screen.getByLabelText("check_out"), "2026-03-12");

    await user.click(screen.getByRole("button", { name: "Run Decision" }));

    await waitFor(() => {
      expect(screen.getByText("Primary Offer")).toBeTruthy();
    });

    expect(screen.getByText("User Profile")).toBeTruthy();
    expect(screen.getByText("family")).toBeTruthy();
    expect(screen.getByText("safe")).toBeTruthy();
    expect(screen.getByText("Weights")).toBeTruthy();
    expect(screen.getByText(/Value:/)).toBeTruthy();
    expect(screen.getByText(/0.30/)).toBeTruthy();
    expect(screen.getByText(/Conversion:/)).toBeTruthy();
    expect(screen.getByText(/0.35/)).toBeTruthy();
    expect(screen.getByText("Offer Ranking")).toBeTruthy();
    expect(screen.getByText("Audit Trail")).toBeTruthy();
  });

  it("submits new canonical constraint attributes in request payload", async () => {
    const user = userEvent.setup();

    mockedRequestOfferGeneration.mockResolvedValue({
      data: {
        propertyId: "hotel-9",
        offers: [{ offerId: "offer-safe", recommended: true }],
      },
    });

    render(<OffersDemoDashboard />);

    await user.type(screen.getByLabelText("check_in"), "2026-06-10");
    await user.type(screen.getByLabelText("check_out"), "2026-06-13");

    await user.click(screen.getByLabelText("pet_friendly"));
    await user.click(screen.getByLabelText("accessible"));
    await user.click(screen.getByLabelText("two_beds"));
    await user.click(screen.getByLabelText("parking"));

    await user.click(screen.getByRole("button", { name: "Run Decision" }));

    await waitFor(() => {
      expect(mockedRequestOfferGeneration).toHaveBeenCalledTimes(1);
    });

    expect(mockedRequestOfferGeneration).toHaveBeenCalledWith(
      expect.objectContaining({
        pet_friendly: true,
        accessible_room: true,
        needs_two_beds: true,
        parking_needed: true,
      }),
    );
    expect(mockedRequestOfferGeneration.mock.calls[0]?.[0]).not.toHaveProperty("preferences");
  });
});
