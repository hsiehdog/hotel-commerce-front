import type {
  ConciergeClientAction,
  ConciergeContextSearch,
  ConciergeContextSyncPayload,
  ConciergeCurrentPricing,
  ConciergeCurrentSelection,
} from "@/lib/api-client";
import type {
  OffersDraft,
  ParsedOffersResponse,
  RecommendedRoom,
  RecommendedUpsell,
} from "@/lib/offers-demo";

export type CheckoutRoomSelection = {
  roomTypeId: string;
  ratePlanId: string;
};

type CheckoutResolvedRoom = CheckoutRoomSelection & {
  roomType: string;
  ratePlan: string;
  totalPrice: number | null;
  nightlyPrice: number | null;
  subtotal: number | null;
  taxesAndFees: number | null;
};

export type CheckoutDisplayRoom = {
  selection: CheckoutRoomSelection;
  offer: RecommendedRoom;
  isRecommended: boolean;
};

function toRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function toRecordArray(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    const record = toRecord(entry);
    return record ? [record] : [];
  });
}

export function getInitialRoomSelection(
  parsedResponse: ParsedOffersResponse | null,
): CheckoutRoomSelection | null {
  if (!parsedResponse?.recommendedRoom) {
    return null;
  }

  return {
    roomTypeId: parsedResponse.recommendedRoom.roomTypeId,
    ratePlanId: parsedResponse.recommendedRoom.ratePlanId,
  };
}

function buildUpgradeRoom(
  parsedResponse: ParsedOffersResponse,
  roomTypeId: string,
  ratePlanId: string,
): CheckoutResolvedRoom | null {
  const upgrade = parsedResponse.upgradeLadder.find(
    (entry) => entry.roomTypeId === roomTypeId && entry.ratePlanId === ratePlanId,
  );
  if (!upgrade) {
    return null;
  }

  const recommendedRoom = parsedResponse.recommendedRoom;
  const nightlyPrice =
    recommendedRoom?.nightlyPrice !== null &&
    recommendedRoom?.nightlyPrice !== undefined &&
    upgrade.priceDeltaPerNight !== null
      ? recommendedRoom.nightlyPrice + upgrade.priceDeltaPerNight
      : upgrade.nightlyPrice;
  const subtotal =
    recommendedRoom?.pricingBreakdown.subtotal !== null &&
    recommendedRoom?.pricingBreakdown.subtotal !== undefined &&
    upgrade.priceDeltaTotal !== null
      ? recommendedRoom.pricingBreakdown.subtotal + upgrade.priceDeltaTotal
      : null;
  const taxesAndFees = recommendedRoom?.pricingBreakdown.taxesAndFees ?? null;

  return {
    roomTypeId: upgrade.roomTypeId,
    ratePlanId: upgrade.ratePlanId,
    roomType: upgrade.roomType,
    ratePlan: upgrade.ratePlan,
    totalPrice: upgrade.totalPrice,
    nightlyPrice,
    subtotal,
    taxesAndFees,
  };
}

export function resolveSelectedRoom(
  parsedResponse: ParsedOffersResponse | null,
  selection: CheckoutRoomSelection | null,
): CheckoutResolvedRoom | null {
  if (!parsedResponse || !selection) {
    return null;
  }

  if (
    parsedResponse.recommendedRoom?.roomTypeId === selection.roomTypeId &&
    parsedResponse.recommendedRoom.ratePlanId === selection.ratePlanId
  ) {
    return {
      roomTypeId: parsedResponse.recommendedRoom.roomTypeId,
      ratePlanId: parsedResponse.recommendedRoom.ratePlanId,
      roomType: parsedResponse.recommendedRoom.roomType,
      ratePlan: parsedResponse.recommendedRoom.ratePlan,
      totalPrice: parsedResponse.recommendedRoom.totalPrice,
      nightlyPrice: parsedResponse.recommendedRoom.nightlyPrice,
      subtotal: parsedResponse.recommendedRoom.pricingBreakdown.subtotal,
      taxesAndFees: parsedResponse.recommendedRoom.pricingBreakdown.taxesAndFees,
    };
  }

  return buildUpgradeRoom(parsedResponse, selection.roomTypeId, selection.ratePlanId);
}

