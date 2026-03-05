import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GuestProfile } from "./guest-profile";

describe("GuestProfile", () => {
  it("renders weights with per-line explanations", () => {
    render(
      <GuestProfile
        scoringWeights={{
          value: 0.7816,
          conversion: 0.1954,
          experience: 0.023,
          margin: 0,
          risk: 0.13,
        }}
        personaConfidence={{
          solo_business_traveler: 0.8805,
          weekend_couple: 0.0103,
        }}
      />,
    );

    expect(screen.getByText("User Profile")).toBeTruthy();
    expect(screen.getByText("Personas")).toBeTruthy();
    expect(screen.getByText("Solo Business Traveler")).toBeTruthy();
    expect(screen.getByText("88.05%")).toBeTruthy();
    expect(screen.getByText("Weights")).toBeTruthy();

    expect(screen.getByText(/Value:/)).toBeTruthy();
    expect(screen.getByText(/0.78/)).toBeTruthy();
    expect(screen.getByText(/rewards lower-priced options/i)).toBeTruthy();

    expect(screen.getByText(/Conversion:/)).toBeTruthy();
    expect(screen.getByText(/0.20/)).toBeTruthy();
    expect(screen.getByText(/rewards easier booking terms/i)).toBeTruthy();

    expect(screen.getByText(/Experience:/)).toBeTruthy();
    expect(screen.getByText(/0.02/)).toBeTruthy();
    expect(screen.getByText(/rewards higher-tier room quality/i)).toBeTruthy();

    expect(screen.getByText(/Margin:/)).toBeTruthy();
    expect(screen.getByText(/0.00/)).toBeTruthy();
    expect(screen.getByText(/rewards higher-priced options from a revenue perspective/i)).toBeTruthy();

    expect(screen.getByText(/Risk:/)).toBeTruthy();
    expect(screen.getByText(/0.13/)).toBeTruthy();
    expect(screen.getByText(/captures downside friction e.g. non-refundable, pay now, low inventory/i)).toBeTruthy();

    expect(
      screen.getByText(
        "Offer scores are calculated as a weighted blend of value, conversion, experience, and margin proxy, minus a separate risk penalty.",
      ),
    ).toBeTruthy();
  });
});
