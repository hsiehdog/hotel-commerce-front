"use client";

import { FormEvent, Fragment, useMemo, useState } from "react";

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

type DebugTab = "summary" | "reason-codes" | "raw-json" | "all-candidates";

type TimelineStep = {
  id: string;
  label: string;
  state: "green" | "yellow" | "red";
  count: number;
};

type FunnelStage = {
  id: string;
  label: string;
  count: number;
  percentOfGenerated: number;
  candidateIds: string[];
};

type EffectiveConfigRow = {
  label: string;
  value: string;
  source: string;
  impact: string;
};

const debugTabs: Array<{ id: DebugTab; label: string }> = [
  { id: "summary", label: "Summary" },
  { id: "reason-codes", label: "Reason Codes" },
  { id: "raw-json", label: "Raw JSON" },
  { id: "all-candidates", label: "All Candidates" },
];

export function OffersDemoDashboard() {
  const [draft, setDraft] = useState<OffersDraft>(getDefaultOffersDraft());
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [requestPayload, setRequestPayload] = useState<Record<string, unknown> | null>(null);
  const [rawResponse, setRawResponse] = useState<unknown>(null);
  const [parsedResponse, setParsedResponse] = useState<ParsedOffersResponse | null>(null);
  const [previousResponse, setPreviousResponse] = useState<ParsedOffersResponse | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [activeDebugTab, setActiveDebugTab] = useState<DebugTab>("summary");
  const [expandedCandidate, setExpandedCandidate] = useState<string | null>(null);
  const [selectedFunnelStage, setSelectedFunnelStage] = useState<string>("active-basis");

  const advancedJson = useMemo(() => parseAdvancedJson(draft.extraJson), [draft.extraJson]);
  const computedNights = useMemo(
    () => getComputedNights(draft.check_in, draft.check_out),
    [draft.check_in, draft.check_out],
  );
  const requestPreview = useMemo(
    () => buildOffersGenerateRequest(draft, advancedJson.data),
    [advancedJson.data, draft],
  );

  const runComparison = useMemo(() => {
    if (!parsedResponse) {
      return null;
    }
    return compareRuns(previousResponse, parsedResponse);
  }, [parsedResponse, previousResponse]);

  const primaryOffer = parsedResponse ? getPrimaryOffer(parsedResponse.offers) : null;
  const secondaryOffer = parsedResponse ? getSecondaryOffer(parsedResponse.offers) : null;
  const deltaLine = buildDeltaLine(primaryOffer, secondaryOffer);
  const reasonGroups = groupReasonCodes(parsedResponse?.reasonCodes ?? []);

  const resolvedRequest = useMemo(() => asRecord(parsedResponse?.debug.resolvedRequest), [parsedResponse]);
  const profileFinal = useMemo(() => asRecord(parsedResponse?.debug.profileFinal), [parsedResponse]);
  const selectionSummary = useMemo(() => asRecord(parsedResponse?.debug.selectionSummary), [parsedResponse]);
  const funnelStages = useMemo(() => buildFunnelStages(parsedResponse), [parsedResponse]);
  const timelineSteps = useMemo(
    () => buildTimelineSteps(parsedResponse, requestPayload, funnelStages, selectionSummary),
    [parsedResponse, requestPayload, funnelStages, selectionSummary],
  );

  const allCandidates = parsedResponse?.debug.topCandidates ?? [];
  const activeFunnel = funnelStages.find((stage) => stage.id === selectedFunnelStage) ?? funnelStages.at(-1);
  const displayedCandidates = useMemo(() => {
    if (!activeFunnel || activeFunnel.candidateIds.length === 0) {
      return allCandidates;
    }

    const ids = new Set(activeFunnel.candidateIds);
    const filtered = allCandidates.filter((candidate) => {
      const offerId = toString(candidate.offerId ?? candidate.offer_id);
      const candidateId = toString(candidate.candidateId ?? candidate.candidate_id);
      return ids.has(offerId) || ids.has(candidateId);
    });

    return filtered.length > 0 ? filtered : allCandidates;
  }, [activeFunnel, allCandidates]);

  const whyChips = useMemo(() => buildWhyChips(profileFinal, resolvedRequest, draft), [draft, profileFinal, resolvedRequest]);
  const topReasons = useMemo(
    () => buildTopReasonSummary(parsedResponse, whyChips, selectionSummary, primaryOffer),
    [parsedResponse, whyChips, selectionSummary, primaryOffer],
  );
  const effectiveConfigRows = useMemo(
    () => buildEffectiveConfigRows(parsedResponse, requestPayload),
    [parsedResponse, requestPayload],
  );
  const notUsedInputs = useMemo(
    () =>
      buildNotUsedInputs(
        requestPayload,
        parsedResponse?.reasonCodes ?? [],
        parsedResponse?.decisionTrace,
      ),
    [requestPayload, parsedResponse],
  );

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
      setCopyMessage(null);
      setSelectedFunnelStage("active-basis");
      setActiveDebugTab("summary");
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

  async function saveScenario() {
    await copyJson("Scenario request", requestPreview);
  }

  async function downloadDecisionReport() {
    if (!parsedResponse || !requestPayload || !rawResponse) {
      return;
    }

    const report = {
      generatedAt: new Date().toISOString(),
      request: requestPayload,
      summary: {
        propertyId: parsedResponse.propertyId,
        currency: parsedResponse.currency,
        priceBasisUsed: parsedResponse.priceBasisUsed,
        reasonCodes: parsedResponse.reasonCodes,
      },
      decisionTrace: parsedResponse.decisionTrace,
      response: rawResponse,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `offer-decision-report-${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setCopyMessage("Decision report downloaded.");
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
    <div className="space-y-6 pb-8">
      <form className="space-y-6" onSubmit={handleSubmit}>
        <Card className="border-muted bg-gradient-to-br from-background via-background to-muted/20">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-2xl">Run Offer Decision</CardTitle>
                <CardDescription>
                  Deterministic audit trail for <code>/offers/generate</code>: inputs, config resolution, filters, scoring,
                  selection, and final guest-facing offers.
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
            <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
              <div className="space-y-6">
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
                      <Button type="button" size="sm" variant="outline" onClick={() => applyQuickDate("this-weekend")}>
                        This weekend
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => applyQuickDate("next-weekend")}>
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
                  <Button type="button" variant="secondary" onClick={saveScenario}>
                    Save Scenario
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveDebugTab("summary")}
                    disabled={!runComparison}
                  >
                    Compare Runs
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDraft(getDefaultOffersDraft());
                      setFormErrors([]);
                      setApiError(null);
                      setCopyMessage(null);
                    }}
                  >
                    Reset request
                  </Button>
                </div>
              </div>

              <Card className="h-fit">
                <CardHeader>
                  <CardTitle className="text-base">Live normalized request preview</CardTitle>
                  <CardDescription>Preview of request payload before submit, including defaults and overrides.</CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="max-h-[720px] overflow-auto rounded-md border bg-muted/30 p-3 font-mono text-xs">
                    {safeStringify(requestPreview)}
                  </pre>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>Decision Timeline</CardTitle>
          <CardDescription>
            1 Input -&gt; 2 Property/Config -&gt; 3 Guest Intent -&gt; 4 Candidate Funnel -&gt; 5 Offer Ranking -&gt; 6 Why These Two -&gt; 7 Final Offers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
            {timelineSteps.map((step) => (
              <div key={step.id} className="rounded-md border p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{step.label}</p>
                  <StatusDot state={step.state} />
                </div>
                <Badge variant="outline">{step.count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {!parsedResponse ? (
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">
            Run a decision to see the explainability panels.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="border-emerald-300/60 bg-emerald-50/40 dark:bg-emerald-950/20">
            <CardHeader>
              <CardTitle className="text-base">Why This Changed</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm md:grid-cols-2">
              <div className="rounded-md border bg-background/70 p-3">
                <p className="text-xs font-medium text-muted-foreground">Primary reason</p>
                <p className="mt-1">{topReasons.primary}</p>
              </div>
              <div className="rounded-md border bg-background/70 p-3">
                <p className="text-xs font-medium text-muted-foreground">Secondary reason</p>
                <p className="mt-1">{topReasons.secondary}</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">1. Input + Resolved Context</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Raw request JSON</p>
                  <pre className="max-h-56 overflow-auto rounded-md border bg-muted/30 p-3 font-mono text-xs">
                    {safeStringify(requestPayload)}
                  </pre>
                </div>
                <div className="rounded-md border p-3">
                  <p>Requested property_id: {toString(requestPayload?.property_id) || "-"}</p>
                  <p>Resolved property_id: {parsedResponse.propertyContext.propertyId || "-"}</p>
                  <p>Currency used: {parsedResponse.propertyContext.currency || parsedResponse.currency || "-"}</p>
                  <p>
                    Presentation emphasis: {getPresentationEmphasis(parsedResponse).join(", ") || "none"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">3. Guest Intent</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="mb-2 text-xs font-medium text-muted-foreground">profilePreAri</p>
                    <pre className="max-h-56 overflow-auto rounded-md border bg-muted/30 p-3 font-mono text-xs">
                      {safeStringify(parsedResponse.debug.profilePreAri)}
                    </pre>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-medium text-muted-foreground">profileFinal</p>
                    <pre className="max-h-56 overflow-auto rounded-md border bg-muted/30 p-3 font-mono text-xs">
                      {safeStringify(parsedResponse.debug.profileFinal)}
                    </pre>
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Why chips</p>
                  <div className="flex flex-wrap gap-2">
                    {whyChips.map((chip) => (
                      <Badge key={`${chip.label}-${chip.reason}`} variant="secondary" title={chip.reason}>
                        {chip.label}
                      </Badge>
                    ))}
                    {whyChips.length === 0 && <span className="text-muted-foreground">No profile drivers returned.</span>}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Not used in this decision</p>
                  {notUsedInputs.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {notUsedInputs.map((item) => (
                        <Badge key={item} variant="outline">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">All provided inputs contributed to this run.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">4. Candidate Funnel</CardTitle>
              <CardDescription>Click a stage to inspect impacted candidate rows.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-8">
                {funnelStages.map((stage) => {
                  const selected = stage.id === (activeFunnel?.id ?? "");
                  return (
                    <button
                      key={stage.id}
                      type="button"
                      onClick={() => setSelectedFunnelStage(stage.id)}
                      className={`rounded-md border p-3 text-left ${selected ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30" : ""}`}
                    >
                      <p className="text-xs text-muted-foreground">{stage.label}</p>
                      <p className="mt-1 text-lg font-semibold">{stage.count}</p>
                      <p className="text-xs text-muted-foreground">{stage.percentOfGenerated}%</p>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Viewing stage: {activeFunnel?.label ?? "Active basis selected"} ({displayedCandidates.length} candidate rows)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">5. Offer Ranking</CardTitle>
              <CardDescription>Candidate-level components, weights, and final score substitution.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1080px] text-left text-sm">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="px-2 py-2">Candidate</th>
                      <th className="px-2 py-2">Room / Plan / Archetype / Price</th>
                      <th className="px-2 py-2">Drivers</th>
                      <th className="px-2 py-2">Value</th>
                      <th className="px-2 py-2">Conversion</th>
                      <th className="px-2 py-2">Experience</th>
                      <th className="px-2 py-2">Margin</th>
                      <th className="px-2 py-2">Risk</th>
                      <th className="px-2 py-2">Weights</th>
                      <th className="px-2 py-2">Final score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedCandidates.map((candidate, index) => {
                      const candidateId = toString(candidate.offerId ?? candidate.offer_id) || `candidate-${index + 1}`;
                      const rowId = `${candidateId}-${index}`;
                      const scoring = getScoringModel(candidate, selectionSummary);
                      const selected = isSelectedCandidate(candidate, parsedResponse);
                      const matchedOffer = findOfferForCandidate(candidate, parsedResponse.offers);
                      const drivers = buildCandidateDrivers(candidate, matchedOffer);

                      return (
                        <Fragment key={rowId}>
                          <tr
                            className={selected ? "bg-emerald-50 dark:bg-emerald-950/30" : ""}
                          >
                            <td className="px-2 py-2">
                              <div className="flex items-center gap-2">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                      setExpandedCandidate((prev) => (prev === rowId ? null : rowId))
                                    }
                                  >
                                  {expandedCandidate === rowId ? "Hide" : "Expand"}
                                </Button>
                                <span>{candidateId}</span>
                                {selected && <Badge>Selected</Badge>}
                              </div>
                            </td>
                            <td className="px-2 py-2">
                              {toString(candidate.roomTypeName ?? candidate.roomType ?? candidate.room_type)} /{" "}
                              {toString(candidate.ratePlanName ?? candidate.ratePlan ?? candidate.rate_plan)} /{" "}
                              {toString(candidate.archetype ?? candidate.offerType ?? candidate.type) || "-"} /{" "}
                              {formatMoney(toNumber(candidate.total ?? candidate.totalPrice ?? candidate.price))}
                            </td>
                            <td className="px-2 py-2">
                              {drivers.length > 0 ? drivers.join(", ") : "-"}
                            </td>
                            <td className="px-2 py-2">{scoreCell(scoring.value)}</td>
                            <td className="px-2 py-2">{scoreCell(scoring.conversion)}</td>
                            <td className="px-2 py-2">{scoreCell(scoring.experience)}</td>
                            <td className="px-2 py-2">{scoreCell(scoring.margin)}</td>
                            <td className="px-2 py-2">{scoreCell(scoring.risk)}</td>
                            <td className="px-2 py-2">
                              {`v:${scoreCell(scoring.weights.value)} c:${scoreCell(scoring.weights.conversion)} e:${scoreCell(scoring.weights.experience)} m:${scoreCell(scoring.weights.margin)} r:${scoreCell(scoring.weights.risk)}`}
                            </td>
                            <td className="px-2 py-2 font-semibold">{scoreCell(scoring.finalScore)}</td>
                          </tr>
                          {expandedCandidate === rowId && (
                            <tr>
                              <td className="px-2 pb-4" colSpan={10}>
                                <div className="rounded-md border bg-muted/20 p-3">
                                  <p className="text-xs font-medium text-muted-foreground">Formula substitution</p>
                                  <p className="mt-1 font-mono text-xs">{scoring.formula}</p>
                                  <pre className="mt-3 max-h-44 overflow-auto rounded-md border bg-background p-2 text-[11px]">
                                    {safeStringify(candidate.scoreComponents ?? candidate.scoringComponents ?? candidate.components ?? null)}
                                  </pre>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                    {displayedCandidates.length === 0 && (
                      <tr>
                        <td className="px-2 py-3 text-muted-foreground" colSpan={10}>
                          No candidate rows returned.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">6. Why These Two Offers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="rounded-md border p-3">
                  <p className="font-medium">Primary selection block</p>
                  <p>
                    Chosen candidate:{" "}
                    {(primaryOffer?.offerId ?? toString(selectionSummary.selectedOfferId)) || "-"}
                  </p>
                  <p>
                    Saver-primary exception check:{" "}
                    {toBooleanText(
                      selectionSummary.saverPrimaryException ??
                        selectionSummary.saver_primary_exception ??
                        selectionSummary.saverPrimaryExceptionApplied ??
                        selectionSummary.saver_primary_exception_applied,
                    )}
                  </p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="font-medium">Secondary selection block</p>
                  <p>Opposite pool size: {toNumericText(selectionSummary.oppositePoolSize ?? selectionSummary.opposite_pool_size)}</p>
                  <p>Price delta % / $: {renderPriceDelta(primaryOffer, secondaryOffer)}</p>
                  <p>Guardrail check (numeric): {renderGuardrailSummary(selectionSummary)}</p>
                  <p>Guardrail pass/fail: {toPassFailText(selectionSummary.guardrailPass ?? selectionSummary.guardrail_pass)}</p>
                  <p>
                    Same-archetype fallback used:{" "}
                    {toBooleanText(
                      selectionSummary.sameArchetypeFallback ??
                        selectionSummary.same_archetype_fallback ??
                        selectionSummary.sameArchetypeFallbackUsed ??
                        selectionSummary.same_archetype_fallback_used,
                    )}
                  </p>
                  <p>Fallback options: alternate dates, text link, waitlist, contact property.</p>
                </div>
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Reason codes</p>
                  <div className="flex flex-wrap gap-2">
                    {parsedResponse.reasonCodes.map((reason) => (
                      <Badge key={reason} variant="outline">
                        {reason}
                      </Badge>
                    ))}
                    {parsedResponse.reasonCodes.length === 0 && <span className="text-muted-foreground">None</span>}
                  </div>
                </div>
                <div className="rounded-md border p-3">
                  <p className="font-medium">Decision trace (plain language)</p>
                  <p className="mt-1">{renderDecisionTrace(parsedResponse.decisionTrace)}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">7. Final Offers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <DecisionOfferCard title="Primary offer" offer={primaryOffer} highlighted />
                  <DecisionOfferCard title="Secondary offer" offer={secondaryOffer} highlighted={false} />
                </div>
                <div className="rounded-md border border-amber-300/70 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                  <p className="font-medium">Tradeoff signal</p>
                  <p>{deltaLine}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">2. Property/Config Context Used</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="rounded-md border p-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Effective value + source + impact</p>
                  <div className="space-y-2">
                    {effectiveConfigRows.map((row) => (
                      <p key={`${row.label}-${row.source}`}>
                        <span className="font-medium">{row.label}</span> = {row.value}{" "}
                        <span className="text-muted-foreground">(source: {row.source}, impact: {row.impact})</span>
                      </p>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Stay policy primitives</p>
                  {parsedResponse.propertyContext.policies.length > 0 ? (
                    <div className="space-y-1">
                      {parsedResponse.propertyContext.policies.map((policy) => (
                        <p key={policy}>{policy}</p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No explicit policy primitives returned.</p>
                  )}
                </div>
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Matched cancellation rule</p>
                  {parsedResponse.offers.map((offer, index) => (
                    <p key={`${offer.offerId}-${offer.room}-${offer.ratePlan}-${index}`}>
                      {offer.offerId}: {offer.cancellationSummary}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">8. Audit Trail</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {debugTabs.map((tab) => (
                    <Button
                      key={tab.id}
                      type="button"
                      variant={activeDebugTab === tab.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveDebugTab(tab.id)}
                    >
                      {tab.label}
                    </Button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => requestPayload && copyJson("Request JSON", requestPayload)}
                    disabled={!requestPayload}
                  >
                    Copy request
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => rawResponse && copyJson("Response JSON", rawResponse)}
                    disabled={!rawResponse}
                  >
                    Copy response
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={downloadDecisionReport}
                    disabled={!rawResponse || !requestPayload || !parsedResponse}
                  >
                    Download decision report
                  </Button>
                </div>

                {copyMessage && <p className="text-xs text-muted-foreground">{copyMessage}</p>}

                {activeDebugTab === "summary" && (
                  <div className="space-y-3 text-sm">
                    <p>Property: {parsedResponse.propertyId}</p>
                    <p>Currency: {parsedResponse.currency}</p>
                    <p>Price basis used: {parsedResponse.priceBasisUsed}</p>
                    <p>Config version: {parsedResponse.configVersion}</p>
                    {runComparison ? (
                      <div className="rounded-md border p-3">
                        <p className="font-medium">Run comparison</p>
                        <p>Added offers: {runComparison.changedOfferIds.added.join(", ") || "none"}</p>
                        <p>Removed offers: {runComparison.changedOfferIds.removed.join(", ") || "none"}</p>
                        {runComparison.summaryChanges.map((change) => (
                          <p key={change}>{change}</p>
                        ))}
                        {runComparison.summaryChanges.length === 0 &&
                          runComparison.changedOfferIds.added.length === 0 &&
                          runComparison.changedOfferIds.removed.length === 0 && <p>No key differences.</p>}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Run a second decision to compare runs.</p>
                    )}
                  </div>
                )}

                {activeDebugTab === "reason-codes" && (
                  <div className="space-y-4">
                    <ReasonGroup label="Filters" codes={reasonGroups.filters} />
                    <ReasonGroup label="Selection" codes={reasonGroups.selection} />
                    <ReasonGroup label="Fallback" codes={reasonGroups.fallback} />
                    <ReasonGroup label="Other" codes={reasonGroups.other} />
                  </div>
                )}

                {activeDebugTab === "raw-json" && (
                  <div className="space-y-3">
                    <JsonPanel title="Request payload sent" value={requestPayload} />
                    <JsonPanel title="Raw response payload" value={rawResponse} />
                  </div>
                )}

                {activeDebugTab === "all-candidates" && (
                  <JsonPanel title="debug.topCandidates" value={allCandidates} />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusDot({ state }: { state: "green" | "yellow" | "red" }) {
  const className =
    state === "green"
      ? "bg-emerald-500"
      : state === "yellow"
        ? "bg-amber-500"
        : "bg-red-500";

  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${className}`} />;
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

  const tier = offer.recommended ? "Recommended" : "Alternative";
  const payment = normalizePayment(offer.paymentSummary);
  const enhancements = toEnhancementLabels(offer.enhancements);
  const disclosures = toStringArray(offer.disclosures);
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
          <Badge className={offer.recommended ? "bg-emerald-600 text-white" : "bg-slate-600 text-white"}>{tier}</Badge>
          <Badge variant="outline">{offer.cancellationSummary}</Badge>
          <Badge variant="secondary">{payment}</Badge>
        </div>
        <div className="rounded-md border bg-muted/20 p-2">
          <p className="mb-1 text-xs font-medium text-muted-foreground">Pricing breakdown equation</p>
          <p>
            {`Base ${formatMoney(offer.pricingBreakdown.subtotal)} + Taxes/Fees ${formatMoney(offer.pricingBreakdown.taxesFees)} + Included fees ${formatMoney(offer.pricingBreakdown.addOns)} = ${formatMoney(totalForDisplay)}`}
          </p>
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
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">Disclosures</p>
          {disclosures.length > 0 ? (
            disclosures.map((line) => <p key={`${offer.offerId}-${line}`}>{line}</p>)
          ) : (
            <p className="text-muted-foreground">No disclosures returned.</p>
          )}
        </div>
      </CardContent>
    </Card>
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

function buildTimelineSteps(
  parsedResponse: ParsedOffersResponse | null,
  requestPayload: Record<string, unknown> | null,
  funnelStages: FunnelStage[],
  selectionSummary: Record<string, unknown>,
): TimelineStep[] {
  const topCandidates = parsedResponse?.debug.topCandidates.length ?? 0;
  const offers = parsedResponse?.offers.length ?? 0;
  const hasSelection = Object.keys(selectionSummary).length > 0 || Boolean(parsedResponse?.decisionTrace);

  return [
    {
      id: "input",
      label: "1 Input",
      state: requestPayload ? "green" : "red",
      count: countObjectKeys(requestPayload),
    },
    {
      id: "property",
      label: "2 Property/Config",
      state: parsedResponse?.propertyContext.propertyId ? "green" : "red",
      count: countObjectKeys(parsedResponse?.propertyContext ?? null),
    },
    {
      id: "profile",
      label: "3 Guest Intent",
      state: parsedResponse?.debug.profileFinal ? "green" : "red",
      count: countObjectKeys(parsedResponse?.debug.profileFinal ?? null),
    },
    {
      id: "funnel",
      label: "4 Candidate Funnel",
      state: topCandidates > 0 ? "green" : parsedResponse ? "yellow" : "red",
      count: funnelStages.at(-1)?.count ?? topCandidates,
    },
    {
      id: "scoring",
      label: "5 Offer Ranking",
      state: topCandidates > 0 ? "green" : parsedResponse ? "yellow" : "red",
      count: topCandidates,
    },
    {
      id: "selection",
      label: "6 Why These Two",
      state: hasSelection ? "green" : parsedResponse ? "yellow" : "red",
      count: parsedResponse?.reasonCodes.length ?? 0,
    },
    {
      id: "final",
      label: "7 Final Offers",
      state: offers > 0 ? "green" : parsedResponse ? "yellow" : "red",
      count: offers,
    },
  ];
}

function buildFunnelStages(parsedResponse: ParsedOffersResponse | null): FunnelStage[] {
  if (!parsedResponse) {
    return [];
  }

  const topCandidates = parsedResponse.debug.topCandidates;
  const fallbackIds = topCandidates
    .map((candidate) => toString(candidate.offerId ?? candidate.offer_id ?? candidate.candidateId ?? candidate.candidate_id))
    .filter(Boolean);

  const selectionSummary = asRecord(parsedResponse.debug.selectionSummary);
  const funnelSource = asRecord(
    selectionSummary.candidateFunnel ??
      selectionSummary.candidate_funnel ??
      parsedResponse.raw.candidateFunnel ??
      parsedResponse.raw.candidate_funnel,
  );

  const generated =
    firstNumber(
      funnelSource.generated,
      selectionSummary.generatedCandidates,
      selectionSummary.generated_candidates,
      parsedResponse.raw.generatedCandidates,
      parsedResponse.raw.generated_candidates,
    ) ?? topCandidates.length;

  const accessibilityRemoved = firstNumber(
    funnelSource.removedAccessibility,
    funnelSource.removed_accessibility,
    funnelSource.accessibility,
    selectionSummary.removedByAccessibility,
    selectionSummary.removed_by_accessibility,
  ) ?? 0;

  const occupancyRemoved = firstNumber(
    funnelSource.removedOccupancy,
    funnelSource.removed_occupancy,
    funnelSource.occupancy,
    selectionSummary.removedByOccupancy,
    selectionSummary.removed_by_occupancy,
  ) ?? 0;

  const restrictionsRemoved = firstNumber(
    funnelSource.removedRestrictions,
    funnelSource.removed_restrictions,
    funnelSource.restrictions,
    selectionSummary.removedByRestrictions,
    selectionSummary.removed_by_restrictions,
  ) ?? 0;

  const currencyRemoved = firstNumber(
    funnelSource.removedCurrency,
    funnelSource.removed_currency,
    funnelSource.currency,
    selectionSummary.removedByCurrency,
    selectionSummary.removed_by_currency,
  ) ?? 0;

  const missingPriceRemoved = firstNumber(
    funnelSource.removedMissingPrice,
    funnelSource.removed_missing_price,
    funnelSource.missingPrice,
    selectionSummary.removedByMissingPrice,
    selectionSummary.removed_by_missing_price,
  ) ?? 0;

  const remaining = Math.max(
    generated - accessibilityRemoved - occupancyRemoved - restrictionsRemoved - currencyRemoved - missingPriceRemoved,
    topCandidates.length,
  );

  const basisBucketCount =
    firstNumber(
      funnelSource.remainingByBasisBucket,
      funnelSource.remaining_by_basis_bucket,
      selectionSummary.remainingByBasisBucket,
      selectionSummary.remaining_by_basis_bucket,
    ) ?? remaining;

  const activeBasis = firstNumber(
    funnelSource.activeBasisSelected,
    funnelSource.active_basis_selected,
    selectionSummary.activeBasisSelected,
    selectionSummary.active_basis_selected,
  ) ?? topCandidates.length;

  return [
    {
      id: "generated",
      label: "Generated",
      count: generated,
      percentOfGenerated: toPercent(generated, generated),
      candidateIds: fallbackIds,
    },
    {
      id: "accessibility",
      label: "Removed by accessibility",
      count: accessibilityRemoved,
      percentOfGenerated: toPercent(accessibilityRemoved, generated),
      candidateIds: [],
    },
    {
      id: "occupancy",
      label: "Removed by occupancy",
      count: occupancyRemoved,
      percentOfGenerated: toPercent(occupancyRemoved, generated),
      candidateIds: [],
    },
    {
      id: "restrictions",
      label: "Removed by restrictions",
      count: restrictionsRemoved,
      percentOfGenerated: toPercent(restrictionsRemoved, generated),
      candidateIds: [],
    },
    {
      id: "currency",
      label: "Removed by currency",
      count: currencyRemoved,
      percentOfGenerated: toPercent(currencyRemoved, generated),
      candidateIds: [],
    },
    {
      id: "missing-price",
      label: "Removed by missing price",
      count: missingPriceRemoved,
      percentOfGenerated: toPercent(missingPriceRemoved, generated),
      candidateIds: [],
    },
    {
      id: "basis-bucket",
      label: "Remaining by basis bucket",
      count: basisBucketCount,
      percentOfGenerated: toPercent(basisBucketCount, generated),
      candidateIds: fallbackIds,
    },
    {
      id: "active-basis",
      label: "Active basis selected",
      count: activeBasis,
      percentOfGenerated: toPercent(activeBasis, generated),
      candidateIds: fallbackIds,
    },
  ];
}

function buildWhyChips(
  profileFinal: Record<string, unknown>,
  resolvedRequest: Record<string, unknown>,
  draft: OffersDraft,
): Array<{ label: string; reason: string }> {
  const chips: Array<{ label: string; reason: string }> = [];

  const leadTimeDays =
    firstNumber(
      profileFinal.leadTimeDays,
      profileFinal.lead_time_days,
      resolvedRequest.leadTimeDays,
      resolvedRequest.lead_time_days,
    ) ?? inferLeadTimeDays(draft.check_in);

  if (leadTimeDays !== null && leadTimeDays <= 1) {
    chips.push({ label: `leadTimeDays=${leadTimeDays} -> short-lead`, reason: "Short lead time" });
  }

  const lateArrival =
    toBoolean(
      profileFinal.late_arrival ??
        profileFinal.lateArrival ??
        resolvedRequest.late_arrival ??
        resolvedRequest.lateArrival,
    ) ?? draft.preferences.late_arrival;
  if (lateArrival) {
    chips.push({ label: "late_arrival=true -> preference boost", reason: "Late arrival preference signal" });
  }

  const roomsAvailable = firstNumber(
    profileFinal.roomsAvailable,
    profileFinal.rooms_available,
    resolvedRequest.roomsAvailable,
    resolvedRequest.rooms_available,
  );
  if (roomsAvailable !== null && roomsAvailable <= 2) {
    chips.push({ label: `roomsAvailable=${roomsAvailable} -> inventoryState=low`, reason: "Low inventory state" });
  }

  return chips;
}

function buildTopReasonSummary(
  parsedResponse: ParsedOffersResponse | null,
  whyChips: Array<{ label: string; reason: string }>,
  selectionSummary: Record<string, unknown>,
  primaryOffer: ParsedOfferCard | null,
): { primary: string; secondary: string } {
  if (!parsedResponse) {
    return {
      primary: "Run a decision to see primary causality.",
      secondary: "Run a decision to see secondary fallback causality.",
    };
  }

  const reasons = parsedResponse.reasonCodes.map((item) => item.toUpperCase());
  const topChip = whyChips[0] ?? null;
  const primaryMode = toString(selectionSummary.primaryArchetype ?? selectionSummary.primary_archetype) || primaryOffer?.type || "PRIMARY";
  const primary = topChip
    ? `${topChip.label} -> ${primaryMode} primary`
    : reasons.find((code) => code.includes("SELECT_PRIMARY")) || "Primary selected based on ranking and guardrails.";

  const noOpposite = reasons.some((code) => code.includes("SECONDARY_POOL_EMPTY_OPPOSITE_ARCHETYPE"));
  const sameFallback = reasons.some((code) => code.includes("SAME_ARCHETYPE_FALLBACK"));
  const secondary = noOpposite || sameFallback
    ? "No opposite-archetype option eligible -> same-archetype fallback (alternate dates/text link/waitlist/contact property)"
    : reasons.find((code) => code.includes("SELECT_SECONDARY")) || "Secondary chosen as best available tradeoff option.";

  return { primary, secondary };
}

function buildEffectiveConfigRows(
  parsedResponse: ParsedOffersResponse | null,
  requestPayload: Record<string, unknown> | null,
): EffectiveConfigRow[] {
  if (!parsedResponse) {
    return [];
  }

  const strategyMode = "balanced";
  const currency = parsedResponse.propertyContext.currency || parsedResponse.currency || "-";

  return [
    {
      label: "strategy_mode",
      value: strategyMode,
      source: "engine default",
      impact: "affects scoring weights",
    },
    {
      label: "currency",
      value: currency,
      source: requestPayload?.currency ? "request" : "property default",
      impact: "affects filtering",
    },
  ];
}

function buildNotUsedInputs(
  requestPayload: Record<string, unknown> | null,
  reasonCodes: string[],
  decisionTrace: unknown,
): string[] {
  if (!requestPayload) {
    return [];
  }

  const reasons = reasonCodes.join(" ").toLowerCase();
  const trace = typeof decisionTrace === "string" ? decisionTrace.toLowerCase() : safeStringify(decisionTrace).toLowerCase();
  const text = `${reasons} ${trace}`;
  const preferences = asRecord(requestPayload.preferences);

  const checks: Array<{ label: string; value: unknown; token: string }> = [
    { label: "pet_friendly", value: requestPayload.pet_friendly, token: "pet" },
    { label: "accessible_room", value: requestPayload.accessible_room, token: "accessible" },
    { label: "needs_two_beds", value: requestPayload.needs_two_beds, token: "two bed" },
    { label: "parking_needed", value: requestPayload.parking_needed, token: "parking" },
    { label: "needs_space", value: preferences.needs_space, token: "space" },
    { label: "late_arrival", value: preferences.late_arrival, token: "late" },
    { label: "budget_cap", value: requestPayload.budget_cap, token: "budget" },
  ];

  return checks
    .filter((item) => {
      const present = item.value !== undefined && item.value !== null && item.value !== "";
      if (!present) {
        return false;
      }
      return !text.includes(item.token);
    })
    .map((item) => `${item.label}=${String(item.value)} (present but not decision-driving in this run)`);
}

function getScoringModel(candidate: Record<string, unknown>, selectionSummary: Record<string, unknown>) {
  const components = asRecord(candidate.scoreComponents ?? candidate.scoringComponents ?? candidate.components);
  const weights = asRecord(candidate.weights ?? selectionSummary.weights ?? selectionSummary.scoreWeights ?? selectionSummary.score_weights);

  const value = firstNumber(components.value, components.valueScore, components.value_score) ?? 0;
  const conversion = firstNumber(components.conversion, components.conversionScore, components.conversion_score) ?? 0;
  const experience = firstNumber(components.experience, components.experienceScore, components.experience_score) ?? 0;
  const margin =
    firstNumber(
      components.margin,
      components.marginScore,
      components.margin_score,
      components.marginProxyScore,
      components.margin_proxy_score,
    ) ?? 0;
  const risk =
    firstNumber(
      components.risk,
      components.riskPenalty,
      components.risk_penalty,
      components.riskScore,
      components.risk_score,
    ) ?? 0;

  const valueW = firstNumber(weights.value, weights.valueWeight, weights.value_weight) ?? 0.3;
  const conversionW = firstNumber(weights.conversion, weights.conversionWeight, weights.conversion_weight) ?? 0.35;
  const experienceW = firstNumber(weights.experience, weights.experienceWeight, weights.experience_weight) ?? 0.1;
  const marginW = firstNumber(weights.margin, weights.marginWeight, weights.margin_weight) ?? 0.1;
  const riskW = firstNumber(weights.risk, weights.riskWeight, weights.risk_weight) ?? 0.15;

  const directFinal = firstNumber(candidate.score, candidate.totalScore, candidate.scoreTotal);
  const computed = value * valueW + conversion * conversionW + experience * experienceW + margin * marginW - risk * riskW;
  const finalScore = directFinal ?? Number(computed.toFixed(2));

  const formula = `${finalScore.toFixed(2)} = ${value.toFixed(2)}*${valueW.toFixed(2)} + ${conversion.toFixed(2)}*${conversionW.toFixed(2)} + ${experience.toFixed(2)}*${experienceW.toFixed(2)} + ${margin.toFixed(2)}*${marginW.toFixed(2)} - ${risk.toFixed(2)}*${riskW.toFixed(2)}`;

  return {
    value,
    conversion,
    experience,
    margin,
    risk,
    finalScore,
    weights: {
      value: valueW,
      conversion: conversionW,
      experience: experienceW,
      margin: marginW,
      risk: riskW,
    },
    formula,
  };
}

function findOfferForCandidate(
  candidate: Record<string, unknown>,
  offers: ParsedOfferCard[],
): ParsedOfferCard | null {
  const byOfferId = toString(candidate.offerId ?? candidate.offer_id);
  if (byOfferId) {
    const matched = offers.find((offer) => offer.offerId === byOfferId);
    if (matched) {
      return matched;
    }
  }

  const roomTypeId = toString(candidate.roomTypeId ?? candidate.room_type_id).toLowerCase();
  const ratePlanId = toString(candidate.ratePlanId ?? candidate.rate_plan_id).toLowerCase();

  return (
    offers.find((offer) => {
      const offerRoomType = toString(
        (offer.raw.roomType as { id?: string } | undefined)?.id ?? offer.raw.room_type_id,
      ).toLowerCase();
      const offerRatePlan = toString(
        (offer.raw.ratePlan as { id?: string } | undefined)?.id ?? offer.raw.rate_plan_id,
      ).toLowerCase();
      return roomTypeId && ratePlanId && roomTypeId === offerRoomType && ratePlanId === offerRatePlan;
    }) ?? null
  );
}

function buildCandidateDrivers(
  candidate: Record<string, unknown>,
  matchedOffer: ParsedOfferCard | null,
): string[] {
  const drivers: string[] = [];
  const riskContributors = toStringArray(
    candidate.riskContributors ?? candidate.risk_contributors ?? candidate.risks ?? [],
  );

  if (matchedOffer?.cancellationSummary.toLowerCase().includes("refund")) {
    drivers.push("+ refundable");
  }
  if (matchedOffer?.paymentSummary.toLowerCase().includes("property")) {
    drivers.push("+ pay at property");
  }
  if (riskContributors.some((item) => item.toLowerCase().includes("low_inventory"))) {
    drivers.push("- low inventory");
  }

  return drivers;
}

function scoreCell(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return "-";
  }
  return value.toFixed(2);
}

function renderGuardrailSummary(selectionSummary: Record<string, unknown>): string {
  const percent = firstNumber(selectionSummary.guardrailPercent, selectionSummary.guardrail_percent);
  const amount = firstNumber(selectionSummary.guardrailAmount, selectionSummary.guardrail_amount);

  if (percent === null && amount === null) {
    return "No explicit guardrail checks returned.";
  }

  const parts = [
    percent === null ? null : `${percent}%`,
    amount === null ? null : `$${amount}`,
  ].filter(Boolean);

  return parts.join(" / ");
}

function renderPriceDelta(primary: ParsedOfferCard | null, secondary: ParsedOfferCard | null): string {
  if (!primary || !secondary || primary.totalPrice === null || secondary.totalPrice === null || primary.totalPrice === 0) {
    return "n/a";
  }

  const amount = secondary.totalPrice - primary.totalPrice;
  const percent = (amount / primary.totalPrice) * 100;
  return `${percent.toFixed(2)}% / ${amount >= 0 ? "+" : "-"}$${Math.abs(amount).toFixed(2)}`;
}

function getPresentationEmphasis(parsedResponse: ParsedOffersResponse): string[] {
  const hints = asRecord(parsedResponse.raw.presentationHints ?? parsedResponse.raw.presentation_hints);
  return toStringArray(hints.emphasis ?? []);
}

function toPassFailText(value: unknown): string {
  const parsed = toBoolean(value);
  if (parsed === null) {
    return "unknown";
  }
  return parsed ? "pass" : "fail";
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
    return "Decision trace returned in structured form; inspect Raw JSON for full details.";
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

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean);
  }
  if (typeof value === "string") {
    return [value];
  }
  return [];
}

function formatMoney(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return "n/a";
  }
  return `$${value.toFixed(2)}`;
}

function countObjectKeys(value: unknown): number {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return 0;
  }
  return Object.keys(value).length;
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

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

function toPercent(value: number, base: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(base) || base <= 0) {
    return 0;
  }
  return Number(((value / base) * 100).toFixed(1));
}

function firstNumber(...values: unknown[]): number | null {
  for (const value of values) {
    const numeric = toNumber(value);
    if (numeric !== null) {
      return numeric;
    }
  }
  return null;
}

function toBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") {
      return true;
    }
    if (value.toLowerCase() === "false") {
      return false;
    }
  }
  return null;
}

function toBooleanText(value: unknown): string {
  const parsed = toBoolean(value);
  if (parsed === null) {
    return "unknown";
  }
  return parsed ? "true" : "false";
}

function toNumericText(value: unknown): string {
  const parsed = toNumber(value);
  return parsed === null ? "unknown" : String(parsed);
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function inferLeadTimeDays(checkIn: string): number | null {
  if (!checkIn) {
    return null;
  }
  const target = new Date(checkIn);
  if (Number.isNaN(target.getTime())) {
    return null;
  }
  const now = new Date();
  const ms = target.getTime() - now.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
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