function buildRecommendedRoomDisplay(
  parsedResponse: ParsedOffersResponse,
): CheckoutDisplayRoom | null {
  if (!parsedResponse.recommendedRoom) {
    return null;
  }

  return {
    selection: {
      roomTypeId: parsedResponse.recommendedRoom.roomTypeId,
      ratePlanId: parsedResponse.recommendedRoom.ratePlanId,
    },
    offer: parsedResponse.recommendedRoom,
    isRecommended: true,
  };
}

function buildUpgradeRoomDisplay(
  parsedResponse: ParsedOffersResponse,
  roomTypeId: string,
  ratePlanId: string,
): CheckoutDisplayRoom | null {
  const resolvedRoom = buildUpgradeRoom(parsedResponse, roomTypeId, ratePlanId);
  const upgrade = parsedResponse.upgradeLadder.find(
    (entry) => entry.roomTypeId === roomTypeId && entry.ratePlanId === ratePlanId,
  );

  if (!resolvedRoom || !upgrade) {
    return null;
  }

  return {
    selection: {
      roomTypeId: resolvedRoom.roomTypeId,
      ratePlanId: resolvedRoom.ratePlanId,
    },
    offer: {
      roomType: resolvedRoom.roomType,
      roomDescription: upgrade.roomDescription,
      ratePlan: resolvedRoom.ratePlan,
      nightlyPrice: resolvedRoom.nightlyPrice,
      totalPrice: resolvedRoom.totalPrice,
      pricingBreakdown: {
        subtotal: resolvedRoom.subtotal,
        taxesAndFees: resolvedRoom.taxesAndFees,
        includedFees: [],
      },
      score: upgrade.ladderScore,
      reasons: upgrade.reasons.length > 0 ? upgrade.reasons : upgrade.benefitSummary,
      policySummary: "See rate details in checkout.",
      inventoryNote: "",
      roomTypeId: resolvedRoom.roomTypeId,
      ratePlanId: resolvedRoom.ratePlanId,
    },
    isRecommended: false,
  };
}

export function resolveSelectedRoomDisplay(
  parsedResponse: ParsedOffersResponse | null,
  selection: CheckoutRoomSelection | null,
): CheckoutDisplayRoom | null {
  if (!parsedResponse || !selection) {
    return null;
  }

  const recommendedRoom = buildRecommendedRoomDisplay(parsedResponse);
  if (
    recommendedRoom &&
    recommendedRoom.selection.roomTypeId === selection.roomTypeId &&
    recommendedRoom.selection.ratePlanId === selection.ratePlanId
  ) {
    return recommendedRoom;
  }

  return buildUpgradeRoomDisplay(parsedResponse, selection.roomTypeId, selection.ratePlanId);
}

export function listAlternativeRoomDisplays(
  parsedResponse: ParsedOffersResponse | null,
  selectedRoom: CheckoutRoomSelection | null,
): CheckoutDisplayRoom[] {
  if (!parsedResponse) {
    return [];
  }

  const displays: CheckoutDisplayRoom[] = [];
  const recommendedRoom = buildRecommendedRoomDisplay(parsedResponse);
  if (recommendedRoom) {
    displays.push(recommendedRoom);
  }

  for (const entry of parsedResponse.upgradeLadder) {
    const display = buildUpgradeRoomDisplay(parsedResponse, entry.roomTypeId, entry.ratePlanId);
    if (display) {
      displays.push(display);
    }
  }

  return displays.filter(
    (display) =>
      !selectedRoom ||
      display.selection.roomTypeId !== selectedRoom.roomTypeId ||
      display.selection.ratePlanId !== selectedRoom.ratePlanId,
  );
}

export function normalizeSelectedAddOns(
  offers: RecommendedUpsell[],
  selectedAddOns: string[],
): string[] {
  const knownBundleTypes = new Set(offers.map((offer) => offer.bundleType));
  return Array.from(new Set(selectedAddOns.filter((bundleType) => knownBundleTypes.has(bundleType))));
}

export function buildDraftSearchContext(draft: OffersDraft): ConciergeContextSearch {
  return {
    checkIn: draft.check_in,
    checkOut: draft.check_out,
    adults: Number(draft.adults),
    rooms: Number(draft.rooms),
    children: Number(draft.children),
    petFriendly: draft.pet_friendly,
    accessibleRoom: draft.accessible_room,
    needsTwoBeds: draft.needs_two_beds,
    parkingNeeded: draft.parking_needed,
    breakfastPackage: draft.breakfast_package,
    earlyCheckIn: draft.early_check_in,
    lateCheckOut: draft.late_check_out,
    ...(draft.stub_scenario.trim() ? { stubScenario: draft.stub_scenario.trim() } : {}),
  };
}

