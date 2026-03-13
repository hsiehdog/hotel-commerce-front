import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DemoCheckoutDashboard } from "@/components/checkout/demo-checkout-dashboard";
import type { ConciergeCurrentPricing } from "@/lib/api-client";
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
    syncConciergeContext: vi.fn(),
  };
});

let currentSearchParams = "";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(currentSearchParams),
}));

const mockedRequestOfferGeneration = vi.mocked(offersDemo.requestOfferGeneration);
const mockedAnswerConciergeQuestion = vi.mocked(apiClient.answerConciergeQuestion);
const mockedFetchProperties = vi.mocked(apiClient.fetchProperties);
const mockedSyncConciergeContext = vi.mocked(apiClient.syncConciergeContext);

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

function getAddOnCard(label: string): HTMLElement {
  const card = screen
    .getAllByText(label)
    .map((element) => element.closest("div.rounded-3xl"))
    .find(
      (element): element is HTMLElement =>
        element instanceof HTMLElement && Boolean(within(element).queryByRole("button")),
    );

  if (!card) {
    throw new Error(`Unable to find add-on card for ${label}`);
  }

  return card;
}

function buildOfferGenerateResponse() {
  return {
    data: {
      propertyId: "demo_property",
      channel: "web",
      currency: "USD",
      priceBasisUsed: "afterTax",
      configVersion: 1,
      recommended_room: {
        room_type: "Family Suite",
        room_description: "Large suite with separate lounge.",
        rate_plan: "Flexible Rate",
        nightly_price: 329,
        total_price: 987,
        pricing_breakdown: {
          subtotal: 900,
          taxes_and_fees: 87,
          included_fees: {
            pet_fee_per_night: 0,
            parking_fee_per_night: 0,
            breakfast_fee_per_night: 0,
            early_check_in_flat_fee: 0,
            late_check_out_flat_fee: 0,
            pet_fee_total: 0,
            parking_fee_total: 0,
            breakfast_fee_total: 0,
            early_check_in_fee_total: 0,
            late_check_out_fee_total: 0,
          },
          add_ons_estimated_total: 0,
          total_with_estimated_add_ons: 987,
        },
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
        {
          bundle_type: "parking",
          label: "Parking pass",
          score: 0.65,
          reasons: ["Common drive-in add-on"],
          estimated_price_delta: 25,
        },
      ],
      upgrade_ladder: [
        {
          room_type_id: "rt_bunk_suite",
          room_type: "Bunk Suite",
          room_description: "Larger suite with bunks.",
          rate_plan_id: "rp_suite_standard",
          rate_plan: "Standard Rate - Suites",
          total_price: 1127,
          nightly_price: 399,
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
  };
}

function buildCurrentPricing(overrides: Partial<ConciergeCurrentPricing> = {}): ConciergeCurrentPricing {
  return {
    currency: "USD",
    roomTotal: 987,
    addOnsTotal: 0,
    total: 987,
    nightlyPrice: 329,
    subtotal: 900,
    taxesAndFees: 87,
    selectedAddOns: [],
    ...overrides,
  };
}

function buildSyncResponse(overrides: Partial<apiClient.ConciergeContextSyncResult> = {}): apiClient.ConciergeContextSyncResult {
  return {
    sessionId: "sess_context_1",
    currentSelection: {
      roomTypeId: "rt_family_suite",
      ratePlanId: "rp_flex",
      roomType: "Family Suite",
      ratePlan: "Flexible Rate",
      selectedAddOns: [],
    },
    currentPricing: buildCurrentPricing(),
    ...overrides,
  };
}

async function fillStayForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Check-in"), "2026-03-10");
  await user.type(screen.getByLabelText("Check-out"), "2026-03-12");
}

describe("DemoCheckoutDashboard", () => {
  beforeEach(() => {
    currentSearchParams = "";
    mockedRequestOfferGeneration.mockReset();
    mockedAnswerConciergeQuestion.mockReset();
    mockedFetchProperties.mockReset();
    mockedSyncConciergeContext.mockReset();

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

  it("syncs the offer snapshot after generation and reuses the returned session for chat", async () => {
    const user = userEvent.setup();
    mockedRequestOfferGeneration.mockResolvedValue(buildOfferGenerateResponse());
    mockedSyncConciergeContext.mockResolvedValue(
      buildSyncResponse({
        sessionId: "sess_synced",
        currentPricing: buildCurrentPricing({
          addOnsTotal: 18,
          total: 1005,
          selectedAddOns: [
            {
              bundleType: "breakfast",
              label: "Breakfast package",
              estimatedPriceDelta: 18,
            },
          ],
        }),
      }),
    );
    mockedAnswerConciergeQuestion.mockResolvedValue({
      answer: "Breakfast is already part of the synced context.",
      confidence: 0.85,
      sources: [],
      answerType: "fact",
    });

    renderDashboard();

    await fillStayForm(user);
    await user.click(screen.getByRole("button", { name: "Find my stay" }));

    await waitFor(() => expect(mockedSyncConciergeContext).toHaveBeenCalledTimes(1));
    expect(screen.getByText("+$70/night")).toBeTruthy();
    expect(mockedSyncConciergeContext).toHaveBeenCalledWith(
      "inn_at_mount_shasta",
      expect.objectContaining({
        offerContext: expect.objectContaining({
          search: expect.objectContaining({
            checkIn: "2026-03-10",
            checkOut: "2026-03-12",
            adults: 2,
            rooms: 1,
            children: 0,
          }),
        }),
      }),
    );
    expect(await screen.findByText("Alternatives")).toBeTruthy();
    expect(screen.queryByText("Current selection")).toBeNull();
    expect(screen.getByText("Selected")).toBeTruthy();
    expect(screen.getByText("Recommended")).toBeTruthy();

    await user.type(screen.getByPlaceholderText("Ask about your room, dates, parking, breakfast, or the property..."), "Is breakfast included?");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(mockedAnswerConciergeQuestion).toHaveBeenCalledWith("inn_at_mount_shasta", "Is breakfast included?", {
      sessionId: "sess_synced",
    });
    expect(await screen.findByText("Breakfast is already part of the synced context.")).toBeTruthy();
  });

  it("uses an existing chat session when syncing a newly generated offer", async () => {
    const user = userEvent.setup();
    mockedAnswerConciergeQuestion.mockResolvedValue({
      answer: "Sure, ask away.",
      confidence: 0.65,
      sources: [],
      answerType: "fact",
      conversation: {
        sessionId: "sess_pre_offer",
        mode: "knowledge",
        status: "answered",
        missingFields: [],
      },
    });
    mockedRequestOfferGeneration.mockResolvedValue(buildOfferGenerateResponse());
    mockedSyncConciergeContext.mockResolvedValue(buildSyncResponse());

    renderDashboard();

    await screen.findByText("Ask about the property, amenities, parking, policies, or nearby recommendations.");
    await user.type(screen.getByPlaceholderText("Ask about your room, dates, parking, breakfast, or the property..."), "What amenities do you have?");
    await user.click(screen.getByRole("button", { name: "Send" }));
    await screen.findByText("Sure, ask away.");

    await fillStayForm(user);
    await user.click(screen.getByRole("button", { name: "Find my stay" }));

    await waitFor(() => expect(mockedSyncConciergeContext).toHaveBeenCalledTimes(1));
    expect(mockedSyncConciergeContext.mock.calls[0]?.[1].sessionId).toBe("sess_pre_offer");
  });

  it("keeps pre-offer chat working without syncing reservation context", async () => {
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

    expect(mockedSyncConciergeContext).not.toHaveBeenCalled();
    expect(await screen.findByText("Parking is complimentary.")).toBeTruthy();
  });

  it("updates selection state and resyncs when the user chooses an upgrade", async () => {
    const user = userEvent.setup();
    mockedRequestOfferGeneration.mockResolvedValue(buildOfferGenerateResponse());
    mockedSyncConciergeContext
      .mockResolvedValueOnce(buildSyncResponse())
      .mockResolvedValueOnce(
        buildSyncResponse({
          sessionId: "sess_context_1",
          currentSelection: {
            roomTypeId: "rt_bunk_suite",
            ratePlanId: "rp_suite_standard",
            roomType: "Bunk Suite",
            ratePlan: "Standard Rate - Suites",
            selectedAddOns: [],
          },
          currentPricing: buildCurrentPricing({
            roomTotal: 1127,
            total: 1127,
            nightlyPrice: 399,
            subtotal: 1040,
          }),
        }),
      );

    renderDashboard();

    await fillStayForm(user);
    await user.click(screen.getByRole("button", { name: "Find my stay" }));
    await screen.findByText("Bunk Suite");

    await user.click(screen.getByRole("button", { name: "Select room" }));

    await waitFor(() => expect(mockedSyncConciergeContext).toHaveBeenCalledTimes(2));
    expect(mockedSyncConciergeContext.mock.calls[1]?.[1].offerContext.currentSelection).toEqual({
      roomTypeId: "rt_bunk_suite",
      ratePlanId: "rp_suite_standard",
      selectedAddOns: [],
    });
    expect(await screen.findByText("Bunk Suite")).toBeTruthy();
    expect(screen.getByText("Standard Rate - Suites")).toBeTruthy();
    expect(screen.getByText("Alternatives")).toBeTruthy();
    expect(screen.getByText("Family Suite")).toBeTruthy();
    expect(screen.getAllByText("$1,127").length).toBeGreaterThan(0);
  });

  it("updates add-ons and pricing locally, then resyncs the new selection", async () => {
    const user = userEvent.setup();
    mockedRequestOfferGeneration.mockResolvedValue(buildOfferGenerateResponse());
    mockedSyncConciergeContext
      .mockResolvedValueOnce(buildSyncResponse())
      .mockResolvedValueOnce(
        buildSyncResponse({
          currentSelection: {
            roomTypeId: "rt_family_suite",
            ratePlanId: "rp_flex",
            roomType: "Family Suite",
            ratePlan: "Flexible Rate",
            selectedAddOns: ["breakfast"],
          },
          currentPricing: buildCurrentPricing({
            addOnsTotal: 18,
            total: 1005,
            selectedAddOns: [
              {
                bundleType: "breakfast",
                label: "Breakfast package",
                estimatedPriceDelta: 18,
              },
            ],
          }),
        }),
      );

    renderDashboard();

    await fillStayForm(user);
    await user.click(screen.getByRole("button", { name: "Find my stay" }));
    await screen.findByText("Breakfast package");

    const breakfastCard = getAddOnCard("Breakfast package");
    await user.click(within(breakfastCard).getByRole("button", { name: "Add add-on" }));

    await waitFor(() => expect(mockedSyncConciergeContext).toHaveBeenCalledTimes(2));
    expect(mockedSyncConciergeContext.mock.calls[1]?.[1].offerContext.currentSelection).toEqual({
      roomTypeId: "rt_family_suite",
      ratePlanId: "rp_flex",
      selectedAddOns: ["breakfast"],
    });
    expect(await screen.findByText("Remove add-on")).toBeTruthy();
    expect(screen.getAllByText("$1,005").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Breakfast package").length).toBeGreaterThan(0);
  });

  it("applies select_room client actions from concierge responses", async () => {
    const user = userEvent.setup();
    mockedRequestOfferGeneration.mockResolvedValue(buildOfferGenerateResponse());
    mockedSyncConciergeContext.mockResolvedValue(buildSyncResponse());
    mockedAnswerConciergeQuestion.mockResolvedValue({
      answer: "I switched you to the first upgrade.",
      confidence: 0.92,
      sources: [],
      answerType: "fact",
      clientAction: {
        type: "select_room",
        roomTypeId: "rt_bunk_suite",
        ratePlanId: "rp_suite_standard",
      },
      reservation: {
        currentSelection: {
          roomTypeId: "rt_bunk_suite",
          ratePlanId: "rp_suite_standard",
          roomType: "Bunk Suite",
          ratePlan: "Standard Rate - Suites",
          selectedAddOns: [],
        },
        currentPricing: buildCurrentPricing({
          roomTotal: 1127,
          total: 1127,
          nightlyPrice: 399,
          subtotal: 1040,
        }),
      },
    });

    renderDashboard();

    await fillStayForm(user);
    await user.click(screen.getByRole("button", { name: "Find my stay" }));
    await user.type(screen.getByPlaceholderText("Ask about your room, dates, parking, breakfast, or the property..."), "Switch me to the first upgrade");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText("I switched you to the first upgrade.")).toBeTruthy();
    expect(screen.getByText("Bunk Suite")).toBeTruthy();
    expect(screen.getByText("Standard Rate - Suites")).toBeTruthy();
    expect(screen.getByText("Family Suite")).toBeTruthy();
    expect(screen.getAllByText("$1,127").length).toBeGreaterThan(0);
  });

  it("applies add_addon and remove_addon chat actions with refreshed pricing", async () => {
    const user = userEvent.setup();
    mockedRequestOfferGeneration.mockResolvedValue(buildOfferGenerateResponse());
    mockedSyncConciergeContext.mockResolvedValue(buildSyncResponse());
    mockedAnswerConciergeQuestion
      .mockResolvedValueOnce({
        answer: "I added breakfast.",
        confidence: 0.92,
        sources: [],
        answerType: "fact",
        clientAction: {
          type: "add_addon",
          bundleType: "breakfast",
        },
        reservation: {
          currentSelection: {
            roomTypeId: "rt_family_suite",
            ratePlanId: "rp_flex",
            roomType: "Family Suite",
            ratePlan: "Flexible Rate",
            selectedAddOns: ["breakfast"],
          },
          currentPricing: buildCurrentPricing({
            addOnsTotal: 18,
            total: 1005,
            selectedAddOns: [
              {
                bundleType: "breakfast",
                label: "Breakfast package",
                estimatedPriceDelta: 18,
              },
            ],
          }),
        },
      })
      .mockResolvedValueOnce({
        answer: "Breakfast is removed.",
        confidence: 0.92,
        sources: [],
        answerType: "fact",
        clientAction: {
          type: "remove_addon",
          bundleType: "breakfast",
        },
        reservation: {
          currentSelection: {
            roomTypeId: "rt_family_suite",
            ratePlanId: "rp_flex",
            roomType: "Family Suite",
            ratePlan: "Flexible Rate",
            selectedAddOns: [],
          },
          currentPricing: buildCurrentPricing(),
        },
      });

    renderDashboard();

    await fillStayForm(user);
    await user.click(screen.getByRole("button", { name: "Find my stay" }));

    await user.type(screen.getByPlaceholderText("Ask about your room, dates, parking, breakfast, or the property..."), "Add breakfast");
    await user.click(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByText("I added breakfast.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Remove add-on" })).toBeTruthy();

    await user.type(screen.getByPlaceholderText("Ask about your room, dates, parking, breakfast, or the property..."), "Remove breakfast");
    await user.click(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByText("Breakfast is removed.")).toBeTruthy();
    expect(screen.getAllByText("Add add-on").length).toBeGreaterThan(0);
  });

  it("restarts chat and creates a fresh synced concierge session when an offer is already loaded", async () => {
    const user = userEvent.setup();
    mockedRequestOfferGeneration.mockResolvedValue(buildOfferGenerateResponse());
    mockedSyncConciergeContext
      .mockResolvedValueOnce(buildSyncResponse({ sessionId: "sess_original" }))
      .mockResolvedValueOnce(buildSyncResponse({ sessionId: "sess_restart" }));

    renderDashboard();

    await fillStayForm(user);
    await user.click(screen.getByRole("button", { name: "Find my stay" }));
    await waitFor(() => expect(mockedSyncConciergeContext).toHaveBeenCalledTimes(1));

    await user.click(screen.getByRole("button", { name: "Start a new concierge chat" }));

    await waitFor(() => expect(mockedSyncConciergeContext).toHaveBeenCalledTimes(2));
    expect(mockedSyncConciergeContext.mock.calls[1]?.[1].sessionId).toBeUndefined();

    mockedAnswerConciergeQuestion.mockResolvedValue({
      answer: "New session is active.",
      confidence: 0.8,
      sources: [],
      answerType: "fact",
    });

    await user.type(screen.getByPlaceholderText("Ask about your room, dates, parking, breakfast, or the property..."), "What room is selected?");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(mockedAnswerConciergeQuestion).toHaveBeenLastCalledWith("inn_at_mount_shasta", "What room is selected?", {
      sessionId: "sess_restart",
    });
  });

  it("clears the stale session after a sync 409 and recovers on the next sync", async () => {
    const user = userEvent.setup();
    mockedRequestOfferGeneration.mockResolvedValue(buildOfferGenerateResponse());
    mockedSyncConciergeContext
      .mockResolvedValueOnce(buildSyncResponse({ sessionId: "sess_original" }))
      .mockRejectedValueOnce(
        new apiClient.ApiClientRequestError({
          status: 409,
          message: "Session belongs to a different property.",
        }),
      )
      .mockResolvedValueOnce(buildSyncResponse({ sessionId: "sess_recovered" }));

    renderDashboard();

    await fillStayForm(user);
    await user.click(screen.getByRole("button", { name: "Find my stay" }));
    await screen.findByText("Breakfast package");

    const breakfastCard = getAddOnCard("Breakfast package");
    await user.click(within(breakfastCard).getByRole("button", { name: "Add add-on" }));
    expect(await screen.findByText("Session belongs to a different property.")).toBeTruthy();

    const updatedBreakfastCard = getAddOnCard("Breakfast package");
    await user.click(within(updatedBreakfastCard).getByRole("button", { name: "Remove add-on" }));

    await waitFor(() => expect(mockedSyncConciergeContext).toHaveBeenCalledTimes(3));
    expect(mockedSyncConciergeContext.mock.calls[2]?.[1].sessionId).toBeUndefined();
  });

  it("continues to honor a valid propertyId query param", async () => {
    const user = userEvent.setup();
    currentSearchParams = "propertyId=cavallo_point";
    mockedRequestOfferGeneration.mockResolvedValue(buildOfferGenerateResponse());
    mockedSyncConciergeContext.mockResolvedValue(buildSyncResponse());

    renderDashboard();

    expect(await screen.findByText("Cavallo Point")).toBeTruthy();

    await fillStayForm(user);
    await user.click(screen.getByRole("button", { name: "Find my stay" }));

    await waitFor(() => {
      expect(mockedRequestOfferGeneration).toHaveBeenCalledWith(
        expect.objectContaining({ property_id: "cavallo_point" }),
      );
    });
    expect(mockedSyncConciergeContext).toHaveBeenCalledWith(
      "cavallo_point",
      expect.any(Object),
    );
  });
});
