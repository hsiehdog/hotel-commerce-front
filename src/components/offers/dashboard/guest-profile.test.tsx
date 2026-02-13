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
        profileFinal={{ tripType: "solo", decisionPosture: "price" }}
        profilePreAri={{ tripType: "solo", decisionPosture: "price" }}
      />,
    );

    expect(screen.getByText("User Profile")).toBeTruthy();
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
    expect(screen.getByText(/captures downside signals and is subtracted from total score/i)).toBeTruthy();

    expect(
      screen.getByText(
        "Offer scores are calculated as a weighted blend of value, conversion, experience, and margin proxy, minus a separate risk penalty.",
      ),
    ).toBeTruthy();
  });
});
