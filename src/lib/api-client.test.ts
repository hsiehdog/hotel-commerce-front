import { describe, expect, it } from "vitest";

import {
  getChatOffersFromResponse,
  getChatRecommendedRoomFromResponse,
  type ChatMessageResponse,
} from "@/lib/api-client";

describe("getChatOffersFromResponse", () => {
  it("maps recommended_room when present", () => {
    const data: ChatMessageResponse["data"] = {
      sessionId: "session-1",
      assistantMessage: "Here is your recommendation",
      status: "OK",
      nextAction: "PRESENT_OFFERS",
      slots: {},
      commerce: {
        currency: "USD",
        recommended_room: {
          room_type: "Family Suite",
          rate_plan: "Flexible Rate",
          nightly_price: 329,
          total_price: 987,
          policy_summary: "Refundable",
          room_type_id: "rt_family_suite",
          rate_plan_id: "rp_flex",
        },
      },
    };

    const offers = getChatOffersFromResponse(data);
    expect(offers).toHaveLength(1);
    expect(offers[0]?.name).toBe("Family Suite");
    expect(offers[0]?.price.total).toBe(987);
  });

  it("falls back to the first ranked room when recommended_room is absent", () => {
    const data: ChatMessageResponse["data"] = {
      sessionId: "session-1",
      assistantMessage: "Best available option",
      status: "OK",
      nextAction: "PRESENT_OFFERS",
      slots: {},
      commerce: {
        currency: "USD",
        ranked_rooms: [
          {
            room_type_id: "rt_family_suite",
            room_type_name: "Family Suite",
            rate_plan_id: "rp_flex",
            price: 987,
            reasons: ["Strong fit"],
          },
        ],
      },
    };

    const offers = getChatOffersFromResponse(data);
    expect(offers).toHaveLength(1);
    expect(offers[0]?.name).toBe("Family Suite");
    expect(offers[0]?.price.total).toBe(987);
  });

  it("returns empty array when neither recommended_room nor ranked_rooms is present", () => {
    const data: ChatMessageResponse["data"] = {
      sessionId: "session-1",
      assistantMessage: "No recommendation",
      status: "OK",
      nextAction: "CONFIRM",
      slots: {},
      commerce: {
        fallback: {
          type: "suggest_alternate_dates",
          reason: "No eligible room remained.",
          suggestions: [],
        },
      },
    };

    expect(getChatOffersFromResponse(data)).toEqual([]);
  });
});

describe("getChatRecommendedRoomFromResponse", () => {
  it("maps included_fees object entries into labeled pricing rows", () => {
    const data: ChatMessageResponse["data"] = {
      sessionId: "session-1",
      assistantMessage: "Here is your recommendation",
      status: "OK",
      nextAction: "PRESENT_OFFERS",
      slots: {},
      commerce: {
        currency: "USD",
        recommended_room: {
          room_type: "King Room",
          rate_plan: "Pay Now Saver",
          nightly_price: 140.87,
          total_price: 281.74,
          policy_summary: "Non-refundable rate with fixed booking terms.",
          room_type_id: "rt_king",
          rate_plan_id: "rp_pay_now",
          pricing_breakdown: {
            subtotal: 190.3,
            taxes_and_fees: 26.44,
            included_fees: {
              pet_fee_per_night: 0,
              parking_fee_per_night: 15,
              breakfast_fee_per_night: 9,
              early_check_in_flat_fee: 0,
              late_check_out_flat_fee: 0,
              pet_fee_total: 0,
              parking_fee_total: 30,
              breakfast_fee_total: 18,
              early_check_in_fee_total: 0,
              late_check_out_fee_total: 0,
            },
            add_ons_estimated_total: 65,
            total_with_estimated_add_ons: 329.74,
          },
        },
      },
    };

    const room = getChatRecommendedRoomFromResponse(data);

    expect(room?.pricingBreakdown.subtotal).toBe(190.3);
    expect(room?.pricingBreakdown.taxesAndFees).toBe(26.44);
    expect(room?.pricingBreakdown.includedFees).toEqual([
      { label: "Parking Fee ($15/night)", amount: 30 },
      { label: "Breakfast Fee ($9/night)", amount: 18 },
    ]);
  });
});
