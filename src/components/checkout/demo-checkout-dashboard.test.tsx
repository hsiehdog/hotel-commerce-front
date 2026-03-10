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
    createChatSession: vi.fn(),
    sendChatSessionMessage: vi.fn(),
  };
});

let currentSearchParams = "";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(currentSearchParams),
}));

const mockedRequestOfferGeneration = vi.mocked(offersDemo.requestOfferGeneration);
const mockedCreateChatSession = vi.mocked(apiClient.createChatSession);
const mockedSendChatSessionMessage = vi.mocked(apiClient.sendChatSessionMessage);
const mockedFetchProperties = vi.mocked(apiClient.fetchProperties);

function buildSession() {
  return {
    sessionId: "session-1",
    createdAt: "2026-03-01T00:00:00.000Z",
    expiresAt: "2099-03-01T01:00:00.000Z",
    propertyId: "demo_property",
    language: "en-US",
    greeting: "Welcome to your stay planning assistant.",
  };
}

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
    mockedCreateChatSession.mockReset();
    mockedSendChatSessionMessage.mockReset();
    mockedFetchProperties.mockReset();

    mockedFetchProperties.mockResolvedValue([
      { propertyId: "inn_at_mount_shasta", name: "Inn At Mount Shasta" },
      { propertyId: "cavallo_point", name: "Cavallo Point" },
    ]);
    mockedCreateChatSession.mockResolvedValue(buildSession());
  });

  it("renders an initial guided empty state and concierge greeting", async () => {
    renderDashboard();

    expect(screen.getByText("Your guided recommendation will appear here")).toBeTruthy();
    expect(await screen.findByText("Welcome to your stay planning assistant.")).toBeTruthy();
  });

  it("renders recommended stay, upgrade ladder, and add-ons from the offers API", async () => {
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
    expect(screen.getAllByText("Upgrade ladder").length).toBeGreaterThan(0);
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

  it("sends concierge messages and renders assistant responses with offer cards", async () => {
    const user = userEvent.setup();

    mockedSendChatSessionMessage.mockResolvedValue({
      sessionId: "session-1",
      assistantMessage: "I found a room that should fit this stay well.",
      status: "OK",
      nextAction: "PRESENT_OFFERS",
      slots: {},
      responseUi: {
        type: "offer_recommendation",
        showRecommendedRoom: true,
        showRecommendedOffers: false,
        showRankedRooms: false,
      },
      commerce: {
        currency: "USD",
        recommended_room: {
          room_type: "Deluxe King",
          rate_plan: "Flexible Rate",
          nightly_price: 189,
          total_price: 440,
          score: 0.88,
          reasons: ["Strong fit for party size"],
          policy_summary: "Refundable rate with flexible cancellation.",
          inventory_note: "Only 2 left at this rate.",
          room_type_id: "rt_deluxe_king",
          rate_plan_id: "rp_flex",
        },
        recommended_offers: [],
        ranked_rooms: [],
        fallback: null,
      },
      decisionId: "decision-1",
    });

    renderDashboard();

    await screen.findByText("Welcome to your stay planning assistant.");
    await user.type(screen.getByPlaceholderText("Ask about your room, dates, parking, breakfast, or the property..."), "Do you have a quieter room?");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText("I found a room that should fit this stay well.")).toBeTruthy();
    expect(screen.getAllByText("Recommended Room").length).toBeGreaterThan(0);
    expect(screen.getByText("Deluxe King | Flexible Rate")).toBeTruthy();
  });

  it("restarts the concierge session", async () => {
    const user = userEvent.setup();

    mockedCreateChatSession
      .mockResolvedValueOnce(buildSession())
      .mockResolvedValueOnce({
        ...buildSession(),
        sessionId: "session-2",
        greeting: "Fresh concierge session ready.",
      });

    renderDashboard();

    expect(await screen.findByText("Welcome to your stay planning assistant.")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Start a new concierge chat" }));

    await waitFor(() => {
      expect(mockedCreateChatSession).toHaveBeenCalledTimes(2);
    });
    expect(await screen.findByText("Fresh concierge session ready.")).toBeTruthy();
  });

  it("uses a valid propertyId query param for offer generation and concierge session scope", async () => {
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

    renderDashboard();

    expect(await screen.findByText("Welcome to your stay planning assistant.")).toBeTruthy();
    await waitFor(() => {
      expect(mockedCreateChatSession).toHaveBeenCalledWith(
        expect.objectContaining({ property_id: "cavallo_point" }),
      );
    });

    expect(screen.getByText("Cavallo Point")).toBeTruthy();

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

    await waitFor(() => {
      expect(mockedCreateChatSession).toHaveBeenCalledWith(
        expect.objectContaining({ property_id: "inn_at_mount_shasta" }),
      );
    });

    expect(screen.getByText("Inn At Mount Shasta")).toBeTruthy();
  });
});
