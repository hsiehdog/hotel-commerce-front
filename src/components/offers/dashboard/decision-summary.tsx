"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ParsedOfferCard } from "@/lib/offers-demo";
import { cn, formatMoney, toStringArray } from "./utils";

interface DecisionSummaryProps {
  topReasons: { primary: string; secondary: string };
  primaryOffer: ParsedOfferCard | null;
  secondaryOffer: ParsedOfferCard | null;
  deltaLine: string;
}

export function DecisionSummary({ topReasons, primaryOffer, secondaryOffer, deltaLine }: DecisionSummaryProps) {
  return (
    <div className="space-y-6">
      <Card className="border-emerald-300/60 bg-emerald-50/40 dark:bg-emerald-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Why This Changed</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm md:grid-cols-2">
          <div className="rounded-md border bg-background/70 p-3 shadow-sm">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Primary</p>
            <p className="font-medium">{topReasons.primary}</p>
          </div>
          <div className="rounded-md border bg-background/70 p-3 shadow-sm">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Secondary</p>
            <p className="font-medium">{topReasons.secondary}</p>
          </div>
        </CardContent>
      </Card>

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

function DecisionOfferCard({
  title,
  offer,
  highlighted,
}: {
  title: string;
  offer: ParsedOfferCard | null;
  highlighted: boolean;
}) {
  if (!offer) {
    return (
      <Card className="gap-3 py-4">
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No offer available.</p>
        </CardContent>
      </Card>
    );
  }

  const tier = offer.recommended ? "Recommended" : "Alternative";
  const payment = normalizePayment(offer.paymentSummary);
  const enhancements = toEnhancementLabels(offer.enhancements);
  const disclosures = toStringArray(offer.disclosures);
  const totalForDisplay = offer.pricingBreakdown.total ?? offer.totalPrice;

  return (
    <Card className={cn(highlighted && "border-emerald-300/70 bg-emerald-50/60 dark:bg-emerald-950/30")}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <Badge className={offer.recommended ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-600"}>{tier}</Badge>
        </div>
        <CardDescription className="font-mono text-xs">
          {offer.offerId} | {offer.room} | {offer.ratePlan}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{offer.cancellationSummary}</Badge>
          <Badge variant="secondary">{payment}</Badge>
        </div>
        
        <div className="rounded-md border bg-muted/20 p-3">
          <div className="flex items-baseline justify-between border-b border-dashed pb-2">
            <span className="text-xs font-medium text-muted-foreground">Total Price</span>
            <span className="text-lg font-bold text-primary">{formatMoney(totalForDisplay)}</span>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
             Base {formatMoney(offer.pricingBreakdown.subtotal)} + Taxes {formatMoney(offer.pricingBreakdown.taxesFees)}
          </div>
        </div>

        {enhancements.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Enhancements</p>
            <div className="flex flex-wrap gap-1">
              {enhancements.map((enhancement) => (
                <Badge key={`${offer.offerId}-${enhancement}`} variant="outline" className="text-xs font-normal">
                  {enhancement}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {disclosures.length > 0 && (
          <div>
             <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Disclosures</p>
             <ul className="list-disc pl-4 text-xs text-muted-foreground">
              {disclosures.map((line) => (
                <li key={`${offer.offerId}-${line}`}>{line}</li>
              ))}
             </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function normalizePayment(value: string): string {
  const lower = value.toLowerCase();
  if (lower.includes("property") || lower.includes("hotel")) {
    return "Pay at property";
  }
  if (lower.includes("now") || lower.includes("prepay")) {
    return "Pay now";
  }
  return value;
}

function toEnhancementLabels(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === "string") {
        return item;
      }
      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        if (typeof record.name === "string" && record.name.trim()) {
          return record.name;
        }
        if (typeof record.id === "string" && record.id.trim()) {
          return record.id;
        }
      }
      return "";
    })
    .filter(Boolean);
}
