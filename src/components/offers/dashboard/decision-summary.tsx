"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FallbackGuidance, RecommendedRoom, RecommendedUpsell } from "@/lib/offers-demo";
import { DecisionOfferCard } from "./offer-card";
import { formatMoney } from "./utils";

interface DecisionSummaryProps {
  recommendedRoom: RecommendedRoom | null;
  recommendedOffers: RecommendedUpsell[];
  fallback: FallbackGuidance | null;
}

export function DecisionSummary({ recommendedRoom, recommendedOffers, fallback }: DecisionSummaryProps) {
  if (!recommendedRoom) {
    return (
      <Card className="border-amber-300/70 bg-amber-50 dark:bg-amber-950/20">
        <CardHeader>
          <CardTitle className="text-base">No Recommendation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>{fallback?.reason || "No eligible room remained for this request."}</p>
          {fallback?.type ? (
            <Badge variant="outline" className="font-mono text-[10px]">
              {fallback.type}
            </Badge>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <DecisionOfferCard title="Recommended Room" offer={recommendedRoom} />

      {recommendedOffers.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recommended Upsells</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendedOffers.map((offer) => (
              <div key={`${offer.bundleType}-${offer.label}`} className="rounded-md border p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{offer.label}</p>
                  <Badge variant="secondary">{offer.score === null ? "-" : offer.score.toFixed(2)}</Badge>
                </div>
                {offer.estimatedPriceDelta !== null ? (
                  <p className="text-xs text-muted-foreground">Est. delta: {formatMoney(offer.estimatedPriceDelta)}</p>
                ) : null}
                {offer.reasons.length > 0 ? (
                  <ul className="mt-2 list-disc pl-4 text-xs text-muted-foreground">
                    {offer.reasons.map((reason) => (
                      <li key={`${offer.label}-${reason}`}>{reason}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
