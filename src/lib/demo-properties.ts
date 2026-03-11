import type { PropertyListItem } from "@/lib/api-client";

export const DEMO_PROPERTY_ID = "demo_property";

const DEMO_PROPERTY_OPTION: PropertyListItem = {
  propertyId: DEMO_PROPERTY_ID,
  name: "Demo Property",
};

export function buildOfferPropertyOptions(properties: PropertyListItem[]): PropertyListItem[] {
  const seen = new Set<string>();
  const options = properties.filter((property) => {
    if (property.propertyId === DEMO_PROPERTY_ID || seen.has(property.propertyId)) {
      return false;
    }
    seen.add(property.propertyId);
    return true;
  });
  return [...options, DEMO_PROPERTY_OPTION];
}
