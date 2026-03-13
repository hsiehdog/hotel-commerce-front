"use client";

import { Loader2 } from "lucide-react";

import type { ConciergeCurrentPricing } from "@/lib/api-client";
import type { ParsedOffersResponse } from "@/lib/offers-demo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DecisionOfferCard } from "@/components/offers/dashboard/offer-card";
import { formatMoney } from "@/components/offers/dashboard/utils";
import {
  type CheckoutRoomSelection,
  listAlternativeRoomDisplays,
  resolveSelectedRoomDisplay,
} from "@/components/checkout/demo-checkout-state";

type CheckoutRecommendationPanelProps = {
  parsedResponse: ParsedOffersResponse | null;
  isSubmitting: boolean;
  selectedRoom: CheckoutRoomSelection | null;
  selectedAddOns: string[];
  currentPricing: ConciergeCurrentPricing | null;
  isSyncing: boolean;
  syncError: string | null;
  onSelectRoom: (selection: CheckoutRoomSelection) => void;
  onToggleAddOn: (bundleType: string) => void;
};

export function CheckoutRecommendationPanel({
  parsedResponse,
  isSubmitting,
  selectedRoom,
  selectedAddOns,
  currentPricing,
  isSyncing,
  syncError,
  onSelectRoom,
  onToggleAddOn,
}: CheckoutRecommendationPanelProps) {
  if (isSubmitting) {
    return (
      <Card className="border-border/60 bg-white shadow-sm">
        <CardContent className="flex min-h-[280px] items-center justify-center">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Finding the best stay for this request...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!parsedResponse) {
    return (
      <Card className="border-dashed border-border/70 bg-white/80 shadow-sm">
        <CardContent className="flex min-h-[280px] flex-col items-center justify-center text-center">
          <p className="text-lg font-semibold text-foreground">Your guided recommendation will appear here</p>
          <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
            After you enter your dates and guest count, we will show the recommended room, alternatives,
            and add-ons in a checkout-friendly format.
          </p>
        </CardContent>
      </Card>
    );
  }

  const currency = parsedResponse.currency;
  const selectedRoomDisplay = resolveSelectedRoomDisplay(parsedResponse, selectedRoom);
  const alternativeRooms = listAlternativeRoomDisplays(parsedResponse, selectedRoom);
  const selectedCardOffer = selectedRoomDisplay
    ? buildSelectedRoomCardOffer(selectedRoomDisplay.offer, currentPricing)
    : null;

  return (
    <div className="space-y-6">
      {syncError ? (
        <div className="rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {syncError}
        </div>
      ) : null}

      {selectedRoomDisplay ? (
        <DecisionOfferCard
          title={selectedCardOffer?.roomType ?? selectedRoomDisplay.offer.roomType}
          offer={selectedCardOffer}
          currency={currency}
          tone="selected"
          badgeLabels={
            selectedRoomDisplay.isRecommended
              ? ["Selected", "Recommended"]
              : ["Selected"]
          }
        />
      ) : (
        <Card className="border-amber-300/70 bg-amber-50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">No stay recommendation yet</CardTitle>
          </CardHeader>
        </Card>
      )}

      <AlternativesSummary
        currency={currency}
        isSyncing={isSyncing}
        rooms={alternativeRooms}
        selectedRoomNightlyPrice={selectedCardOffer?.nightlyPrice ?? null}
        onSelectRoom={onSelectRoom}
      />

      <RecommendedAddOns
        currency={currency}
        offers={parsedResponse.recommendedOffers}
        selectedAddOns={selectedAddOns}
        isSyncing={isSyncing}
        onToggleAddOn={onToggleAddOn}
      />
    </div>
  );
}

function buildSelectedRoomCardOffer(
  offer: NonNullable<ReturnType<typeof resolveSelectedRoomDisplay>>["offer"],
  currentPricing: ConciergeCurrentPricing | null,
) {
  if (!currentPricing) {
    return offer;
  }

  return {
    ...offer,
    totalPrice: currentPricing.total,
    pricingBreakdown: {
      ...offer.pricingBreakdown,
      subtotal: currentPricing.subtotal ?? offer.pricingBreakdown.subtotal,
      taxesAndFees: currentPricing.taxesAndFees ?? offer.pricingBreakdown.taxesAndFees,
      includedFees: currentPricing.selectedAddOns.map((addOn) => ({
        label: addOn.label,
        amount: addOn.estimatedPriceDelta,
      })),
    },
  };
}

function AlternativesSummary({
  rooms,
  currency,
  isSyncing,
  selectedRoomNightlyPrice,
  onSelectRoom,
}: {
  rooms: ReturnType<typeof listAlternativeRoomDisplays>;
  currency: string;
  isSyncing: boolean;
  selectedRoomNightlyPrice: number | null;
  onSelectRoom: (selection: CheckoutRoomSelection) => void;
}) {
  return (
    <Card className="border-border/60 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Alternatives</CardTitle>
      </CardHeader>
      <CardContent>
        {rooms.length === 0 ? (
          <p className="text-sm text-muted-foreground">No alternative room categories are available for this stay.</p>
        ) : (
          <div className="space-y-3">
            {rooms.map((room) => (
              <div
                key={`${room.selection.roomTypeId}-${room.selection.ratePlanId}`}
                className="rounded-3xl border border-border/70 bg-slate-50 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{room.offer.roomType}</p>
                    <p className="text-sm text-muted-foreground">{room.offer.ratePlan}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-semibold text-foreground">
                      {formatMoney(room.offer.totalPrice, currency)}
                    </p>
                    {room.offer.nightlyPrice !== null ? (
                      <p className="text-muted-foreground">
                        {buildAlternativePriceCaption({
                          alternativeNightlyPrice: room.offer.nightlyPrice,
                          selectedRoomNightlyPrice,
                          currency,
                        })}
                      </p>
                    ) : null}
                  </div>
                </div>
                {room.offer.reasons.length > 0 ? (
                  <div className="mt-3 border-t border-border/60 pt-3">
                    <ul className="list-disc pl-4 text-xs text-muted-foreground">
                      {room.offer.reasons.map((reason) => (
                        <li key={`${room.selection.ratePlanId}-${reason}`}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-full"
                    disabled={isSyncing}
                    onClick={() => onSelectRoom(room.selection)}
                  >
                    Select room
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function buildAlternativePriceCaption({
  alternativeNightlyPrice,
  selectedRoomNightlyPrice,
  currency,
}: {
  alternativeNightlyPrice: number;
  selectedRoomNightlyPrice: number | null;
  currency: string;
}): string {
  if (
    selectedRoomNightlyPrice !== null &&
    alternativeNightlyPrice > selectedRoomNightlyPrice
  ) {
    return `+${formatMoney(alternativeNightlyPrice - selectedRoomNightlyPrice, currency)}/night`;
  }

  return `${formatMoney(alternativeNightlyPrice, currency)}/night`;
}

function RecommendedAddOns({
  offers,
  currency,
  selectedAddOns,
  isSyncing,
  onToggleAddOn,
}: {
  offers: ParsedOffersResponse["recommendedOffers"];
  currency: string;
  selectedAddOns: string[];
  isSyncing: boolean;
  onToggleAddOn: (bundleType: string) => void;
}) {
  return (
    <Card className="border-border/60 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Recommended add-ons</CardTitle>
      </CardHeader>
      <CardContent>
        {offers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No add-ons were recommended for this stay.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {offers.map((offer) => {
              const isSelected = selectedAddOns.includes(offer.bundleType);

              return (
                <div
                  key={`${offer.bundleType}-${offer.label}`}
                  className={`rounded-3xl border p-4 ${
                    isSelected ? "border-sky-300 bg-sky-50" : "border-border/70 bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-foreground">{offer.label}</p>
                    {offer.estimatedPriceDelta !== null ? (
                      <span className="text-sm font-semibold text-foreground">
                        {formatMoney(offer.estimatedPriceDelta, currency)}
                      </span>
                    ) : null}
                  </div>
                  {offer.reasons.length > 0 ? (
                    <p className="mt-3 text-sm text-muted-foreground">{offer.reasons.join(" • ")}</p>
                  ) : null}
                  <div className="mt-4">
                    <Button
                      type="button"
                      variant={isSelected ? "secondary" : "outline"}
                      className="w-full rounded-full"
                      disabled={isSyncing}
                      onClick={() => onToggleAddOn(offer.bundleType)}
                    >
                      {isSelected ? "Remove add-on" : "Add add-on"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
