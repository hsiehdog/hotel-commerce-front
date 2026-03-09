import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RequestForm } from "./request-form";
import { buildOfferPropertyOptions } from "@/lib/demo-properties";
import { buildOffersGenerateRequest, getDefaultOffersDraft, parseAdvancedJson } from "@/lib/offers-demo";

const propertyOptions = buildOfferPropertyOptions([
  { propertyId: "inn_at_mount_shasta", name: "Inn At Mount Shasta" },
  { propertyId: "cavallo_point", name: "Cavallo Point" },
]);

describe("RequestForm", () => {
  it("includes chat as a selectable channel in Advanced mode", () => {
    const draft = {
      ...getDefaultOffersDraft(),
      property_id: propertyOptions[0].propertyId,
    };
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
        propertyOptions={propertyOptions}
        propertiesLoading={false}
        propertiesError={null}
      />,
    );

    const channel = screen.getByLabelText("Channel") as HTMLSelectElement;
    const values = Array.from(channel.options).map((option) => option.value);

    expect(values).toContain("chat");
  });

  it("appends demo property after the API properties", () => {
    const draft = {
      ...getDefaultOffersDraft(),
      property_id: propertyOptions[0].propertyId,
    };
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
        isAdvanced={false}
        setIsAdvanced={vi.fn()}
        onApplyPreset={vi.fn()}
        requestPreview={requestPreview}
        propertyOptions={propertyOptions}
        propertiesLoading={false}
        propertiesError={null}
      />,
    );

    const property = screen.getByLabelText("Property") as HTMLSelectElement;
    const values = Array.from(property.options).map((option) => option.value);

    expect(values).toEqual([
      "inn_at_mount_shasta",
      "cavallo_point",
      "demo_property",
    ]);
  });
});
