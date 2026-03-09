import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OffersDemoDashboard } from "@/components/offers/offers-demo-dashboard";
import * as apiClient from "@/lib/api-client";
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

vi.mock("@/lib/api-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api-client")>(
    "@/lib/api-client",
  );

  return {
    ...actual,
    fetchProperties: vi.fn(),
  };
});

const mockedRequestOfferGeneration = vi.mocked(offersDemo.requestOfferGeneration);
const mockedFetchProperties = vi.mocked(apiClient.fetchProperties);

function renderDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <OffersDemoDashboard />
    </QueryClientProvider>,
  );
}

describe("OffersDemoDashboard", () => {
  beforeEach(() => {
    mockedRequestOfferGeneration.mockReset();
    mockedFetchProperties.mockReset();
    mockedFetchProperties.mockResolvedValue([
      { propertyId: "inn_at_mount_shasta", name: "Inn At Mount Shasta" },
      { propertyId: "cavallo_point", name: "Cavallo Point" },
    ]);
  });

  it("keeps advanced controls hidden in Basic mode and shows them in Advanced mode", async () => {
    const user = userEvent.setup();

    renderDashboard();

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
            reasons: ["Only $70 more per night than your current option"],
            benefit_summary: ["Suite-level upgrade with more living space"],
            ladder_score: 0.74,
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

    renderDashboard();

    await user.type(screen.getByLabelText("Check-in"), "2026-03-10");
    await user.type(screen.getByLabelText("Check-out"), "2026-03-12");
    await user.click(screen.getByRole("button", { name: "Run Decision" }));

    await waitFor(() => {
      expect(screen.getAllByText("Recommended Room").length).toBeGreaterThan(0);
    });

    expect(screen.getByText("Family Suite | Flexible Rate")).toBeTruthy();
    expect(screen.getByText("Upgrade Ladder")).toBeTruthy();
    expect(screen.getByText("Bunk Suite | Standard Rate - Suites")).toBeTruthy();
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
        upgrade_ladder: [],
        ranked_rooms: [],
        fallback: {
          type: "suggest_alternate_dates",
          reason: "No eligible room remained. Try nearby dates.",
          suggestions: [],
        },
      },
    });

    renderDashboard();

    await user.type(screen.getByLabelText("Check-in"), "2026-03-10");
    await user.type(screen.getByLabelText("Check-out"), "2026-03-12");
    await user.click(screen.getByRole("button", { name: "Run Decision" }));

    await waitFor(() => {
      expect(screen.getByText("No Recommendation")).toBeTruthy();
    });

    expect(screen.getByText("No eligible room remained. Try nearby dates.")).toBeTruthy();
  });

  it("resets constraints when applying a scenario preset", async () => {
    const user = userEvent.setup();

    renderDashboard();

    const petFriendly = screen.getByLabelText("Pet friendly") as HTMLInputElement;
    expect(petFriendly.checked).toBe(false);

    await user.click(petFriendly);
    expect(petFriendly.checked).toBe(true);

    await user.click(
      screen.getByRole("button", {
        name: "Family stay",
      }),
    );

    expect((screen.getByLabelText("Pet friendly") as HTMLInputElement).checked).toBe(false);
    expect((screen.getByLabelText("Accessible") as HTMLInputElement).checked).toBe(false);
    expect((screen.getByLabelText("Two beds") as HTMLInputElement).checked).toBe(false);
    expect((screen.getByLabelText("Parking") as HTMLInputElement).checked).toBe(false);
    expect((screen.getByLabelText("Breakfast package") as HTMLInputElement).checked).toBe(false);
    expect((screen.getByLabelText("Early check-in") as HTMLInputElement).checked).toBe(false);
    expect((screen.getByLabelText("Late check-out") as HTMLInputElement).checked).toBe(false);
  });

  it("syncs room occupancies when adults change before submit", async () => {
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

    await user.click(screen.getByRole("button", { name: "Couple getaway" }));

    fireEvent.change(screen.getByLabelText("Adults"), { target: { value: "4" } });
    await user.click(screen.getByRole("button", { name: "Run Decision" }));

    await waitFor(() => {
      expect(mockedRequestOfferGeneration).toHaveBeenCalledWith(
        expect.objectContaining({
          adults: 4,
          roomOccupancies: [{ adults: 4, children: 0 }],
        }),
      );
    });
  });

  it("keeps the selected property when applying a scenario preset", async () => {
    const user = userEvent.setup();

    renderDashboard();

    const property = screen.getByLabelText("Property") as HTMLSelectElement;
    await waitFor(() => {
      expect(property.value).toBe("inn_at_mount_shasta");
    });

    await user.selectOptions(property, "cavallo_point");
    expect(property.value).toBe("cavallo_point");

    await user.click(screen.getByRole("button", { name: "Extended stay" }));

    expect((screen.getByLabelText("Property") as HTMLSelectElement).value).toBe("cavallo_point");
  });

  it("defaults the property to the first API option", async () => {
    renderDashboard();

    await waitFor(() => {
      expect((screen.getByLabelText("Property") as HTMLSelectElement).value).toBe("inn_at_mount_shasta");
    });
  });

  it("appends demo property after the API properties", async () => {
    mockedFetchProperties.mockResolvedValue([
      { propertyId: "cavallo_point", name: "Cavallo Point" },
      { propertyId: "inn_at_mount_shasta", name: "Inn At Mount Shasta" },
    ]);

    renderDashboard();

    await waitFor(() => {
      const property = screen.getByLabelText("Property") as HTMLSelectElement;
      const values = Array.from(property.options).map((option) => option.value);

      expect(values).toEqual([
        "cavallo_point",
        "inn_at_mount_shasta",
        "demo_property",
      ]);
    });
  });
});
