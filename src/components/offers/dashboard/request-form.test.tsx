import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RequestForm } from "./request-form";
import { buildOffersGenerateRequest, getDefaultOffersDraft, parseAdvancedJson } from "@/lib/offers-demo";

describe("RequestForm", () => {
  it("includes chat as a selectable channel in Advanced mode", () => {
    const draft = getDefaultOffersDraft();
    const advanced = parseAdvancedJson(draft.extraJson);
    const requestPreview = buildOffersGenerateRequest(draft, advanced.data);

    render(
      <RequestForm
        draft={draft}
        setDraft={vi.fn()}
        isSubmitting={false}
        onSubmit={(event) => event.preventDefault()}
        onReset={vi.fn()}
        formErrors={[]}
        apiError={null}
        isAdvanced
        setIsAdvanced={vi.fn()}
        onApplyPreset={vi.fn()}
        requestPreview={requestPreview}
      />,
    );

    const channel = screen.getByLabelText("Channel") as HTMLSelectElement;
    const values = Array.from(channel.options).map((option) => option.value);

    expect(values).toContain("chat");
  });
});
