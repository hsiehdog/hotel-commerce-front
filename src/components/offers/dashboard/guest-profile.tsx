"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  firstNumber,
} from "./utils";

const WEIGHTS_SUMMARY_TEXT =
  "Offer scores are calculated as a weighted blend of value, conversion, experience, and margin proxy, minus a separate risk penalty.";

const SCORING_WEIGHT_ROWS = [
  {
    key: "value",
    label: "Value",
    description: "rewards lower-priced options",
  },
  {
    key: "conversion",
    label: "Conversion",
    description: "rewards easier booking terms, e.g. refundable, pay at property",
  },
  {
    key: "experience",
    label: "Experience",
    description: "rewards higher-tier room quality",
  },
  {
    key: "margin",
    label: "Margin",
    description: "rewards higher-priced options from a revenue perspective",
  },
  {
    key: "risk",
    label: "Risk",
    description: "captures downside friction e.g. non-refundable, pay now, low inventory",
  },
] as const;

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
  const hasWeights = Object.keys(scoringWeights).length > 0;
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
              {SCORING_WEIGHT_ROWS.map((row) => (
                <p key={row.key}>
                  <span className="font-semibold">{row.label}:</span>{" "}
                  <span className="font-mono">
                    {(firstNumber(scoringWeights[row.key]) ?? 0).toFixed(2)}
                  </span>{" "}
                  <span className="text-muted-foreground">({row.description})</span>
                </p>
              ))}
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
