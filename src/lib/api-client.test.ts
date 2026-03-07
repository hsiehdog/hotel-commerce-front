import { describe, expect, it } from "vitest";

import {
  getChatRecommendedRoomFromResponse,
  getChatResponseUi,
  type ChatMessageResponse,
} from "@/lib/api-client";

describe("getChatResponseUi", () => {
  it("returns explicit responseUi when present", () => {
    const data: ChatMessageResponse["data"] = {
      sessionId: "session-1",
      assistantMessage: "Here is your recommendation",
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

    expect(getChatResponseUi(data)).toEqual(data.responseUi);
  });

  it("falls back to offer_recommendation when responseUi is missing and ranked_rooms exist", () => {
    const data: ChatMessageResponse["data"] = {
      sessionId: "session-1",
      assistantMessage: "Best available option",
      status: "OK",
      nextAction: "PRESENT_OFFERS",
      slots: {},
      responseUi: undefined as never,
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

    expect(getChatResponseUi(data)).toEqual({
      type: "offer_recommendation",
      showRecommendedRoom: true,
      showRecommendedOffers: false,
      showRankedRooms: false,
    });
  });

  it("falls back to confirmation when responseUi is missing and nextAction is confirm", () => {
    const data: ChatMessageResponse["data"] = {
      sessionId: "session-1",
      assistantMessage: "No recommendation",
      status: "OK",
      nextAction: "CONFIRM",
      slots: {},
      responseUi: undefined as never,
      commerce: {
        fallback: {
          type: "suggest_alternate_dates",
          reason: "No eligible room remained.",
          suggestions: [],
        },
      },
    };

    expect(getChatResponseUi(data)).toEqual({
      type: "confirmation",
      answerMode: "yes_no",
      targetSlots: undefined,
      slotHints: undefined,
      summary: null,
    });
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
      responseUi: {
        type: "offer_recommendation",
        showRecommendedRoom: true,
        showRecommendedOffers: false,
        showRankedRooms: false,
      },
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
