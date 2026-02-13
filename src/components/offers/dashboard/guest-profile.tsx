"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  asRecord, 
  toString, 
  firstNumber,
} from "./utils";

const WEIGHTS_SUMMARY_TEXT =
  "Offer scores are calculated as a weighted blend of value, conversion, experience, and margin proxy, minus a separate risk penalty.";

interface GuestProfileProps {
  scoringWeights: Record<string, unknown>;
  profileFinal: Record<string, unknown>;
  profilePreAri: Record<string, unknown>;
}

export function GuestProfile({
  scoringWeights,
  profileFinal,
  profilePreAri,
}: GuestProfileProps) {
  const final = asRecord(profileFinal);
  const pre = asRecord(profilePreAri);
  const weights = asRecord(scoringWeights);

  const tripType = toString(pre.tripType ?? pre.trip_type ?? final.tripType ?? final.trip_type) || "unknown";
  const posture =
    toString(pre.decisionPosture ?? pre.decision_posture ?? final.decisionPosture ?? final.decision_posture) ||
    "balanced";
  const hasWeights = Object.keys(weights).length > 0;

  return (
    <Card className="h-full border-muted bg-muted/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">User Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col border-l-2 border-primary/10 pl-3">
            <span className="text-[10px] font-medium text-muted-foreground">Trip Type</span>
            <span className="text-sm font-semibold capitalize">{String(tripType)}</span>
          </div>
          <div className="flex flex-col border-l-2 border-primary/10 pl-3">
            <span className="text-[10px] font-medium text-muted-foreground">Posture</span>
            <span className="text-sm font-semibold capitalize">{String(posture)}</span>
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
