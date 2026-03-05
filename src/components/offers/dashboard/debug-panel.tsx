"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ParsedOffersResponse } from "@/lib/offers-demo";
import { safeStringify } from "./utils";

type DebugTab = "summary" | "raw-json" | "ranked-rooms" | "context";

interface DebugPanelProps {
  parsedResponse: ParsedOffersResponse;
  requestPayload: Record<string, unknown> | null;
  rawResponse: unknown;
  effectiveConfigRows: Array<{ label: string; value: string; source: string; impact: string }>;
  showRawJson?: boolean;
}

export function DebugPanel({
  parsedResponse,
  requestPayload,
  rawResponse,
  effectiveConfigRows,
  showRawJson = true,
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
    if (!requestPayload || !rawResponse) {
      return;
    }

    const report = {
      generatedAt: new Date().toISOString(),
      request: requestPayload,
      summary: {
        propertyId: parsedResponse.propertyId,
        currency: parsedResponse.currency,
        priceBasisUsed: parsedResponse.priceBasisUsed,
        hasRecommendation: Boolean(parsedResponse.recommendedRoom),
        rankedRooms: parsedResponse.rankedRooms.length,
      },
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
    { id: "ranked-rooms", label: "Ranked Rooms" },
  ];
  if (showRawJson) {
    tabs.splice(2, 0, { id: "raw-json", label: "Raw JSON" });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base">Audit Trail</CardTitle>
            <CardDescription>Deep dive into the decision context and raw payloads.</CardDescription>
          </div>
          {showRawJson ? (
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
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {copyMessage ? <p className="text-xs font-medium text-emerald-600">{copyMessage}</p> : null}

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
          {activeDebugTab === "summary" ? (
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <StatTile label="Property" value={parsedResponse.propertyId} />
              <StatTile label="Currency" value={parsedResponse.currency} />
              <StatTile label="Price Basis" value={parsedResponse.priceBasisUsed} />
              <StatTile label="Config Version" value={parsedResponse.configVersion} />
              <StatTile label="Recommended Room" value={parsedResponse.recommendedRoom?.roomType || "none"} />
              <StatTile label="Fallback" value={parsedResponse.fallback?.type || "none"} />
            </div>
          ) : null}

          {activeDebugTab === "context" ? (
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
          ) : null}

          {showRawJson && activeDebugTab === "raw-json" ? (
            <div className="grid gap-4 xl:grid-cols-2">
              <JsonPanel title="Request" value={requestPayload} />
              <JsonPanel title="Response" value={rawResponse} />
            </div>
          ) : null}

          {activeDebugTab === "ranked-rooms" ? (
            <JsonPanel title="ranked_rooms" value={parsedResponse.rankedRooms} />
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border p-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="font-medium">{value}</p>
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
