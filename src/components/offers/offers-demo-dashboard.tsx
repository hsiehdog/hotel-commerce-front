"use client";

import { FormEvent, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  OffersDraft,
  OffersRequestError,
  ParsedOfferCard,
  ParsedOffersResponse,
  buildDeltaLine,
  buildOffersGenerateRequest,
  compareRuns,
  getComputedNights,
  getDefaultOffersDraft,
  getPrimaryOffer,
  getSecondaryOffer,
  groupReasonCodes,
  parseAdvancedJson,
  parseOffersResponse,
  requestOfferGeneration,
  scenarioPresets,
  validateOffersDraft,
} from "@/lib/offers-demo";

type DashboardTab = "why" | "debug" | "raw";

const tabs: Array<{ id: DashboardTab; label: string }> = [
  { id: "why", label: "Why Panel" },
  { id: "debug", label: "Debug Deep Dive" },
  { id: "raw", label: "Raw JSON" },
];

export function OffersDemoDashboard() {
  const [draft, setDraft] = useState<OffersDraft>(getDefaultOffersDraft());
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [activeTab, setActiveTab] = useState<DashboardTab>("why");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [requestPayload, setRequestPayload] = useState<Record<string, unknown> | null>(null);
  const [rawResponse, setRawResponse] = useState<unknown>(null);
  const [parsedResponse, setParsedResponse] = useState<ParsedOffersResponse | null>(null);
  const [previousResponse, setPreviousResponse] = useState<ParsedOffersResponse | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  const advancedJson = useMemo(() => parseAdvancedJson(draft.extraJson), [draft.extraJson]);
  const computedNights = useMemo(
    () => getComputedNights(draft.check_in, draft.check_out),
    [draft.check_in, draft.check_out],
  );
  const runComparison = useMemo(() => {
    if (!parsedResponse) {
      return null;
    }
    return compareRuns(previousResponse, parsedResponse);
  }, [previousResponse, parsedResponse]);

  const primaryOffer = parsedResponse ? getPrimaryOffer(parsedResponse.offers) : null;
  const secondaryOffer = parsedResponse ? getSecondaryOffer(parsedResponse.offers) : null;
  const deltaLine = buildDeltaLine(primaryOffer, secondaryOffer);
  const reasonGroups = groupReasonCodes(parsedResponse?.reasonCodes ?? []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateOffersDraft(draft, advancedJson.error);
    setFormErrors(nextErrors);
    setApiError(null);

    if (nextErrors.length > 0) {
      return;
    }

    const payload = buildOffersGenerateRequest(draft, advancedJson.data);
    setRequestPayload(payload);
    setIsSubmitting(true);

    try {
      const response = await requestOfferGeneration(payload);
      const parsed = parseOffersResponse(response);

      setPreviousResponse(parsedResponse);
      setParsedResponse(parsed);
      setRawResponse(response);
      setActiveTab("why");
    } catch (error) {
      if (error instanceof OffersRequestError) {
        setApiError(`Request failed (${error.status}): ${error.message}`);
        setRawResponse(error.body);
      } else {
        setApiError("Network or server error while running offer decision.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function applyPreset(presetId: string) {
    const preset = scenarioPresets.find((entry) => entry.id === presetId);
    if (!preset) {
      return;
    }

    setDraft((prev) => ({
      ...prev,
      ...preset.values,
      child_ages: preset.values.child_ages ? [...preset.values.child_ages] : prev.child_ages,
      roomOccupancies: preset.values.roomOccupancies
        ? preset.values.roomOccupancies.map((item) => ({ ...item }))
        : prev.roomOccupancies,
      extraJson: preset.extraJson ? JSON.stringify(preset.extraJson, null, 2) : "",
    }));
    setFormErrors([]);
    setApiError(null);
    setCopyMessage(null);
  }

  function applyQuickDate(kind: "tonight" | "tomorrow" | "this-weekend" | "next-weekend") {
    const now = new Date();
    let checkIn = addDays(now, 0);
    let checkOut = addDays(now, 1);

    if (kind === "tomorrow") {
      checkIn = addDays(now, 1);
      checkOut = addDays(now, 2);
    }

    if (kind === "this-weekend") {
      checkIn = getUpcomingWeekendStart(now, 0);
      checkOut = addDays(checkIn, 2);
    }

    if (kind === "next-weekend") {
      checkIn = getUpcomingWeekendStart(now, 7);
      checkOut = addDays(checkIn, 2);
    }

    setDraft((prev) => ({
      ...prev,
      check_in: toIsoDate(checkIn),
      check_out: toIsoDate(checkOut),
    }));
  }

  async function copyJson(label: string, value: unknown) {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      setCopyMessage("Clipboard is not available in this browser.");
      return;
    }

    await navigator.clipboard.writeText(JSON.stringify(value, null, 2));
    setCopyMessage(`${label} copied to clipboard.`);
  }

  async function copyBundle() {
    if (!requestPayload || !rawResponse) {
      return;
    }

    const bundle = {
      timestamp: new Date().toISOString(),
      request: requestPayload,
      response: rawResponse,
    };

    await copyJson("Request/response bundle", bundle);
  }

  function handleChildrenChange(value: string) {
    const parsed = Number(value);
    const nextChildren = Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;

    setDraft((prev) => {
      const nextAges = [...prev.child_ages];
      if (nextAges.length > nextChildren) {
        nextAges.length = nextChildren;
      }
      while (nextAges.length < nextChildren) {
        nextAges.push(0);
      }

      return {
        ...prev,
        children: String(nextChildren),
        child_ages: nextAges,
      };
    });
  }

  function handleRoomsChange(value: string) {
    const parsed = Number(value);
    const nextRooms = Number.isFinite(parsed) ? Math.max(1, Math.floor(parsed)) : 1;

    setDraft((prev) => {
      const nextOccupancies = [...prev.roomOccupancies];
      if (nextOccupancies.length > nextRooms) {
        nextOccupancies.length = nextRooms;
      }
      while (nextOccupancies.length < nextRooms) {
        nextOccupancies.push({ adults: 1, children: 0 });
      }

      return {
        ...prev,
        rooms: String(nextRooms),
        roomOccupancies: nextOccupancies,
      };
    });
  }

  return (
    <div className="space-y-6">
      <form className="space-y-6" onSubmit={handleSubmit}>
        <Card className="border-muted bg-gradient-to-br from-background via-background to-muted/30">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-2xl">Guest request</CardTitle>
                <CardDescription>
                  Business-facing offer decision dashboard for <code>/offers/generate</code>.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={!isAdvanced ? "default" : "outline"}
                  onClick={() => setIsAdvanced(false)}
                >
                  Basic
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={isAdvanced ? "default" : "outline"}
                  onClick={() => setIsAdvanced(true)}
                >
                  Advanced
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <section className="space-y-3">
              <p className="text-sm font-semibold">Preset scenarios</p>
              <div className="flex flex-wrap gap-2">
                {scenarioPresets.map((preset) => (
                  <Button
                    key={preset.id}
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => applyPreset(preset.id)}
                    title={preset.description}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Guest request details</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="property_id">property_id</Label>
                  <Input
                    id="property_id"
                    value={draft.property_id}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, property_id: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="channel">channel</Label>
                  <select
                    id="channel"
                    value={draft.channel}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        channel: event.target.value as OffersDraft["channel"],
                      }))
                    }
                    className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:ring-[3px]"
                  >
                    <option value="web">web</option>
                    <option value="voice">voice</option>
                    <option value="agent">agent</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">currency</Label>
                  <Input
                    id="currency"
                    value={draft.currency}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, currency: event.target.value.toUpperCase() }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Quick stay dates</p>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => applyQuickDate("tonight")}>
                    Tonight
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => applyQuickDate("tomorrow")}>
                    Tomorrow
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => applyQuickDate("this-weekend")}
                  >
                    This weekend
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => applyQuickDate("next-weekend")}
                  >
                    Next weekend
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="check_in">check_in</Label>
                  <Input
                    id="check_in"
                    type="date"
                    value={draft.check_in}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, check_in: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="check_out">check_out</Label>
                  <Input
                    id="check_out"
                    type="date"
                    value={draft.check_out}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, check_out: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rooms">rooms</Label>
                  <Input
                    id="rooms"
                    type="number"
                    min={1}
                    value={draft.rooms}
                    onChange={(event) => handleRoomsChange(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adults">adults</Label>
                  <Input
                    id="adults"
                    type="number"
                    min={1}
                    value={draft.adults}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, adults: event.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="children">children</Label>
                  <Input
                    id="children"
                    type="number"
                    min={0}
                    value={draft.children}
                    onChange={(event) => handleChildrenChange(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nights">nights override (optional)</Label>
                  <Input
                    id="nights"
                    type="number"
                    min={1}
                    value={draft.nights}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, nights: event.target.value }))
                    }
                    placeholder="auto"
                  />
                </div>
                <div className="rounded-md border bg-muted/20 p-3">
                  <p className="text-xs text-muted-foreground">Computed nights</p>
                  <p className="mt-1 font-medium">
                    {computedNights === null ? "Select valid dates" : `${computedNights} night(s)`}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>child_ages</Label>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {draft.child_ages.map((age, index) => (
                    <Input
                      key={`child-age-${index}`}
                      type="number"
                      min={0}
                      value={age}
                      onChange={(event) => {
                        const nextAge = Number(event.target.value || 0);
                        setDraft((prev) => {
                          const nextAges = [...prev.child_ages];
                          nextAges[index] = Number.isFinite(nextAge) ? nextAge : 0;
                          return {
                            ...prev,
                            child_ages: nextAges,
                          };
                        });
                      }}
                    />
                  ))}
                  {draft.child_ages.length === 0 && (
                    <p className="text-xs text-muted-foreground">No children entered.</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Guests per room</Label>
                <div className="space-y-2">
                  {draft.roomOccupancies.map((occupancy, index) => (
                    <div key={`occupancy-${index}`} className="grid gap-2 sm:grid-cols-3">
                      <Input value={`Room ${index + 1}`} readOnly />
                      <Input
                        type="number"
                        min={1}
                        value={occupancy.adults}
                        onChange={(event) => {
                          const nextAdults = Number(event.target.value || 1);
                          setDraft((prev) => {
                            const next = [...prev.roomOccupancies];
                            next[index] = {
                              ...next[index],
                              adults: Number.isFinite(nextAdults) ? Math.max(1, nextAdults) : 1,
                            };
                            return {
                              ...prev,
                              roomOccupancies: next,
                            };
                          });
                        }}
                      />
                      <Input
                        type="number"
                        min={0}
                        value={occupancy.children}
                        onChange={(event) => {
                          const nextChildren = Number(event.target.value || 0);
                          setDraft((prev) => {
                            const next = [...prev.roomOccupancies];
                            next[index] = {
                              ...next[index],
                              children: Number.isFinite(nextChildren)
                                ? Math.max(0, nextChildren)
                                : 0,
                            };
                            return {
                              ...prev,
                              roomOccupancies: next,
                            };
                          });
                        }}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Columns are room label, adults, then children.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={draft.preferences.needs_space}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        preferences: {
                          ...prev.preferences,
                          needs_space: event.target.checked,
                        },
                      }))
                    }
                    className="h-4 w-4 rounded border-input"
                  />
                  preferences.needs_space
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={draft.preferences.late_arrival}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        preferences: {
                          ...prev.preferences,
                          late_arrival: event.target.checked,
                        },
                      }))
                    }
                    className="h-4 w-4 rounded border-input"
                  />
                  preferences.late_arrival
                </label>
              </div>

              <div className="space-y-3 rounded-md border bg-muted/10 p-4">
                <p className="text-sm font-semibold">Guest constraints</p>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={draft.pet_friendly}
                      onChange={(event) =>
                        setDraft((prev) => ({ ...prev, pet_friendly: event.target.checked }))
                      }
                      className="h-4 w-4 rounded border-input"
                    />
                    pet_friendly
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={draft.accessible_room}
                      onChange={(event) =>
                        setDraft((prev) => ({ ...prev, accessible_room: event.target.checked }))
                      }
                      className="h-4 w-4 rounded border-input"
                    />
                    accessible_room
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={draft.needs_two_beds}
                      onChange={(event) =>
                        setDraft((prev) => ({ ...prev, needs_two_beds: event.target.checked }))
                      }
                      className="h-4 w-4 rounded border-input"
                    />
                    needs_two_beds
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={draft.parking_needed}
                      onChange={(event) =>
                        setDraft((prev) => ({ ...prev, parking_needed: event.target.checked }))
                      }
                      className="h-4 w-4 rounded border-input"
                    />
                    parking_needed
                  </label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget_cap">budget_cap (optional)</Label>
                  <Input
                    id="budget_cap"
                    type="number"
                    min={1}
                    value={draft.budget_cap}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, budget_cap: event.target.value }))
                    }
                    placeholder="400"
                  />
                </div>
              </div>
            </section>

            {isAdvanced && (
              <section className="space-y-3 rounded-md border bg-muted/10 p-4">
                <h3 className="text-sm font-semibold">Advanced controls</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="stub_scenario">Demo scenario (advanced)</Label>
                    <Input
                      id="stub_scenario"
                      value={draft.stub_scenario}
                      onChange={(event) =>
                        setDraft((prev) => ({ ...prev, stub_scenario: event.target.value }))
                      }
                      placeholder="price_sensitive_guest"
                    />
                  </div>
                  <label className="flex items-center gap-2 self-end text-sm">
                    <input
                      type="checkbox"
                      checked={draft.debug}
                      onChange={(event) =>
                        setDraft((prev) => ({ ...prev, debug: event.target.checked }))
                      }
                      className="h-4 w-4 rounded border-input"
                    />
                    Explainability mode
                  </label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="extra-json">Raw JSON override (object)</Label>
                  <Textarea
                    id="extra-json"
                    value={draft.extraJson}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, extraJson: event.target.value }))
                    }
                    placeholder='{"market_segment":"corporate","force_fallback":true}'
                    className="min-h-32 font-mono text-xs"
                  />
                </div>
              </section>
            )}

            {formErrors.length > 0 && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                <p className="font-medium">Please fix the following before submit:</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {formErrors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {apiError && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {apiError}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Running..." : "Run Offer Decision"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDraft(getDefaultOffersDraft());
                  setFormErrors([]);
                  setApiError(null);
                }}
              >
                Reset request
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>Offer decision</CardTitle>
          <CardDescription>
            Primary recommendation first, tradeoff option second, with clear risk and flexibility signals.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!parsedResponse ? (
            <p className="text-sm text-muted-foreground">
              Run an offer decision to see recommendation, tradeoff, and explainability details.
            </p>
          ) : (
            <>
              <div className="grid gap-4 lg:grid-cols-2">
                <DecisionOfferCard title="Primary recommendation" offer={primaryOffer} highlighted />
                <DecisionOfferCard title="Secondary option" offer={secondaryOffer} highlighted={false} />
              </div>

              <div className="rounded-md border border-amber-300/70 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                <p className="font-medium">Tradeoff signal</p>
                <p>{deltaLine}</p>
              </div>

              {runComparison && (
                <div className="rounded-md border p-3 text-sm">
                  <p className="font-medium">Compared with previous run</p>
                  <p>Added offers: {runComparison.changedOfferIds.added.join(", ") || "none"}</p>
                  <p>Removed offers: {runComparison.changedOfferIds.removed.join(", ") || "none"}</p>
                  {runComparison.summaryChanges.map((change) => (
                    <p key={change}>{change}</p>
                  ))}
                  {runComparison.summaryChanges.length === 0 &&
                    runComparison.changedOfferIds.added.length === 0 &&
                    runComparison.changedOfferIds.removed.length === 0 && <p>No key differences.</p>}
                </div>
              )}

              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="gap-3 py-4">
                  <CardHeader>
                    <CardTitle className="text-base">Why this was selected</CardTitle>
                    <CardDescription>
                      Human-readable decision path, reason groups, and matched cancellation summary.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <p>{renderDecisionTrace(parsedResponse.decisionTrace)}</p>
                    <ReasonGroup label="Filters applied" codes={reasonGroups.filters} />
                    <ReasonGroup label="Selection decisions" codes={reasonGroups.selection} />
                    <ReasonGroup label="Fallback decisions" codes={reasonGroups.fallback} />
                    <ReasonGroup label="Other reasons" codes={reasonGroups.other} />

                    <div>
                      <p className="mb-2 text-xs font-medium text-muted-foreground">Matched cancellation policy summary</p>
                      {parsedResponse.offers.map((offer, index) => (
                        <p key={`policy-${offer.offerId}-${offer.ratePlan}-${index}`}>
                          {offer.offerId}: {offer.cancellationSummary}
                        </p>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="gap-3 py-4">
                  <CardHeader>
                    <CardTitle className="text-base">Property context</CardTitle>
                    <CardDescription>
                      Resolved property configuration and fallback capabilities used during decisioning.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>Resolved propertyId: {parsedResponse.propertyContext.propertyId}</p>
                    <p>Currency: {parsedResponse.propertyContext.currency}</p>
                    <p>Strategy mode: {parsedResponse.propertyContext.strategyMode}</p>
                    <p>Timezone: {parsedResponse.propertyContext.timezone}</p>
                    <p className="pt-2 text-xs font-medium text-muted-foreground">Stay policies/disclosures</p>
                    {parsedResponse.propertyContext.policies.length > 0 ? (
                      parsedResponse.propertyContext.policies.map((policy) => (
                        <p key={policy}>{policy}</p>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No explicit policies returned.</p>
                    )}
                    <p className="pt-2 text-xs font-medium text-muted-foreground">Capability flags</p>
                    {parsedResponse.propertyContext.capabilities.length > 0 ? (
                      parsedResponse.propertyContext.capabilities.map((capability) => (
                        <p key={capability}>{capability}</p>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No capability flags returned.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Decision details</CardTitle>
          <CardDescription>Use tabs for explainability drill-down and stakeholder-ready raw data exports.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                type="button"
                variant={activeTab === tab.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          {!parsedResponse ? (
            <p className="text-sm text-muted-foreground">No decision data yet.</p>
          ) : (
            <>
              {activeTab === "why" && (
                <div className="space-y-3">
                  <JsonPanel title="Decision trace (raw)" value={parsedResponse.decisionTrace} />
                  <JsonPanel title="Selection summary (debug)" value={parsedResponse.debug.selectionSummary} />
                </div>
              )}

              {activeTab === "debug" && (
                <div className="space-y-4">
                  <JsonPanel title="debug.resolvedRequest" value={parsedResponse.debug.resolvedRequest} />
                  <JsonPanel title="debug.profilePreAri" value={parsedResponse.debug.profilePreAri} />
                  <JsonPanel title="debug.profileFinal" value={parsedResponse.debug.profileFinal} />

                  <Card className="gap-3 py-4">
                    <CardHeader>
                      <CardTitle className="text-base">Top candidates table</CardTitle>
                      <CardDescription>
                        Candidate room context, pricing basis, risk contributors, and score composition.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] text-left text-sm">
                          <thead>
                            <tr className="border-b text-xs text-muted-foreground">
                              <th className="px-2 py-2">Candidate</th>
                              <th className="px-2 py-2">Room</th>
                              <th className="px-2 py-2">Description</th>
                              <th className="px-2 py-2">Features</th>
                              <th className="px-2 py-2">Price</th>
                              <th className="px-2 py-2">Risk</th>
                              <th className="px-2 py-2">Score</th>
                            </tr>
                          </thead>
                          <tbody>
                            {parsedResponse.debug.topCandidates.map((candidate, index) => {
                              const candidateId = toString(
                                candidate.offerId ?? candidate.offer_id,
                              );
                              const candidateLabel = candidateId || String(index + 1);
                              const selected = isSelectedCandidate(candidate, parsedResponse);

                              return (
                                <tr
                                  key={`candidate-${candidateLabel}-${index}`}
                                  className={selected ? "bg-emerald-100/50 dark:bg-emerald-900/30" : ""}
                                >
                                  <td className="px-2 py-2">
                                    <div className="flex items-center gap-2">
                                      <span>{candidateLabel}</span>
                                      {selected && <Badge>Selected</Badge>}
                                    </div>
                                  </td>
                                  <td className="px-2 py-2">
                                    {String(candidate.roomTypeName ?? candidate.roomType ?? "-")}
                                  </td>
                                  <td className="px-2 py-2">
                                    {String(candidate.roomTypeDescription ?? "-")}
                                  </td>
                                  <td className="px-2 py-2">
                                    <CandidateChips value={candidate.features ?? candidate.featureFlags ?? []} />
                                  </td>
                                  <td className="px-2 py-2">
                                    {String(candidate.priceBasis ?? candidate.price_basis ?? candidate.basis ?? "-")} / {String(candidate.total ?? candidate.totalPrice ?? "-")}
                                  </td>
                                  <td className="px-2 py-2">
                                    <CandidateChips
                                      value={
                                        candidate.riskContributors ??
                                        candidate.risk_factors ??
                                        candidate.risks ??
                                        []
                                      }
                                    />
                                  </td>
                                  <td className="px-2 py-2">
                                    <div>{String(candidate.score ?? candidate.totalScore ?? candidate.scoreTotal ?? "-")}</div>
                                    <pre className="mt-1 whitespace-pre-wrap rounded border bg-muted/20 p-1 font-mono text-[10px]">
                                      {safeStringify(
                                        candidate.scoreComponents ??
                                          candidate.scoringComponents ??
                                          candidate.components ??
                                          null,
                                      )}
                                    </pre>
                                  </td>
                                </tr>
                              );
                            })}
                            {parsedResponse.debug.topCandidates.length === 0 && (
                              <tr>
                                <td className="px-2 py-3 text-muted-foreground" colSpan={7}>
                                  No topCandidates returned.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === "raw" && (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => requestPayload && copyJson("Request JSON", requestPayload)}
                      disabled={!requestPayload}
                    >
                      Copy request JSON
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => rawResponse && copyJson("Response JSON", rawResponse)}
                      disabled={!rawResponse}
                    >
                      Copy response JSON
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={copyBundle}
                      disabled={!requestPayload || !rawResponse}
                    >
                      Copy bundle
                    </Button>
                  </div>

                  {copyMessage && <p className="text-xs text-muted-foreground">{copyMessage}</p>}

                  <JsonPanel title="Request payload sent" value={requestPayload} />
                  <JsonPanel title="Raw response payload" value={rawResponse} />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DecisionOfferCard({
  title,
  offer,
  highlighted,
}: {
  title: string;
  offer: ParsedOfferCard | null;
  highlighted: boolean;
}) {
  if (!offer) {
    return (
      <Card className="gap-3 py-4">
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No offer available.</p>
        </CardContent>
      </Card>
    );
  }

  const tier = offer.recommended ? "SAFE" : "SAVER";
  const flexibility = offer.cancellationSummary.toLowerCase().includes("non")
    ? "Non-refundable"
    : "Refundable";
  const payment = normalizePayment(offer.paymentSummary);
  const enhancements = toEnhancementLabels(offer.enhancements);
  const totalForDisplay = offer.pricingBreakdown.total ?? offer.totalPrice;

  return (
    <Card className={highlighted ? "border-emerald-300/70 bg-emerald-50/60 dark:bg-emerald-950/30" : ""}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>
          {offer.offerId} | {offer.room} | {offer.ratePlan}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex flex-wrap gap-2">
          <Badge className={tier === "SAFE" ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"}>{tier}</Badge>
          <Badge variant="outline">{flexibility}</Badge>
          <Badge variant="secondary">{payment}</Badge>
        </div>
        <p>Risk & flexibility: {offer.cancellationSummary}</p>
        <p>Fallback action: {safeStringify(offer.urgency)}</p>
        <div className="rounded-md border bg-muted/20 p-2">
          <p className="mb-1 text-xs font-medium text-muted-foreground">Pricing breakdown</p>
          <p>Subtotal: {formatMoney(offer.pricingBreakdown.subtotal)}</p>
          <p>Taxes/fees: {formatMoney(offer.pricingBreakdown.taxesFees)}</p>
          <p>Add-ons: {formatMoney(offer.pricingBreakdown.addOns)}</p>
          <p className="font-medium">Total: {formatMoney(totalForDisplay)}</p>
        </div>
        {enhancements.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">Enhancements</p>
            <div className="flex flex-wrap gap-1">
              {enhancements.map((enhancement) => (
                <Badge key={`${offer.offerId}-${enhancement}`} variant="outline">
                  {enhancement}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ReasonGroup({ label, codes }: { label: string; codes: string[] }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">
        {codes.map((code) => (
          <Badge key={`${label}-${code}`} variant="outline">
            {code}
          </Badge>
        ))}
        {codes.length === 0 && <span className="text-muted-foreground">None</span>}
      </div>
    </div>
  );
}

function CandidateChips({ value }: { value: unknown }) {
  const list = Array.isArray(value)
    ? value.map((item) => String(item)).filter(Boolean)
    : typeof value === "string"
      ? [value]
      : [];

  if (list.length === 0) {
    return <span className="text-muted-foreground">-</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {list.map((item) => (
        <Badge key={item} variant="outline">
          {item}
        </Badge>
      ))}
    </div>
  );
}

function JsonPanel({ title, value }: { title: string; value: unknown }) {
  return (
    <Card className="gap-3 py-4">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="max-h-80 overflow-auto rounded-md border bg-muted/30 p-3 font-mono text-xs">
          {safeStringify(value)}
        </pre>
      </CardContent>
    </Card>
  );
}

function renderDecisionTrace(decisionTrace: unknown): string {
  if (typeof decisionTrace === "string" && decisionTrace.trim()) {
    return decisionTrace;
  }

  if (Array.isArray(decisionTrace)) {
    const joined = decisionTrace.map((entry) => String(entry)).filter(Boolean).join(" -> ");
    return joined || "No decision trace details returned.";
  }

  if (decisionTrace && typeof decisionTrace === "object") {
    return "Decision trace available in structured form. Open tabs below for full detail.";
  }

  return "No decision trace details returned.";
}

function isSelectedCandidate(
  candidate: Record<string, unknown>,
  parsedResponse: ParsedOffersResponse,
): boolean {
  const recommendedOffer = parsedResponse.offers.find((offer) => offer.recommended);
  if (!recommendedOffer) {
    return false;
  }

  const candidateOfferId = toString(candidate.offerId ?? candidate.offer_id);
  if (candidateOfferId && candidateOfferId === recommendedOffer.offerId) {
    return true;
  }

  const candidateRoomTypeId = toString(candidate.roomTypeId ?? candidate.room_type_id);
  const candidateRatePlanId = toString(candidate.ratePlanId ?? candidate.rate_plan_id);
  const offerRoomTypeId = toString(
    (recommendedOffer.raw.roomType as { id?: string } | undefined)?.id ??
      recommendedOffer.raw.room_type_id,
  );
  const offerRatePlanId = toString(
    (recommendedOffer.raw.ratePlan as { id?: string } | undefined)?.id ??
      recommendedOffer.raw.rate_plan_id,
  );

  return Boolean(
    candidateRoomTypeId &&
      candidateRatePlanId &&
      offerRoomTypeId &&
      offerRatePlanId &&
      candidateRoomTypeId === offerRoomTypeId &&
      candidateRatePlanId === offerRatePlanId,
  );
}

function normalizePayment(value: string): string {
  const lower = value.toLowerCase();
  if (lower.includes("property") || lower.includes("hotel")) {
    return "Pay at property";
  }
  if (lower.includes("now") || lower.includes("prepay")) {
    return "Pay now";
  }
  return value;
}

function toString(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number") {
    return String(value);
  }
  return "";
}

function toEnhancementLabels(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === "string") {
        return item;
      }
      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        if (typeof record.name === "string" && record.name.trim()) {
          return record.name;
        }
        if (typeof record.id === "string" && record.id.trim()) {
          return record.id;
        }
      }
      return "";
    })
    .filter(Boolean);
}

function formatMoney(value: number | null): string {
  if (value === null) {
    return "n/a";
  }
  return `$${value.toFixed(2)}`;
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value ?? null, null, 2);
  } catch {
    return "Unable to stringify value.";
  }
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function getUpcomingWeekendStart(baseDate: Date, minOffsetDays: number): Date {
  const start = addDays(baseDate, minOffsetDays);
  const day = start.getDay();
  const distanceToFriday = (5 - day + 7) % 7;
  return addDays(start, distanceToFriday);
}
