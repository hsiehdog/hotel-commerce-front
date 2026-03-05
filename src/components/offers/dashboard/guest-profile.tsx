"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  firstNumber,
} from "./utils";

const WEIGHTS_SUMMARY_TEXT =
  "Offer scores are calculated as a weighted blend of value, conversion, experience, and margin proxy, minus a separate risk penalty.";

function formatPersonaLabel(label: string) {
  return label
    .replace(/_/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

interface GuestProfileProps {
  scoringWeights: Record<string, unknown>;
  personaConfidence: Record<string, number>;
}

export function GuestProfile({
  scoringWeights,
  personaConfidence,
}: GuestProfileProps) {
  const weights = scoringWeights;
  const hasWeights = Object.keys(weights).length > 0;
  const personas = Object.entries(personaConfidence)
    .map(([key, value]) => [key, Number(value)] as const)
    .filter((entry) => Number.isFinite(entry[1]))
    .sort((a, b) => b[1] - a[1]);

  return (
    <Card className="h-full border-muted bg-muted/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">User Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-md border p-3 bg-background/50">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Personas
          </p>
          <div className="space-y-1 text-sm">
            {personas.length > 0 ? (
              personas.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3">
                  <span>{formatPersonaLabel(label)}</span>
                  <span className="font-mono">{(value * 100).toFixed(2)}%</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">No persona confidence returned.</p>
            )}
          </div>
        </div>

        {hasWeights && (
          <div className="rounded-md border p-3 bg-background/50">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Weights
            </p>
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-semibold">Value:</span>{" "}
                <span className="font-mono">{(firstNumber(weights.value) ?? 0).toFixed(2)}</span>{" "}
                <span className="text-muted-foreground">(rewards lower-priced options)</span>
              </p>
              <p>
                <span className="font-semibold">Conversion:</span>{" "}
                <span className="font-mono">{(firstNumber(weights.conversion) ?? 0).toFixed(2)}</span>{" "}
                <span className="text-muted-foreground">(rewards easier booking terms, e.g. refundable, pay at property)</span>
              </p>
              <p>
                <span className="font-semibold">Experience:</span>{" "}
                <span className="font-mono">{(firstNumber(weights.experience) ?? 0).toFixed(2)}</span>{" "}
                <span className="text-muted-foreground">(rewards higher-tier room quality)</span>
              </p>
              <p>
                <span className="font-semibold">Margin:</span>{" "}
                <span className="font-mono">{(firstNumber(weights.margin) ?? 0).toFixed(2)}</span>{" "}
                <span className="text-muted-foreground">(rewards higher-priced options from a revenue perspective)</span>
              </p>
              <p>
                <span className="font-semibold">Risk:</span>{" "}
                <span className="font-mono">{(firstNumber(weights.risk) ?? 0).toFixed(2)}</span>{" "}
                <span className="text-muted-foreground">(captures downside friction e.g. non-refundable, pay now, low inventory)</span>
              </p>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {WEIGHTS_SUMMARY_TEXT}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
