import { describe, expect, it } from "vitest";

import {
  buildOffersGenerateRequest,
  getDefaultOffersDraft,
  parseAdvancedJson,
  parseOffersResponse,
  scenarioPresets,
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

  it("normalizes room occupancies from the top-level guest counts", () => {
    const draft = {
      ...getDefaultOffersDraft(),
      property_id: "inn_at_mount_shasta",
      check_in: "2026-06-19",
      check_out: "2026-06-21",
      rooms: "1",
      adults: "4",
      children: "0",
      roomOccupancies: [{ adults: 2, children: 0 }],
    };

    const payload = buildOffersGenerateRequest(draft, {});

    expect(payload.adults).toBe(4);
    expect(payload.roomOccupancies).toEqual([{ adults: 4, children: 0 }]);
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

  it("rejects drafts where adults are fewer than rooms", () => {
    const draft = {
      ...getDefaultOffersDraft(),
      property_id: "hotel-test-1",
      check_in: "2026-01-02",
      check_out: "2026-01-03",
      rooms: "2",
      adults: "1",
      children: "0",
    };

    const errors = validateOffersDraft(draft, null);

    expect(errors).toContain("adults must be at least rooms so each room has one adult.");
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
          room_description: "A larger suite with a separate living area for families.",
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
        upgrade_ladder: [
          {
            room_type_id: "rt_bunk_suite",
            room_type: "Bunk Suite",
            room_description: "A suite layout with extra sleeping space and room to spread out.",
            rate_plan_id: "rp_suite_standard",
            rate_plan: "Standard Rate - Suites",
            total_price: 598,
            nightly_price: 299,
            price_delta_total: 140,
            price_delta_per_night: 70,
            upgrade_level: "next_step",
            reasons: ["Suite-level upgrade with more living space"],
            benefit_summary: ["Adds more sleeping flexibility"],
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
    expect(parsed.recommendedRoom?.roomDescription).toBe("A larger suite with a separate living area for families.");
    expect(parsed.recommendedRoom?.ratePlan).toBe("Flexible Rate");
    expect(parsed.recommendedRoom?.pricingBreakdown.subtotal).toBe(760);
    expect(parsed.recommendedRoom?.pricingBreakdown.taxesAndFees).toBe(102);
    expect(parsed.recommendedRoom?.pricingBreakdown.includedFees).toEqual([
      { label: "Pet Fee ($25/night)", amount: 50 },
      { label: "Early Check In Fee", amount: 35 },
    ]);
    expect(parsed.recommendedOffers[0]?.label).toBe("Breakfast package");
    expect(parsed.upgradeLadder[0]).toEqual({
      roomTypeId: "rt_bunk_suite",
      roomType: "Bunk Suite",
      roomDescription: "A suite layout with extra sleeping space and room to spread out.",
      ratePlanId: "rp_suite_standard",
      ratePlan: "Standard Rate - Suites",
      totalPrice: 598,
      nightlyPrice: 299,
      priceDeltaTotal: 140,
      priceDeltaPerNight: 70,
      upgradeLevel: "next_step",
      reasons: ["Suite-level upgrade with more living space"],
      benefitSummary: ["Adds more sleeping flexibility"],
      ladderScore: 0.74,
    });
    expect(parsed.rankedRooms[0]?.roomTypeName).toBe("Family Suite");
    expect(parsed.rankedRooms[0]?.componentScores.fit).toBe(0.95);
    expect(parsed.fallback).toBeNull();
  });

  it("maps no-recommendation fallback case", () => {
    const parsed = parseOffersResponse({
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

    expect(parsed.recommendedRoom).toBeNull();
    expect(parsed.recommendedOffers).toEqual([]);
    expect(parsed.upgradeLadder).toEqual([]);
    expect(parsed.rankedRooms).toEqual([]);
    expect(parsed.fallback?.type).toBe("suggest_alternate_dates");
  });
});

describe("scenario presets", () => {
  it("uses short scenario labels", () => {
    expect(scenarioPresets.map((preset) => preset.label)).toEqual([
      "Family stay",
      "Couple getaway",
      "Solo weekday traveler",
      "Group booking",
      "Late checkout choice",
      "Extended stay",
      "Last-minute",
      "General traveler fallback",
    ]);
  });
});
