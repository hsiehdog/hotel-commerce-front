"use client";

import { ParsedOffersResponse } from "@/lib/offers-demo";
import { DecisionSummary } from "./decision-summary";
import { GuestProfile } from "./guest-profile";
import { CandidateAnalysis } from "./candidate-analysis";
import { DebugPanel } from "./debug-panel";

type DecisionPanelsProps = {
  parsedResponse: ParsedOffersResponse;
  scoringWeights: Record<string, unknown>;
  requestPayload: Record<string, unknown> | null;
  rawResponse: unknown;
  effectiveConfigRows: Array<{ label: string; value: string; source: string; impact: string }>;
  expandedCandidate: string | null;
  setExpandedCandidate: (value: string | null | ((current: string | null) => string | null)) => void;
  showFullScore?: boolean;
  showRawJson?: boolean;
};

export function DecisionPanels({
  parsedResponse,
  scoringWeights,
  requestPayload,
  rawResponse,
  effectiveConfigRows,
  expandedCandidate,
  setExpandedCandidate,
  showFullScore = false,
  showRawJson = true,
}: DecisionPanelsProps) {
  return (
    <div className="min-w-0 space-y-6 pb-20">
      <div id="selection" className="scroll-mt-24">
        <DecisionSummary
          recommendedRoom={parsedResponse.recommendedRoom}
          recommendedOffers={parsedResponse.recommendedOffers}
          fallback={parsedResponse.fallback}
        />
      </div>

      <div id="profile" className="scroll-mt-24">
        <GuestProfile
          scoringWeights={scoringWeights}
          personaConfidence={parsedResponse.personaConfidence}
        />
      </div>

      <div id="funnel" className="scroll-mt-24">
        <CandidateAnalysis
          expandedCandidate={expandedCandidate}
          setExpandedCandidate={setExpandedCandidate}
          parsedResponse={parsedResponse}
          showFullScore={showFullScore}
        />
      </div>

      <div id="debug" className="scroll-mt-24">
        <DebugPanel
          parsedResponse={parsedResponse}
          requestPayload={requestPayload}
          rawResponse={rawResponse}
          effectiveConfigRows={effectiveConfigRows}
          showRawJson={showRawJson}
        />
      </div>
    </div>
  );
}
