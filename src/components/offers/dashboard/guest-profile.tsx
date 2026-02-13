"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  asRecord, 
  toString, 
  firstNumber,
} from "./utils";

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
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Weights (v/c/e/m/r)</p>
            <p className="font-mono text-sm">
              {`${(firstNumber(weights.value) ?? 0).toFixed(2)} / ${(firstNumber(weights.conversion) ?? 0).toFixed(2)} / ${(firstNumber(weights.experience) ?? 0).toFixed(2)} / ${(firstNumber(weights.margin) ?? 0).toFixed(2)} / ${(firstNumber(weights.risk) ?? 0).toFixed(2)}`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
