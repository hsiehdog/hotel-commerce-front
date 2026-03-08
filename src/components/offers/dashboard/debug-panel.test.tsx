import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { DebugPanel } from "./debug-panel";
import type { ParsedOffersResponse } from "@/lib/offers-demo";

function buildParsedResponse(): ParsedOffersResponse {
  return {
    propertyId: "demo_property",
    channel: "web",
    currency: "USD",
    priceBasisUsed: "afterTax",
    configVersion: "1",
    personaConfidence: {},
    recommendedRoom: null,
    recommendedOffers: [],
    upgradeLadder: [],
    rankedRooms: [
      {
        roomTypeId: "rt_family_suite",
        roomTypeName: "Family Suite",
        ratePlanId: "rp_flex",
        price: 987,
        score: 0.87,
        componentScores: { fit: 0.95 },
        reasons: ["Strong fit"],
      },
    ],
    fallback: {
      type: "suggest_alternate_dates",
      reason: "No eligible room remained.",
      suggestions: [],
    },
    propertyContext: {
      propertyId: "demo_property",
      currency: "USD",
      strategyMode: "balanced",
      timezone: "America/Los_Angeles",
      policies: [],
      capabilities: [],
    },
    debug: {
      resolvedRequest: null,
      profilePreAri: null,
      profileFinal: null,
      scoring: null,
      selectionSummary: null,
    },
    raw: {},
  };
}

describe("DebugPanel", () => {
  it("renders overview fields including fallback indicator", () => {
    render(
      <DebugPanel
        parsedResponse={buildParsedResponse()}
        requestPayload={{ property_id: "demo_property" }}
        rawResponse={{ data: {} }}
        effectiveConfigRows={[]}
      />,
    );

    expect(screen.getByText("Audit Trail")).toBeTruthy();
    expect(screen.getByText("demo_property")).toBeTruthy();
    expect(screen.getByText("suggest_alternate_dates")).toBeTruthy();
  });

  it("switches tabs and renders ranked rooms payload", async () => {
    const user = userEvent.setup();

    render(
      <DebugPanel
        parsedResponse={buildParsedResponse()}
        requestPayload={{ property_id: "demo_property" }}
        rawResponse={{ data: {} }}
        effectiveConfigRows={[]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Ranked Rooms" }));
    expect(screen.getByText("ranked_rooms")).toBeTruthy();
    expect(screen.getByText(/Family Suite/)).toBeTruthy();
  });

  it("can hide raw json controls and tab", () => {
    render(
      <DebugPanel
        parsedResponse={buildParsedResponse()}
        requestPayload={{ property_id: "demo_property" }}
        rawResponse={{ data: {} }}
        effectiveConfigRows={[]}
        showRawJson={false}
      />,
    );

    expect(screen.queryByRole("button", { name: "Copy Req" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Copy Res" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Download" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Raw JSON" })).toBeNull();
  });
});
