import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChatOffer } from "@/lib/api-client";

type ChatOffersListProps = {
  offers: ChatOffer[];
};

function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function ChatOffersList({ offers }: ChatOffersListProps) {
  if (offers.length === 0) {
    return null;
  }

  const offer = offers[0];

  return (
    <Card className="mt-2 border-emerald-300/70 bg-emerald-50/60 dark:bg-emerald-950/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Recommended Room</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <p className="font-medium">{offer.name}</p>
        <p className="text-muted-foreground">{offer.description}</p>
        <p>
          Total: {formatMoney(offer.price.total_with_add_ons ?? offer.price.total, offer.price.currency)}
        </p>
        <p className="text-muted-foreground">{offer.cancellation_policy}</p>
      </CardContent>
    </Card>
  );
}
