import { ChatOffer } from "@/lib/api-client";
import { ParsedOfferCard } from "@/lib/offers-demo";
import { DecisionOfferCard } from "@/components/offers/dashboard/offer-card";

type ChatOffersListProps = {
  offers: ChatOffer[];
};

function mapToParsedOfferCard(offer: ChatOffer, index: number): ParsedOfferCard {
  return {
    offerId: offer.id,
    type: offer.rate_type,
    recommended: index === 0,
    room: offer.name,
    roomTypeDescription: offer.description,
    features: [],
    ratePlan: offer.rate_label ?? offer.rate_type,
    policy: null,
    pricing: offer.price,
    enhancements: offer.enhancements ?? [],
    disclosures: offer.disclosures ?? [],
    totalPrice: offer.price.total,
    pricingBreakdown: {
      subtotal: offer.price.subtotal,
      taxesFees: offer.price.taxes_and_fees,
      addOns: offer.price.add_ons_total ?? null,
      fees: offer.fee_breakdown ?? [],
      total: offer.price.total_with_add_ons ?? offer.price.total,
    },
    cancellationSummary: offer.cancellation_policy,
    paymentSummary: offer.payment_policy,
    raw: {},
  };
}

export function ChatOffersList({ offers }: ChatOffersListProps) {
  return (
    <div className="mt-2 grid gap-2">
      {offers.slice(0, 2).map((offer, index) => (
        <DecisionOfferCard
          key={offer.id}
          title={index === 0 ? "Primary Offer" : "Secondary Offer"}
          offer={mapToParsedOfferCard(offer, index)}
          highlighted={index === 0}
        />
      ))}
    </div>
  );
}
