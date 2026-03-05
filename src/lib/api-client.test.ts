import { describe, expect, it } from "vitest";

import { getChatOffersFromResponse, type ChatMessageResponse } from "@/lib/api-client";

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
