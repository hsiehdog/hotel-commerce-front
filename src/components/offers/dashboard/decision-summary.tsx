"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ParsedOfferCard } from "@/lib/offers-demo";
import { DecisionOfferCard } from "./offer-card";

interface DecisionSummaryProps {
  primaryOffer: ParsedOfferCard | null;
  secondaryOffer: ParsedOfferCard | null;
  deltaLine: string;
}

export function DecisionSummary({ primaryOffer, secondaryOffer, deltaLine }: DecisionSummaryProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <DecisionOfferCard title="Primary Offer" offer={primaryOffer} highlighted />
        <DecisionOfferCard title="Secondary Offer" offer={secondaryOffer} highlighted={false} />
      </div>

      <div className="rounded-md border border-amber-300/70 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm dark:bg-amber-950/40 dark:text-amber-100">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-amber-400 bg-amber-100 text-amber-800">Tradeoff Signal</Badge>
          <span className="font-medium">{deltaLine}</span>
        </div>
      </div>
    </div>
  );
}
