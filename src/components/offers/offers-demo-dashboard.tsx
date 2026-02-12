"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  OffersDraft,
  OffersRequestError,
  ParsedOffersResponse,
  buildDeltaLine,
  buildOffersGenerateRequest,
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
import {
  buildEffectiveConfigRows,
  buildFunnelStages,
  buildNotUsedInputs,
  buildTimelineSteps,
  buildTopReasonSummary,
  buildWhyChips,
} from "./dashboard/dashboard-logic";
import { RequestForm } from "./dashboard/request-form";
import { TimelineNav } from "./dashboard/timeline-nav";
import { DecisionSummary } from "./dashboard/decision-summary";
import { CandidateAnalysis } from "./dashboard/candidate-analysis";
import { DebugPanel } from "./dashboard/debug-panel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { safeStringify, asRecord } from "./dashboard/utils";

export function OffersDemoDashboard() {
  const [draft, setDraft] = useState<OffersDraft>(getDefaultOffersDraft());
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [requestPayload, setRequestPayload] = useState<Record<string, unknown> | null>(null);
  const [rawResponse, setRawResponse] = useState<unknown>(null);
  const [parsedResponse, setParsedResponse] = useState<ParsedOffersResponse | null>(null);
  const [expandedCandidate, setExpandedCandidate] = useState<string | null>(null);
  const [selectedFunnelStage, setSelectedFunnelStage] = useState<string>("active-basis");

  const advancedJson = useMemo(() => parseAdvancedJson(draft.extraJson), [draft.extraJson]);
  const requestPreview = useMemo(
    () => buildOffersGenerateRequest(draft, advancedJson.data),
    [advancedJson.data, draft],
  );

  const primaryOffer = parsedResponse ? getPrimaryOffer(parsedResponse.offers) : null;
  const secondaryOffer = parsedResponse ? getSecondaryOffer(parsedResponse.offers) : null;
  const deltaLine = buildDeltaLine(primaryOffer, secondaryOffer);
  const reasonGroups = groupReasonCodes(parsedResponse?.reasonCodes ?? []);

  const resolvedRequest = useMemo(() => asRecord(parsedResponse?.debug.resolvedRequest), [parsedResponse]);
  const profilePreAri = useMemo(() => asRecord(parsedResponse?.debug.profilePreAri), [parsedResponse]);
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
    // @ts-ignore - dynamic candidate object
    const filtered = allCandidates.filter((candidate) => {
      // @ts-ignore - dynamic candidate object
      const offerId = String(candidate.offerId ?? candidate.offer_id ?? "");
      // @ts-ignore - dynamic candidate object
      const candidateId = String(candidate.candidateId ?? candidate.candidate_id ?? "");
      return ids.has(offerId) || ids.has(candidateId);
    });

    return filtered.length > 0 ? filtered : allCandidates;
  }, [activeFunnel, allCandidates]);

  const whyChips = useMemo(
    () => buildWhyChips(profilePreAri, profileFinal, resolvedRequest, draft),
    [draft, profileFinal, profilePreAri, resolvedRequest],
  );
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

      setParsedResponse(parsed);
      setRawResponse(response);
      setSelectedFunnelStage("active-basis");
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
  }

  function scrollToSection(id: string) {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr] xl:grid-cols-[420px_1fr]">
      {/* Sticky Left Column */}
      <div className="h-fit lg:sticky lg:top-6">
        <RequestForm
          draft={draft}
          setDraft={setDraft}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          onReset={() => {
            setDraft(getDefaultOffersDraft());
            setFormErrors([]);
            setApiError(null);
          }}
          formErrors={formErrors}
          apiError={apiError}
          isAdvanced={isAdvanced}
          setIsAdvanced={setIsAdvanced}
          onApplyPreset={applyPreset}
          requestPreview={requestPreview}
        />
      </div>

      {/* Scrollable Right Column */}
      <div className="min-w-0 space-y-6 pb-20">
        <div className="sticky top-0 z-10 -mx-1 bg-background/95 px-1 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/60">
           <TimelineNav steps={timelineSteps} onStepClick={scrollToSection} />
        </div>

        {!parsedResponse ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center text-sm text-muted-foreground">
              <p className="mb-2 text-lg font-semibold text-foreground">Ready to run</p>
              <p>Configure the guest request on the left and click "Run Decision".</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div id="selection" className="scroll-mt-24">
              <DecisionSummary
                topReasons={topReasons}
                primaryOffer={primaryOffer}
                secondaryOffer={secondaryOffer}
                deltaLine={deltaLine}
              />
            </div>

            <div id="profile" className="grid gap-6 xl:grid-cols-2 scroll-mt-24">
               <Card>
                  <CardHeader>
                     <CardTitle className="text-base">Guest Intent Profile</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                     <div className="flex flex-wrap gap-2">
                        {whyChips.map((chip) => (
                           <Badge key={`${chip.label}-${chip.reason}`} variant="secondary" title={chip.reason}>
                              {chip.label}
                           </Badge>
                        ))}
                        {whyChips.length === 0 && <span className="text-xs text-muted-foreground">No profile drivers returned.</span>}
                     </div>
                     <div className="rounded-md border p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ignored Inputs</p>
                        {notUsedInputs.length > 0 ? (
                           <div className="flex flex-wrap gap-2">
                              {notUsedInputs.map((item) => (
                                 <Badge key={item} variant="outline" className="text-[10px] text-muted-foreground">
                                    {item}
                                 </Badge>
                              ))}
                           </div>
                        ) : (
                           <p className="text-xs text-muted-foreground">All provided inputs contributed to this run.</p>
                        )}
                     </div>
                  </CardContent>
               </Card>

               <Card>
                  <CardHeader>
                     <CardTitle className="text-base">Resolved Context</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                     <pre className="max-h-40 overflow-auto rounded-md border bg-muted/30 p-2 font-mono text-[10px]">
                        {safeStringify(parsedResponse.debug.profileFinal)}
                     </pre>
                  </CardContent>
               </Card>
            </div>

            <div id="funnel" className="scroll-mt-24">
              <CandidateAnalysis
                funnelStages={funnelStages}
                selectedFunnelStage={selectedFunnelStage}
                setSelectedFunnelStage={setSelectedFunnelStage}
                displayedCandidates={displayedCandidates}
                expandedCandidate={expandedCandidate}
                setExpandedCandidate={setExpandedCandidate}
                parsedResponse={parsedResponse}
                selectionSummary={selectionSummary}
              />
            </div>

            <div id="debug" className="scroll-mt-24">
              <DebugPanel
                parsedResponse={parsedResponse}
                requestPayload={requestPayload}
                rawResponse={rawResponse}
                allCandidates={allCandidates}
                effectiveConfigRows={effectiveConfigRows}
                reasonGroups={reasonGroups}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
