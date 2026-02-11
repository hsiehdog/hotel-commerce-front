import { describe, expect, it } from "vitest";

import {
  buildOffersGenerateRequest,
  getDefaultOffersDraft,
  parseAdvancedJson,
  parseOffersResponse,
  validateOffersDraft,
} from "@/lib/offers-demo";

describe("offers demo request builder", () => {
  it("builds request payload with nights and advanced fields", () => {
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
  it("maps summary and offer fields from mixed backend key styles", () => {
    const parsed = parseOffersResponse({
      property_id: "hotel-9",
      channel: "agent",
      currency: "USD",
      price_basis_used: "LOS",
      config_version: "v2026.04.1",
      offers: [
        {
          offer_id: "offer-1",
          offerType: "best_value",
          isRecommended: true,
          room_type: "deluxe",
          rate_plan: "flex",
          pricing: { total: 320 },
        },
      ],
      debug: {
        topCandidates: [
          {
            offerId: "offer-1",
            score: 0.92,
            scoreComponents: { margin: 0.4, conversion: 0.3 },
            riskContributors: ["high_demand"],
          },
        ],
      },
    });

    expect(parsed.propertyId).toBe("hotel-9");
    expect(parsed.priceBasisUsed).toBe("LOS");
    expect(parsed.configVersion).toBe("v2026.04.1");
    expect(parsed.offers[0]?.offerId).toBe("offer-1");
    expect(parsed.offers[0]?.recommended).toBe(true);
    expect(parsed.debug.topCandidates[0]?.offerId).toBe("offer-1");
  });
});
