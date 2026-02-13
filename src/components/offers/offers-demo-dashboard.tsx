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
} from "./dashboard/dashboard-logic";
import { RequestForm } from "./dashboard/request-form";
import { DecisionSummary } from "./dashboard/decision-summary";
import { GuestProfile } from "./dashboard/guest-profile";
import { CandidateAnalysis } from "./dashboard/candidate-analysis";
import { DebugPanel } from "./dashboard/debug-panel";
import { Card, CardContent } from "@/components/ui/card";
import { asRecord } from "./dashboard/utils";

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

  const advancedJson = useMemo(() => parseAdvancedJson(draft.extraJson), [draft.extraJson]);
  const requestPreview = useMemo(
    () => buildOffersGenerateRequest(draft, advancedJson.data),
    [advancedJson.data, draft],
  );

  const primaryOffer = parsedResponse ? getPrimaryOffer(parsedResponse.offers) : null;
  const secondaryOffer = parsedResponse ? getSecondaryOffer(parsedResponse.offers) : null;
  const deltaLine = buildDeltaLine(primaryOffer, secondaryOffer);
  const reasonGroups = groupReasonCodes(parsedResponse?.reasonCodes ?? []);

  const profilePreAri = useMemo(() => asRecord(parsedResponse?.debug.profilePreAri), [parsedResponse]);
  const profileFinal = useMemo(() => asRecord(parsedResponse?.debug.profileFinal), [parsedResponse]);
  const scoringWeights = useMemo(
    () => asRecord(asRecord(parsedResponse?.debug.scoring).weights),
    [parsedResponse],
  );

  const allCandidates = parsedResponse?.debug.topCandidates ?? [];

  const effectiveConfigRows = useMemo(
    () => buildEffectiveConfigRows(parsedResponse, requestPayload),
    [parsedResponse, requestPayload],
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
                primaryOffer={primaryOffer}
                secondaryOffer={secondaryOffer}
                deltaLine={deltaLine}
              />
            </div>

            <div id="profile" className="scroll-mt-24">
               <GuestProfile 
                  scoringWeights={scoringWeights}
                  profileFinal={profileFinal}
                  profilePreAri={profilePreAri}
               />
            </div>

            <div id="funnel" className="scroll-mt-24">
              <CandidateAnalysis
                displayedCandidates={allCandidates}
                scoringWeights={scoringWeights}
                expandedCandidate={expandedCandidate}
                setExpandedCandidate={setExpandedCandidate}
                parsedResponse={parsedResponse}
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
