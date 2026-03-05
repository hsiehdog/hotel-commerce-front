import type { RecommendedRoom } from "@/lib/offers-demo";
import { DecisionOfferCard } from "@/components/offers/dashboard/offer-card";

type ChatOffersListProps = {
  recommendedRoom: RecommendedRoom | null;
};

export function ChatOffersList({ recommendedRoom }: ChatOffersListProps) {
  if (!recommendedRoom) {
    return null;
  }

  return <DecisionOfferCard title="Recommended Room" offer={recommendedRoom} />;
}
