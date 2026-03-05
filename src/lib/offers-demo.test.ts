import { describe, expect, it } from "vitest";

import {
  buildOffersGenerateRequest,
  getDefaultOffersDraft,
  parseAdvancedJson,
  parseOffersResponse,
  validateOffersDraft,
} from "@/lib/offers-demo";

describe("offers demo request builder", () => {
  it("builds canonical top-level request payload", () => {
    const draft = {
      ...getDefaultOffersDraft(),
      property_id: "hotel-test-1",
      channel: "chat" as const,
      check_in: "2026-03-10",
      check_out: "2026-03-12",
      nights: "2",
      rooms: "1",
      adults: "2",
      children: "0",
      child_ages: [],
      roomOccupancies: [{ adults: 2, children: 0 }],
      pet_friendly: true,
      accessible_room: true,
      parking_needed: true,
      currency: "usd",
      stub_scenario: "family_space_priority",
    };

    const payload = buildOffersGenerateRequest(draft, {
      market_segment: "family",
    });

    expect(payload.property_id).toBe("hotel-test-1");
    expect(payload.channel).toBe("chat");
    expect(payload.currency).toBe("USD");
    expect(payload.nights).toBe(2);
    expect(payload.market_segment).toBe("family");
    expect(payload.debug).toBe(true);
    expect(payload.pet_friendly).toBe(true);
    expect(payload.accessible_room).toBe(true);
    expect(payload.parking_needed).toBe(true);
    expect(payload.children).toBeUndefined();
  });

  it("validates child age mismatch and invalid JSON", () => {
    const draft = {
      ...getDefaultOffersDraft(),
      property_id: "hotel-test-1",
      check_in: "2026-01-02",
      check_out: "2026-01-03",
      rooms: "1",
      adults: "2",
      children: "2",
      child_ages: [8],
      roomOccupancies: [{ adults: 2, children: 2 }],
    };

    const errors = validateOffersDraft(draft, "Advanced JSON is not valid JSON.");

    expect(errors).toContain("child_ages length must match children.");
    expect(errors).toContain("Advanced JSON is not valid JSON.");
  });

  it("parses advanced JSON object and rejects non-object payloads", () => {
    expect(parseAdvancedJson('{"foo":1}').error).toBeNull();
    expect(parseAdvancedJson("[]").error).toBe("Advanced JSON must be a top-level object.");
  });
});

describe("offers response parser", () => {
  it("maps recommended room, ranked rooms, and upsells", () => {
    const parsed = parseOffersResponse({
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
          pricing_breakdown: {
            subtotal: 760,
            taxes_and_fees: 102,
            included_fees: {
              pet_fee_per_night: 25,
              pet_fee_total: 50,
              early_check_in_flat_fee: 35,
              early_check_in_fee_total: 35,
              parking_fee_total: 0,
            },
          },
          score: 0.8731,
          reasons: ["Strong fit", "Good value"],
          policy_summary: "Refundable rate with flexible cancellation.",
          inventory_note: "Only 2 left.",
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
            component_scores: {
              fit: 0.95,
              value: 0.72,
            },
            reasons: ["Strong fit"],
          },
        ],
        fallback: null,
      },
    });

    expect(parsed.propertyId).toBe("demo_property");
    expect(parsed.recommendedRoom?.roomType).toBe("Family Suite");
    expect(parsed.recommendedRoom?.ratePlan).toBe("Flexible Rate");
    expect(parsed.recommendedRoom?.pricingBreakdown.subtotal).toBe(760);
    expect(parsed.recommendedRoom?.pricingBreakdown.taxesAndFees).toBe(102);
    expect(parsed.recommendedRoom?.pricingBreakdown.includedFees).toEqual([
      { label: "Pet Fee ($25/night)", amount: 50 },
      { label: "Early Check In Fee", amount: 35 },
    ]);
    expect(parsed.recommendedOffers[0]?.label).toBe("Breakfast package");
    expect(parsed.rankedRooms[0]?.roomTypeName).toBe("Family Suite");
    expect(parsed.rankedRooms[0]?.componentScores.fit).toBe(0.95);
    expect(parsed.fallback).toBeNull();
  });

  it("maps no-recommendation fallback case", () => {
    const parsed = parseOffersResponse({
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

    expect(parsed.recommendedRoom).toBeNull();
    expect(parsed.recommendedOffers).toEqual([]);
    expect(parsed.rankedRooms).toEqual([]);
    expect(parsed.fallback?.type).toBe("suggest_alternate_dates");
  });
});
