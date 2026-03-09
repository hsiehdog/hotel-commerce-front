import type { PropertyListItem } from "@/lib/api-client";

export const OFFER_PROPERTY_ORDER = [
  "inn_at_mount_shasta",
  "cavallo_point",
  "demo_property",
] as const;

const OFFER_PROPERTY_ORDER_INDEX = new Map(
  OFFER_PROPERTY_ORDER.map((propertyId, index) => [propertyId, index]),
) as Map<string, number>;

export function getOrderedOfferProperties(properties: PropertyListItem[]): PropertyListItem[] {
  return [...properties].sort((left, right) => {
    const leftIndex = OFFER_PROPERTY_ORDER_INDEX.get(left.propertyId) ?? Number.MAX_SAFE_INTEGER;
    const rightIndex = OFFER_PROPERTY_ORDER_INDEX.get(right.propertyId) ?? Number.MAX_SAFE_INTEGER;

    if (leftIndex !== rightIndex) {
      return leftIndex - rightIndex;
    }

    return left.name.localeCompare(right.name);
  });
}
