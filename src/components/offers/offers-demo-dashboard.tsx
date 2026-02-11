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
  ParsedOffersResponse,
  buildOffersGenerateRequest,
  compareRuns,
  getDefaultOffersDraft,
  parseAdvancedJson,
  parseOffersResponse,
  requestOfferGeneration,
  scenarioPresets,
  validateOffersDraft,
} from "@/lib/offers-demo";

type DashboardTab = "summary" | "trace" | "debug" | "raw";

const tabs: Array<{ id: DashboardTab; label: string }> = [
  { id: "summary", label: "Summary" },
  { id: "trace", label: "Decision Trace" },
  { id: "debug", label: "Debug Deep Dive" },
  { id: "raw", label: "Raw JSON" },
];

export function OffersDemoDashboard() {
  const [draft, setDraft] = useState<OffersDraft>(getDefaultOffersDraft());
  const [activeTab, setActiveTab] = useState<DashboardTab>("summary");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [requestPayload, setRequestPayload] = useState<Record<string, unknown> | null>(null);
  const [rawResponse, setRawResponse] = useState<unknown>(null);
  const [parsedResponse, setParsedResponse] = useState<ParsedOffersResponse | null>(null);
  const [previousResponse, setPreviousResponse] = useState<ParsedOffersResponse | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  const advancedJson = useMemo(() => parseAdvancedJson(draft.extraJson), [draft.extraJson]);
  const runComparison = useMemo(() => {
    if (!parsedResponse) {
      return null;
    }
    return compareRuns(previousResponse, parsedResponse);
  }, [previousResponse, parsedResponse]);

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
      setActiveTab("summary");
    } catch (error) {
      if (error instanceof OffersRequestError) {
        setApiError(
          `Request failed (${error.status}): ${error.message}`,
        );
        setRawResponse(error.body);
      } else {
        setApiError("Network or server error while generating offers.");
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
    setCopyMessage(null);
  }

  async function copyJson(label: string, value: unknown) {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      setCopyMessage("Clipboard is not available in this browser.");
      return;
    }

    await navigator.clipboard.writeText(JSON.stringify(value, null, 2));
    setCopyMessage(`${label} copied to clipboard.`);
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
      <Card className="border-muted bg-gradient-to-br from-background via-background to-muted/30">
        <CardHeader>
          <CardTitle className="text-2xl">Offers Generate Demo Dashboard</CardTitle>
          <CardDescription>
            Explainability-first sandbox for <code>/offers/generate</code>. This page sends a real request and keeps <code>debug=true</code> by default.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
          <p className="text-xs text-muted-foreground">
            Use presets to quickly run Family trip, Late arrival, Compression weekend, Currency mismatch, and Agent upsell flows.
          </p>
        </CardContent>
      </Card>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Input Controls</CardTitle>
            <CardDescription>
              Full request coverage plus advanced JSON for forward compatibility.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Property + Channel</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="property_id">property_id</Label>
                  <Input
                    id="property_id"
                    value={draft.property_id}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, property_id: event.target.value }))
                    }
                    placeholder="hotel-demo-001"
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
                    placeholder="USD"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Basic Trip Inputs</h3>
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
                  <Label htmlFor="nights">nights (optional)</Label>
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
                <div className="space-y-2">
                  <Label htmlFor="stub_scenario">stub_scenario</Label>
                  <Input
                    id="stub_scenario"
                    value={draft.stub_scenario}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, stub_scenario: event.target.value }))
                    }
                    placeholder="family_space_priority"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
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
                </div>
              </div>

              <div className="space-y-2">
                <Label>roomOccupancies</Label>
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
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Advanced Inputs</h3>
              <div className="grid gap-4 md:grid-cols-3">
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
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={draft.debug}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, debug: event.target.checked }))
                    }
                    className="h-4 w-4 rounded border-input"
                  />
                  debug (default true)
                </label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="extra-json">Advanced JSON override (object only)</Label>
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

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Generating..." : "Generate Offers"}
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
                Reset Form
              </Button>
            </div>

            {apiError && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {apiError}
              </div>
            )}
          </CardContent>
        </Card>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>Response Explorer</CardTitle>
          <CardDescription>
            Explain why offers were selected, inspect debug scoring/risk contributors, and copy raw payloads for stakeholder follow-up.
          </CardDescription>
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
            <p className="text-sm text-muted-foreground">
              Submit a request to view summary, decision trace, and debug explainability panels.
            </p>
          ) : (
            <>
              {activeTab === "summary" && (
                <div className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-5">
                    <SummaryMetric label="propertyId" value={parsedResponse.propertyId} />
                    <SummaryMetric label="channel" value={parsedResponse.channel} />
                    <SummaryMetric label="currency" value={parsedResponse.currency} />
                    <SummaryMetric label="priceBasisUsed" value={parsedResponse.priceBasisUsed} />
                    <SummaryMetric label="configVersion" value={parsedResponse.configVersion} />
                  </div>

                  {runComparison && (
                    <Card className="gap-3 py-4">
                      <CardHeader>
                        <CardTitle className="text-base">Compare With Last Run</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <p>
                          Added offers: {runComparison.changedOfferIds.added.join(", ") || "none"}
                        </p>
                        <p>
                          Removed offers: {runComparison.changedOfferIds.removed.join(", ") || "none"}
                        </p>
                        {runComparison.summaryChanges.map((change) => (
                          <p key={change}>{change}</p>
                        ))}
                        {runComparison.summaryChanges.length === 0 &&
                          runComparison.changedOfferIds.added.length === 0 &&
                          runComparison.changedOfferIds.removed.length === 0 && (
                            <p>No key summary differences.</p>
                          )}
                      </CardContent>
                    </Card>
                  )}

                  <div className="grid gap-4 lg:grid-cols-2">
                    {parsedResponse.offers.map((offer) => (
                      <Card key={offer.offerId} className="gap-4 py-4">
                        <CardHeader>
                          <div className="flex items-center justify-between gap-2">
                            <CardTitle className="text-base">{offer.offerId}</CardTitle>
                            <div className="flex gap-2">
                              <Badge variant={offer.recommended ? "default" : "outline"}>
                                {offer.recommended ? "recommended" : "candidate"}
                              </Badge>
                              <Badge variant="secondary">{offer.type}</Badge>
                            </div>
                          </div>
                          <CardDescription>
                            room: {offer.room} | ratePlan: {offer.ratePlan}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <JsonBlock label="policy" value={offer.policy} />
                          <JsonBlock label="pricing" value={offer.pricing} />
                          <JsonBlock label="enhancements" value={offer.enhancements} />
                          <JsonBlock label="disclosures" value={offer.disclosures} />
                          <JsonBlock label="urgency" value={offer.urgency} />
                        </CardContent>
                      </Card>
                    ))}
                    {parsedResponse.offers.length === 0 && (
                      <p className="text-sm text-muted-foreground">No offers returned.</p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "trace" && (
                <div className="space-y-4">
                  <div>
                    <p className="mb-2 text-sm font-medium">reasonCodes</p>
                    <div className="flex flex-wrap gap-2">
                      {parsedResponse.reasonCodes.map((code) => (
                        <Badge key={code} variant="outline">
                          {code}
                        </Badge>
                      ))}
                      {parsedResponse.reasonCodes.length === 0 && (
                        <p className="text-sm text-muted-foreground">No reason codes present.</p>
                      )}
                    </div>
                  </div>
                  <JsonPanel title="decisionTrace" value={parsedResponse.decisionTrace} />
                </div>
              )}

              {activeTab === "debug" && (
                <div className="space-y-4">
                  <JsonPanel title="debug.resolvedRequest" value={parsedResponse.debug.resolvedRequest} />
                  <JsonPanel title="debug.profilePreAri" value={parsedResponse.debug.profilePreAri} />
                  <JsonPanel title="debug.profileFinal" value={parsedResponse.debug.profileFinal} />
                  <JsonPanel title="debug.selectionSummary" value={parsedResponse.debug.selectionSummary} />

                  <Card className="gap-3 py-4">
                    <CardHeader>
                      <CardTitle className="text-base">debug.topCandidates</CardTitle>
                      <CardDescription>
                        Scoring components and risk contributors for explainability.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {parsedResponse.debug.topCandidates.map((candidate, index) => (
                        <div key={`candidate-${index}`} className="rounded-md border p-3 text-sm">
                          <p className="font-medium">
                            {String(candidate.offerId ?? candidate.offer_id ?? `candidate-${index + 1}`)}
                          </p>
                          <p>score: {String(candidate.score ?? candidate.totalScore ?? "-")}</p>
                          <JsonBlock
                            label="score components"
                            value={
                              candidate.scoreComponents ??
                              candidate.scoringComponents ??
                              candidate.components ??
                              null
                            }
                          />
                          <JsonBlock
                            label="risk contributors"
                            value={
                              candidate.riskContributors ??
                              candidate.risk_factors ??
                              candidate.risks ??
                              null
                            }
                          />
                        </div>
                      ))}
                      {parsedResponse.debug.topCandidates.length === 0 && (
                        <p className="text-sm text-muted-foreground">No topCandidates returned.</p>
                      )}
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
                  </div>

                  {copyMessage && <p className="text-xs text-muted-foreground">{copyMessage}</p>}

                  <JsonPanel title="Request payload sent" value={requestPayload} />
                  <JsonPanel title="Raw response received" value={rawResponse} />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value || "-"}</p>
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
        <pre className="max-h-96 overflow-auto rounded-md border bg-muted/30 p-3 font-mono text-xs">
          {safeStringify(value)}
        </pre>
      </CardContent>
    </Card>
  );
}

function JsonBlock({ label, value }: { label: string; value: unknown }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <pre className="mt-1 overflow-auto rounded-md border bg-muted/20 p-2 font-mono text-xs">
        {safeStringify(value)}
      </pre>
    </div>
  );
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value ?? null, null, 2);
  } catch {
    return "Unable to stringify value.";
  }
}
