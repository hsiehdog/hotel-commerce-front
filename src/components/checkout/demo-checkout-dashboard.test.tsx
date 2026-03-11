import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DemoCheckoutDashboard } from "@/components/checkout/demo-checkout-dashboard";
import * as apiClient from "@/lib/api-client";
import * as offersDemo from "@/lib/offers-demo";

vi.mock("@/lib/offers-demo", async () => {
  const actual = await vi.importActual<typeof import("@/lib/offers-demo")>("@/lib/offers-demo");
  return {
    ...actual,
    requestOfferGeneration: vi.fn(),
  };
});

vi.mock("@/lib/api-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api-client")>("@/lib/api-client");
  return {
    ...actual,
    fetchProperties: vi.fn(),
    answerConciergeQuestion: vi.fn(),
  };
});

let currentSearchParams = "";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(currentSearchParams),
}));

const mockedRequestOfferGeneration = vi.mocked(offersDemo.requestOfferGeneration);
const mockedAnswerConciergeQuestion = vi.mocked(apiClient.answerConciergeQuestion);
const mockedFetchProperties = vi.mocked(apiClient.fetchProperties);

function renderDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <DemoCheckoutDashboard />
    </QueryClientProvider>,
  );
}

describe("DemoCheckoutDashboard", () => {
  beforeEach(() => {
    currentSearchParams = "";
    mockedRequestOfferGeneration.mockReset();
    mockedAnswerConciergeQuestion.mockReset();
    mockedFetchProperties.mockReset();

    mockedFetchProperties.mockResolvedValue([
      { propertyId: "inn_at_mount_shasta", name: "Inn At Mount Shasta" },
      { propertyId: "cavallo_point", name: "Cavallo Point" },
    ]);
  });

  it("renders an initial guided empty state and concierge greeting", async () => {
    renderDashboard();

    expect(screen.getByText("Your guided recommendation will appear here")).toBeTruthy();
    expect(await screen.findByText("Ask about the property, amenities, parking, policies, or nearby recommendations.")).toBeTruthy();
  });

  it("renders recommended stay, upgrades, and add-ons from the offers API", async () => {
    const user = userEvent.setup();

    mockedRequestOfferGeneration.mockResolvedValue({
      data: {
        propertyId: "demo_property",
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
        upgrade_ladder: [
          {
            room_type_id: "rt_bunk_suite",
            room_type: "Bunk Suite",
            rate_plan_id: "rp_suite_standard",
            rate_plan: "Standard Rate - Suites",
            total_price: 598,
            nightly_price: 299,
            price_delta_total: 140,
            price_delta_per_night: 70,
            upgrade_level: "next_step",
            reasons: [
              "Only $70 more per night than your current option",
              "Separate sleeping area makes the stay more comfortable",
            ],
            benefit_summary: ["Suite-level upgrade with more living space"],
            ladder_score: 0.74,
          },
        ],
        ranked_rooms: [],
        fallback: null,
      },
    });

    renderDashboard();

    await user.type(screen.getByLabelText("Check-in"), "2026-03-10");
    await user.type(screen.getByLabelText("Check-out"), "2026-03-12");
    await user.click(screen.getByRole("button", { name: "Find my stay" }));

    expect((await screen.findAllByText("Family Suite")).length).toBeGreaterThan(0);
    expect(screen.getByText("Flexible Rate")).toBeTruthy();
    expect(screen.getByText("Per night")).toBeTruthy();
    expect(screen.getByText("$329")).toBeTruthy();
    expect(screen.getAllByText("Upgrades").length).toBeGreaterThan(0);
    expect(screen.getByText("Bunk Suite")).toBeTruthy();
    expect(screen.getByText("Why upgrade")).toBeTruthy();
    expect(screen.getByText("Only $70 more per night than your current option")).toBeTruthy();
    expect(screen.getByText("Separate sleeping area makes the stay more comfortable")).toBeTruthy();
    expect(screen.getByText("Recommended add-ons")).toBeTruthy();
    expect(screen.getByText("Breakfast package")).toBeTruthy();
  });

  it("shows validation and request errors for the booking form", async () => {
    const user = userEvent.setup();

    mockedRequestOfferGeneration.mockRejectedValueOnce(new Error("Request failed."));

    renderDashboard();

    await user.click(screen.getByRole("button", { name: "Find my stay" }));
    expect(await screen.findByText("check_in is required.")).toBeTruthy();

    await user.type(screen.getByLabelText("Check-in"), "2026-03-10");
    await user.type(screen.getByLabelText("Check-out"), "2026-03-12");
    await user.click(screen.getByRole("button", { name: "Find my stay" }));

    expect(await screen.findByText("Request failed.")).toBeTruthy();
  });

  it("keeps child ages aligned with the children count", async () => {
    const user = userEvent.setup();

    mockedRequestOfferGeneration.mockResolvedValue({
      data: {
        recommended_room: null,
        recommended_offers: [],
        upgrade_ladder: [],
        ranked_rooms: [],
        fallback: null,
      },
    });

    renderDashboard();

    await user.type(screen.getByLabelText("Check-in"), "2026-03-10");
    await user.type(screen.getByLabelText("Check-out"), "2026-03-12");
    await user.clear(screen.getByLabelText("Children"));
    await user.type(screen.getByLabelText("Children"), "1");
    await user.click(screen.getByRole("button", { name: "Find my stay" }));

    await waitFor(() => {
      expect(mockedRequestOfferGeneration).toHaveBeenCalledWith(
        expect.objectContaining({
          children: 1,
          child_ages: [0],
          roomOccupancies: [{ adults: 2, children: 1 }],
        }),
      );
    });

    expect(screen.queryByText("child_ages length must match children.")).toBeNull();
  });

  it("sends concierge messages to the property answer endpoint and renders metadata", async () => {
    const user = userEvent.setup();

    mockedAnswerConciergeQuestion.mockResolvedValue({
      answer: "Yes. Quiet-side rooms are usually available on request.",
      confidence: 0.88,
      sources: [{ id: "quiet-rooms", title: "Front desk fact", url: "https://example.com/front-desk-fact" }],
      answerType: "fact",
    });

    renderDashboard();

    await screen.findByText("Ask about the property, amenities, parking, policies, or nearby recommendations.");
    await user.type(screen.getByPlaceholderText("Ask about your room, dates, parking, breakfast, or the property..."), "Do you have a quieter room?");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(mockedAnswerConciergeQuestion).toHaveBeenCalledWith("inn_at_mount_shasta", "Do you have a quieter room?");
    expect(await screen.findByText("Yes. Quiet-side rooms are usually available on request.")).toBeTruthy();
    expect(screen.getByText("fact")).toBeTruthy();
    expect(screen.getByText("Confidence 88%")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Front desk fact" }).getAttribute("href")).toBe("https://example.com/front-desk-fact");
  });

  it("restarts the concierge locally", async () => {
    const user = userEvent.setup();

    mockedAnswerConciergeQuestion.mockResolvedValue({
      answer: "Parking is complimentary.",
      confidence: null,
      sources: [],
      answerType: "policy",
    });

    renderDashboard();

    await screen.findByText("Ask about the property, amenities, parking, policies, or nearby recommendations.");
    await user.type(screen.getByPlaceholderText("Ask about your room, dates, parking, breakfast, or the property..."), "What about parking?");
    await user.click(screen.getByRole("button", { name: "Send" }));
    await screen.findByText("Parking is complimentary.");

    await user.click(screen.getByRole("button", { name: "Start a new concierge chat" }));

    await waitFor(() => {
      expect(screen.queryByText("Parking is complimentary.")).toBeNull();
    });
    expect(screen.getByText("Ask about the property, amenities, parking, policies, or nearby recommendations.")).toBeTruthy();
  });

  it("uses a valid propertyId query param for offer generation and concierge scope", async () => {
    const user = userEvent.setup();
    currentSearchParams = "propertyId=cavallo_point";

    mockedRequestOfferGeneration.mockResolvedValue({
      data: {
        recommended_room: null,
        recommended_offers: [],
        upgrade_ladder: [],
        ranked_rooms: [],
        fallback: null,
      },
    });
    mockedAnswerConciergeQuestion.mockResolvedValue({
      answer: "Breakfast is served from 7 to 10 AM.",
      confidence: null,
      sources: [],
      answerType: "fact",
    });

    renderDashboard();

    expect(await screen.findByText("Ask about the property, amenities, parking, policies, or nearby recommendations.")).toBeTruthy();
    expect(screen.getByText("Cavallo Point")).toBeTruthy();

    await user.type(screen.getByPlaceholderText("Ask about your room, dates, parking, breakfast, or the property..."), "When is breakfast?");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(mockedAnswerConciergeQuestion).toHaveBeenCalledWith("cavallo_point", "When is breakfast?");

    await user.type(screen.getByLabelText("Check-in"), "2026-03-10");
    await user.type(screen.getByLabelText("Check-out"), "2026-03-12");
    await user.click(screen.getByRole("button", { name: "Find my stay" }));

    await waitFor(() => {
      expect(mockedRequestOfferGeneration).toHaveBeenCalledWith(
        expect.objectContaining({ property_id: "cavallo_point" }),
      );
    });
  });

  it("falls back to the default property when propertyId query param is invalid", async () => {
    currentSearchParams = "propertyId=unknown_property";

    renderDashboard();

    await screen.findByText("Ask about the property, amenities, parking, policies, or nearby recommendations.");
    expect(screen.getByText("Inn At Mount Shasta")).toBeTruthy();
  });
});
