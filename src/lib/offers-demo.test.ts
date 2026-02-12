import { describe, expect, it } from "vitest";

import {
  buildOffersGenerateRequest,
  getDefaultOffersDraft,
  getSecondaryOffer,
  groupReasonCodes,
  parseAdvancedJson,
  parseOffersResponse,
  validateOffersDraft,
} from "@/lib/offers-demo";

describe("offers demo request builder", () => {
  it("builds canonical top-level request payload", () => {
    const draft = {
      ...getDefaultOffersDraft(),
      property_id: "hotel-test-1",
      channel: "web" as const,
      check_in: "2026-03-10",
      check_out: "2026-03-12",
      nights: "2",
      rooms: "1",
      adults: "2",
      children: "1",
      child_ages: [9],
      roomOccupancies: [{ adults: 2, children: 1 }],
      preferences: {
        needs_space: true,
        late_arrival: false,
      },
      pet_friendly: true,
      accessible_room: true,
      needs_two_beds: false,
      budget_cap: "450",
      parking_needed: true,
      debug: true,
      currency: "usd",
      stub_scenario: "family_space_priority",
    };

    const payload = buildOffersGenerateRequest(draft, {
      market_segment: "family",
    });

    expect(payload.property_id).toBe("hotel-test-1");
    expect(payload.currency).toBe("USD");
    expect(payload.nights).toBe(2);
    expect(payload.market_segment).toBe("family");
    expect(payload.debug).toBe(true);
    expect(payload.pet_friendly).toBe(true);
    expect(payload.accessible_room).toBe(true);
    expect(payload.parking_needed).toBe(true);
    expect(payload.budget_cap).toBe(450);
    expect((payload as Record<string, unknown>).request).toBeUndefined();
    expect((payload as Record<string, unknown>).payload).toBeUndefined();
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

  it("validates budget_cap when provided", () => {
    const draft = {
      ...getDefaultOffersDraft(),
      property_id: "hotel-test-1",
      check_in: "2026-01-02",
      check_out: "2026-01-03",
      rooms: "1",
      adults: "2",
      children: "0",
      child_ages: [],
      roomOccupancies: [{ adults: 2, children: 0 }],
      budget_cap: "-10",
    };

    const errors = validateOffersDraft(draft, null);
    expect(errors).toContain("budget_cap must be a number greater than 0 when provided.");
  });

  it("parses advanced JSON object and rejects non-object payloads", () => {
    expect(parseAdvancedJson('{"foo":1}').error).toBeNull();
    expect(parseAdvancedJson("[]").error).toBe("Advanced JSON must be a top-level object.");
  });
});

describe("offers response parser", () => {
  it("maps summary, property context, and offer fields", () => {
    const parsed = parseOffersResponse({
      property_id: "hotel-9",
      channel: "agent",
      currency: "USD",
      price_basis_used: "LOS",
      config_version: "v2026.04.1",
      strategy_mode: "balanced",
      timezone: "America/New_York",
      policies: ["ID required", "No smoking"],
      offers: [
        {
          offer_id: "offer-1",
          offerType: "best_value",
          isRecommended: true,
          room_type: "deluxe",
          roomTypeDescription: "Top floor king",
          rate_plan: "flex",
          pricing: { total: 320, paymentType: "pay_now" },
          cancellationPolicy: { refundable: true },
        },
      ],
      reason_codes: ["filter_inventory", "selection_best_margin", "fallback_waitlist"],
      debug: {
        topCandidates: [
          {
            offerId: "offer-1",
            score: 0.92,
            scoreComponents: { margin: 0.4, conversion: 0.3 },
            riskContributors: ["high_demand"],
          },
        ],
        profileFinal: {
          capabilities: {
            text_link: true,
            transfer: false,
          },
        },
      },
    });

    expect(parsed.propertyId).toBe("hotel-9");
    expect(parsed.priceBasisUsed).toBe("LOS");
    expect(parsed.configVersion).toBe("v2026.04.1");
    expect(parsed.propertyContext.strategyMode).toBe("balanced");
    expect(parsed.propertyContext.timezone).toBe("America/New_York");
    expect(parsed.propertyContext.policies).toContain("ID required");
    expect(parsed.propertyContext.capabilities).toContain("text_link: on");
    expect(parsed.offers[0]?.offerId).toBe("offer-1");
    expect(parsed.offers[0]?.recommended).toBe(true);
    expect(parsed.debug.topCandidates[0]?.offerId).toBe("offer-1");
  });

  it("groups reason codes for why panel", () => {
    const groups = groupReasonCodes([
      "filter_inventory",
      "selection_best_margin",
      "fallback_waitlist",
      "misc_note",
    ]);

    expect(groups.filters).toEqual(["filter_inventory"]);
    expect(groups.selection).toEqual(["selection_best_margin"]);
    expect(groups.fallback).toEqual(["fallback_waitlist"]);
    expect(groups.other).toEqual(["misc_note"]);
  });

  it("parses wrapped response envelopes", () => {
    const parsed = parseOffersResponse({
      data: {
        property_id: "hotel-wrapped",
        decision_trace: ["rule_a", "rule_b"],
        selected_offers: [
          {
            offer_id: "offer-200",
            recommended: true,
            room_type: "Suite",
            rate_plan: "flex",
          },
        ],
        debug: {
          top_candidates: [{ offer_id: "offer-200", score: 0.9 }],
        },
      },
    });

    expect(parsed.propertyId).toBe("hotel-wrapped");
    expect(parsed.offers[0]?.offerId).toBe("offer-200");
    expect(parsed.debug.topCandidates[0]?.offer_id).toBe("offer-200");
  });

  it("extracts property context from nested snake_case debug shapes", () => {
    const parsed = parseOffersResponse({
      data: {
        property_id: "hotel-nested",
        offers: [{ offer_id: "offer-1", recommended: true }],
        debug: {
          profile_final: {
            strategy_mode: "protective",
            time_zone: "Asia/Tokyo",
            stay_policies: [
              { summary: "No same-day cancellation" },
              "ID check at desk",
            ],
            fallback_capabilities: {
              text_link: true,
              transfer: false,
              waitlist: {
                enabled: true,
                modes: ["sms", "email"],
              },
            },
          },
        },
      },
    });

    expect(parsed.propertyContext.strategyMode).toBe("protective");
    expect(parsed.propertyContext.timezone).toBe("Asia/Tokyo");
    expect(parsed.propertyContext.policies).toContain("No same-day cancellation");
    expect(parsed.propertyContext.policies).toContain("ID check at desk");
    expect(parsed.propertyContext.capabilities).toContain("text_link: on");
    expect(parsed.propertyContext.capabilities).toContain("transfer: off");
    expect(parsed.propertyContext.capabilities).toContain("waitlist.enabled: on");
    expect(parsed.propertyContext.capabilities).toContain("waitlist.modes: sms, email");
  });

  it("reads strategy mode from debug.resolvedRequest", () => {
    const parsed = parseOffersResponse({
      data: {
        propertyId: "inn_at_mount_shasta",
        offers: [{ offerId: "off_safe_business", recommended: true }],
        debug: {
          resolvedRequest: {
            strategyMode: "balanced",
          },
        },
      },
    });

    expect(parsed.propertyContext.strategyMode).toBe("balanced");
  });

  it("maps roomType/ratePlan objects and debug reason codes from demo payload shape", () => {
    const parsed = parseOffersResponse({
      data: {
        propertyId: "inn_at_mount_shasta",
        channel: "voice",
        currency: "USD",
        priceBasisUsed: "afterTax",
        offers: [
          {
            offerId: "off_safe_business",
            type: "SAFE",
            recommended: true,
            roomType: {
              id: "rt_king",
              name: "King Room",
              description: "King description",
              features: ["WiFi", "Parking"],
            },
            ratePlan: {
              id: "rp_flex",
              name: "Flexible",
            },
            policy: {
              refundability: "refundable",
              paymentTiming: "pay_at_property",
              cancellationSummary: "Free cancellation up to 24 hours before arrival.",
            },
            pricing: {
              basis: "afterTax",
              total: 383.04,
            },
          },
        ],
        debug: {
          reasonCodes: ["SELECT_PRIMARY_SAFE"],
          topCandidates: [
            {
              roomTypeId: "rt_king",
              ratePlanId: "rp_flex",
              basis: "afterTax",
              totalPrice: 383.04,
              scoreTotal: 57.9,
              components: { valueScore: 81 },
            },
          ],
        },
      },
    });

    expect(parsed.offers[0]?.room).toBe("King Room");
    expect(parsed.offers[0]?.ratePlan).toBe("Flexible");
    expect(parsed.offers[0]?.cancellationSummary).toContain("Free cancellation");
    expect(parsed.offers[0]?.paymentSummary).toBe("pay_at_property");
    expect(parsed.offers[0]?.pricingBreakdown.total).toBe(383.04);
    expect(parsed.reasonCodes).toContain("SELECT_PRIMARY_SAFE");
    expect(parsed.debug.topCandidates[0]?.scoreTotal).toBe(57.9);
  });

  it("maps pricing breakdown fields when present", () => {
    const parsed = parseOffersResponse({
      data: {
        offers: [
          {
            offerId: "offer-1",
            recommended: true,
            pricing: {
              breakdown: {
                subtotal: 300,
                taxesAndFees: 45,
                addOns: 25,
                total: 370,
              },
            },
          },
        ],
      },
    });

    expect(parsed.offers[0]?.pricingBreakdown.subtotal).toBe(300);
    expect(parsed.offers[0]?.pricingBreakdown.taxesFees).toBe(45);
    expect(parsed.offers[0]?.pricingBreakdown.addOns).toBe(25);
    expect(parsed.offers[0]?.pricingBreakdown.total).toBe(370);
  });

  it("maps demo pricing breakdown with baseRateSubtotal and includedFees", () => {
    const parsed = parseOffersResponse({
      data: {
        configVersion: 1,
        offers: [
          {
            offerId: "rp_flex",
            recommended: true,
            pricing: {
              totalAfterTax: 249.76,
              breakdown: {
                baseRateSubtotal: 223,
                taxesAndFees: 26.76,
                includedFees: {
                  totalIncludedFees: 0,
                },
              },
            },
          },
        ],
      },
    });

    expect(parsed.configVersion).toBe("1");
    expect(parsed.offers[0]?.pricingBreakdown.subtotal).toBe(223);
    expect(parsed.offers[0]?.pricingBreakdown.taxesFees).toBe(26.76);
    expect(parsed.offers[0]?.pricingBreakdown.addOns).toBe(0);
    expect(parsed.offers[0]?.pricingBreakdown.total).toBe(249.76);
  });

  it("returns a secondary offer even when offerId values are duplicated", () => {
    const parsed = parseOffersResponse({
      data: {
        offers: [
          { offerId: "rp_flex", recommended: true, roomType: { name: "King" } },
          { offerId: "rp_flex", recommended: false, roomType: { name: "Queen" } },
        ],
      },
    });

    const secondary = getSecondaryOffer(parsed.offers);
    expect(secondary?.room).toBe("Queen");
  });
});
