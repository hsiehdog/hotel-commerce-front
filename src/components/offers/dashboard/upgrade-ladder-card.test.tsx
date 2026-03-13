import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { UpgradeLadderCard } from "./upgrade-ladder-card";
import type { UpgradeLadderEntry } from "@/lib/offers-demo";

const baseEntry: UpgradeLadderEntry = {
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
  reasons: ["Only $70 more per night than your current option"],
  benefitSummary: ["Suite-level upgrade with more living space"],
  ladderScore: 0.74,
};

describe("UpgradeLadderCard", () => {
  it("prefers reasons over benefit summary", () => {
    render(<UpgradeLadderCard entries={[baseEntry]} />);

    expect(screen.getByText("A suite layout with extra sleeping space and room to spread out.")).toBeTruthy();
    expect(screen.getByText("Only $70 more per night than your current option")).toBeTruthy();
    expect(screen.queryByText("Suite-level upgrade with more living space")).toBeNull();
    expect(screen.queryByText("Nightly: $299")).toBeNull();
  });

  it("falls back to benefit summary when reasons are empty", () => {
    render(
      <UpgradeLadderCard
        entries={[
          {
            ...baseEntry,
            reasons: [],
          },
        ]}
      />,
    );

    expect(screen.getByText("Suite-level upgrade with more living space")).toBeTruthy();
  });
});
