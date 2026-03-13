"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RecommendedRoom } from "@/lib/offers-demo";
import { formatMoney } from "./utils";

type DecisionOfferCardProps = {
  title: string;
  offer: RecommendedRoom | null;
};

export function DecisionOfferCard({ title, offer }: DecisionOfferCardProps) {
  if (!offer) {
    return (
      <Card className="gap-3 py-4">
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No recommendation returned.</p>
        </CardContent>
      </Card>
    );
  }

  const description = title === offer.roomType ? offer.ratePlan : `${offer.roomType} | ${offer.ratePlan}`;

  return (
    <Card className="border-emerald-300/70 bg-emerald-50/60 dark:bg-emerald-950/30">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <Badge className="bg-emerald-600 hover:bg-emerald-700">Recommended</Badge>
        </div>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="rounded-md border bg-muted/20 p-3">
          {offer.nightlyPrice !== null ? (
            <div className="flex items-baseline justify-between border-b border-dashed pb-2">
              <span className="text-xs font-medium text-muted-foreground">Per night</span>
              <span className="text-base font-semibold text-foreground">{formatMoney(offer.nightlyPrice)}</span>
            </div>
          ) : null}
          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
            {buildBreakdownRows(offer).map((row) => (
              <div key={`${offer.roomTypeId}-${row.label}`} className="flex justify-between">
                <span>{row.label}</span>
                <span className="font-mono">{formatMoney(row.amount)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-baseline justify-between border-t border-dashed pt-3">
            <span className="text-xs font-medium text-muted-foreground">Total Price</span>
            <span className="text-lg font-bold text-primary">{formatMoney(offer.totalPrice)}</span>
          </div>
        </div>

        {offer.roomDescription ? (
          <p className="text-xs text-foreground">{offer.roomDescription}</p>
        ) : null}

        {offer.reasons.length > 0 ? (
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Why this room</p>
            <ul className="list-disc pl-4 text-xs text-foreground">
              {offer.reasons.map((reason) => (
                <li key={`${offer.roomTypeId}-${reason}`}>{reason}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Policy</p>
          <p className="text-xs text-foreground">{offer.policySummary || "-"}</p>
        </div>

        {offer.inventoryNote ? (
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Inventory</p>
            <p className="text-xs text-foreground">{offer.inventoryNote}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function buildBreakdownRows(offer: RecommendedRoom): Array<{ label: string; amount: number }> {
  const rows: Array<{ label: string; amount: number | null }> = [
    { label: "Subtotal", amount: offer.pricingBreakdown.subtotal },
    { label: "Taxes & fees", amount: offer.pricingBreakdown.taxesAndFees },
  ];

  for (const fee of offer.pricingBreakdown.includedFees) {
    rows.push({ label: fee.label, amount: fee.amount });
  }

  return rows.filter((row): row is { label: string; amount: number } => row.amount !== null && row.amount > 0);
}
