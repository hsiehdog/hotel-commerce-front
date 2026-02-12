"use client";

import { Dispatch, SetStateAction, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ParsedOffersResponse } from "@/lib/offers-demo";
import { safeStringify, toStringArray } from "./utils";

type DebugTab = "summary" | "reason-codes" | "raw-json" | "all-candidates" | "context";

interface DebugPanelProps {
  parsedResponse: ParsedOffersResponse;
  requestPayload: Record<string, unknown> | null;
  rawResponse: unknown;
  allCandidates: unknown[];
  effectiveConfigRows: Array<{ label: string; value: string; source: string; impact: string }>;
  reasonGroups: {
    filters: string[];
    selection: string[];
    fallback: string[];
    other: string[];
  };
}

export function DebugPanel({
  parsedResponse,
  requestPayload,
  rawResponse,
  allCandidates,
  effectiveConfigRows,
  reasonGroups,
}: DebugPanelProps) {
  const [activeDebugTab, setActiveDebugTab] = useState<DebugTab>("summary");
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  async function copyJson(label: string, value: unknown) {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      setCopyMessage("Clipboard is not available.");
      return;
    }

    await navigator.clipboard.writeText(JSON.stringify(value, null, 2));
    setCopyMessage(`${label} copied.`);
    setTimeout(() => setCopyMessage(null), 3000);
  }

  function downloadDecisionReport() {
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
    setCopyMessage("Report downloaded.");
    setTimeout(() => setCopyMessage(null), 3000);
  }

  const tabs: Array<{ id: DebugTab; label: string }> = [
    { id: "summary", label: "Overview" },
    { id: "context", label: "Context" },
    { id: "reason-codes", label: "Reason Codes" },
    { id: "raw-json", label: "Raw JSON" },
    { id: "all-candidates", label: "All Candidates" },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
             <CardTitle className="text-base">Audit Trail</CardTitle>
             <CardDescription>Deep dive into the decision context and raw payloads.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => requestPayload && copyJson("Request", requestPayload)}
              disabled={!requestPayload}
            >
              Copy Req
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => rawResponse && copyJson("Response", rawResponse)}
              disabled={!rawResponse}
            >
              Copy Res
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadDecisionReport}
              disabled={!rawResponse}
            >
              Download
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {copyMessage && <p className="text-xs text-emerald-600 font-medium">{copyMessage}</p>}

        <div className="flex flex-wrap gap-2 border-b pb-4">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              type="button"
              variant={activeDebugTab === tab.id ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setActiveDebugTab(tab.id)}
              className="h-7 text-xs"
            >
              {tab.label}
            </Button>
          ))}
        </div>

        <div className="min-h-[300px]">
          {activeDebugTab === "summary" && (
            <div className="space-y-4 text-sm">
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded border p-3">
                  <span className="text-xs text-muted-foreground">Property</span>
                  <p className="font-medium">{parsedResponse.propertyId}</p>
                </div>
                <div className="rounded border p-3">
                  <span className="text-xs text-muted-foreground">Currency</span>
                  <p className="font-medium">{parsedResponse.currency}</p>
                </div>
                 <div className="rounded border p-3">
                  <span className="text-xs text-muted-foreground">Price Basis</span>
                  <p className="font-medium">{parsedResponse.priceBasisUsed}</p>
                </div>
                <div className="rounded border p-3">
                  <span className="text-xs text-muted-foreground">Config Version</span>
                  <p className="font-medium">{parsedResponse.configVersion}</p>
                </div>
              </div>
            </div>
          )}

          {activeDebugTab === "context" && (
             <div className="space-y-4">
                <div className="rounded-md border p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Effective Config</p>
                  <div className="space-y-2 text-sm">
                    {effectiveConfigRows.map((row) => (
                      <div key={`${row.label}-${row.source}`} className="flex justify-between border-b border-dashed pb-1 last:border-0">
                        <span>{row.label}</span>
                        <div className="text-right">
                          <span className="font-medium">{row.value}</span>
                          <span className="ml-2 text-xs text-muted-foreground">({row.source})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                   <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Policies</p>
                   {parsedResponse.propertyContext.policies.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                         {parsedResponse.propertyContext.policies.map(p => <Badge key={p} variant="outline">{p}</Badge>)}
                      </div>
                   ) : <p className="text-xs text-muted-foreground">No policies returned.</p>}
                </div>
             </div>
          )}

          {activeDebugTab === "reason-codes" && (
            <div className="space-y-6">
              <ReasonGroup label="Filters" codes={reasonGroups.filters} />
              <ReasonGroup label="Selection" codes={reasonGroups.selection} />
              <ReasonGroup label="Fallback" codes={reasonGroups.fallback} />
              <ReasonGroup label="Other" codes={reasonGroups.other} />
            </div>
          )}

          {activeDebugTab === "raw-json" && (
            <div className="grid gap-4 xl:grid-cols-2">
              <JsonPanel title="Request" value={requestPayload} />
              <JsonPanel title="Response" value={rawResponse} />
            </div>
          )}

          {activeDebugTab === "all-candidates" && (
            <JsonPanel title="debug.topCandidates" value={allCandidates} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ReasonGroup({ label, codes }: { label: string; codes: string[] }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">
        {codes.map((code) => (
          <Badge key={`${label}-${code}`} variant="secondary" className="font-mono text-[10px]">
            {code}
          </Badge>
        ))}
        {codes.length === 0 && <span className="text-xs text-muted-foreground italic">None</span>}
      </div>
    </div>
  );
}

function JsonPanel({ title, value }: { title: string; value: unknown }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <pre className="max-h-[500px] overflow-auto rounded-md border bg-muted/30 p-3 font-mono text-[10px]">
        {safeStringify(value)}
      </pre>
    </div>
  );
}