export function buildContextSyncPayload({
  draft,
  parsedResponse,
  selectedRoom,
  selectedAddOns,
  sessionId,
}: {
  draft: OffersDraft;
  parsedResponse: ParsedOffersResponse;
  selectedRoom: CheckoutRoomSelection | null;
  selectedAddOns: string[];
  sessionId?: string;
}): ConciergeContextSyncPayload {
  const currentSelection =
    selectedRoom?.roomTypeId && selectedRoom.ratePlanId
      ? {
          roomTypeId: selectedRoom.roomTypeId,
          ratePlanId: selectedRoom.ratePlanId,
          selectedAddOns,
        }
      : null;

  return {
    ...(sessionId ? { sessionId } : {}),
    offerContext: {
      search: buildDraftSearchContext(draft),
      recommendedRoom: toRecord(parsedResponse.raw.recommended_room),
      upgradeLadder: toRecordArray(parsedResponse.raw.upgrade_ladder),
      recommendedOffers: toRecordArray(parsedResponse.raw.recommended_offers),
      currency: parsedResponse.currency,
      generatedAt: new Date().toISOString(),
      ...(currentSelection ? { currentSelection } : {}),
    },
  };
}

export function buildLocalCurrentPricing({
  parsedResponse,
  selectedRoom,
  selectedAddOns,
}: {
  parsedResponse: ParsedOffersResponse | null;
  selectedRoom: CheckoutRoomSelection | null;
  selectedAddOns: string[];
}): ConciergeCurrentPricing | null {
  const room = resolveSelectedRoom(parsedResponse, selectedRoom);
  if (!parsedResponse || !room || room.totalPrice === null) {
    return null;
  }

  const resolvedAddOns = parsedResponse.recommendedOffers.filter((offer) =>
    selectedAddOns.includes(offer.bundleType),
  );
  const addOnsTotal = resolvedAddOns.reduce(
    (sum, offer) => sum + (offer.estimatedPriceDelta ?? 0),
    0,
  );

  return {
    currency: parsedResponse.currency,
    roomTotal: room.totalPrice,
    addOnsTotal,
    total: room.totalPrice + addOnsTotal,
    nightlyPrice: room.nightlyPrice,
    subtotal: room.subtotal,
    taxesAndFees: room.taxesAndFees,
    selectedAddOns: resolvedAddOns.map((offer) => ({
      bundleType: offer.bundleType,
      label: offer.label,
      estimatedPriceDelta: offer.estimatedPriceDelta ?? 0,
    })),
  };
}

export function selectionFromCurrentSelection(
  currentSelection: ConciergeCurrentSelection | null | undefined,
): CheckoutRoomSelection | null {
  if (!currentSelection) {
    return null;
  }

  return {
    roomTypeId: currentSelection.roomTypeId,
    ratePlanId: currentSelection.ratePlanId,
  };
}

export function applyClientAction({
  parsedResponse,
  selectedRoom,
  selectedAddOns,
  action,
}: {
  parsedResponse: ParsedOffersResponse | null;
  selectedRoom: CheckoutRoomSelection | null;
  selectedAddOns: string[];
  action: ConciergeClientAction | null | undefined;
}): {
  selectedRoom: CheckoutRoomSelection | null;
  selectedAddOns: string[];
} {
  if (!action) {
    return { selectedRoom, selectedAddOns };
  }

  if (action.type === "select_room") {
    return {
      selectedRoom: {
        roomTypeId: action.roomTypeId,
        ratePlanId: action.ratePlanId,
      },
      selectedAddOns: normalizeSelectedAddOns(
        parsedResponse?.recommendedOffers ?? [],
        selectedAddOns,
      ),
    };
  }

  if (action.type === "add_addon") {
    return {
      selectedRoom,
      selectedAddOns: normalizeSelectedAddOns(
        parsedResponse?.recommendedOffers ?? [],
        [...selectedAddOns, action.bundleType],
      ),
    };
  }

  return {
    selectedRoom,
    selectedAddOns: selectedAddOns.filter((bundleType) => bundleType !== action.bundleType),
  };
}
