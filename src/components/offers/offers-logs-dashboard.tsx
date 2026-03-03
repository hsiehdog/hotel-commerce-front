"use client";

import { useInfiniteQuery, useQueries, useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AuditOutboxState,
  OffersLogPresentedOffer,
  OffersLogTopCandidate,
  fetchOffersLogDetail,
  fetchOffersLogs,
  fetchProperties,
} from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const DEFAULT_PROPERTY_ID = "demo_property";
const ALL_TIME_FROM_ISO = "1970-01-01T00:00:00.000Z";
const ALL_TIME_TO_ISO = "9999-12-31T23:59:59.999Z";

function formatDateTime(value?: string | null): string {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString();
}

function formatDateTimeWithoutSeconds(value?: string | null): string {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString(undefined, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatCurrency(amount?: number | null): string {
  if (amount === null || amount === undefined) {
    return "-";
  }

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

function formatDuration(ms?: number | null): string {
  if (ms === null || ms === undefined) {
    return "-";
  }
  if (ms < 1_000) {
    return `${ms}ms`;
  }
  const seconds = ms / 1_000;
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.round(seconds % 60);
  return `${minutes}m ${remainder}s`;
}

function getOutboxBadgeVariant(state?: AuditOutboxState | null): "outline" | "secondary" | "destructive" {
  if (state === "DLQ") {
    return "destructive";
  }
  if (state === "PROCESSED") {
    return "secondary";
  }
  return "outline";
}

function matchesOffer(candidate: OffersLogTopCandidate, offer: OffersLogPresentedOffer): boolean {
  if (candidate.offerId && offer.offerId && candidate.offerId === offer.offerId) {
    return true;
  }

  if (
    candidate.roomTypeId &&
    candidate.ratePlanId &&
    offer.roomTypeId &&
    offer.ratePlanId &&
    candidate.roomTypeId === offer.roomTypeId &&
    candidate.ratePlanId === offer.ratePlanId
  ) {
    return true;
  }

  return false;
}

function copyToClipboard(value: unknown) {
  const payload = JSON.stringify(value ?? {}, null, 2);
  void navigator.clipboard.writeText(payload);
}

function getPrimaryOfferNameFromRow(row: {
  primaryOfferRoomTypeName?: string | null;
  primaryOfferRatePlanName?: string | null;
}) {
  const parts = [
    row.primaryOfferRoomTypeName,
    row.primaryOfferRatePlanName,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" - ") : "-";
}

function formatPrimaryOfferTotal(amount?: number | null): string {
  if (amount === null || amount === undefined) {
    return "-";
  }

  return formatCurrency(amount);
}

function formatPropertyLabel(label: string): string {
  return label
    .replace(/[_-]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

type PrimaryOfferDisplay = {
  name: string;
  totalPrice?: number | null;
  currency?: string | null;
};

type BasicOfferDetails = {
  checkIn?: string | null;
  checkOut?: string | null;
  rooms?: number | null;
  adults?: number | null;
  children?: number | null;
};

type RowEnrichment = {
  primary: PrimaryOfferDisplay;
  basic: BasicOfferDetails;
};

function formatMonthDayYear(date: Date): string {
  const month = new Intl.DateTimeFormat("en-US", { month: "short" }).format(date);
  return `${month} ${date.getDate()}, ${date.getFullYear()}`;
}

function formatStayDateRange(checkIn?: string | null, checkOut?: string | null): string {
  if (!checkIn || !checkOut) {
    return "-";
  }

  const start = new Date(checkIn);
  const end = new Date(checkOut);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "-";
  }

  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();
  const sameDay = sameMonth && start.getDate() === end.getDate();
  const startMonth = new Intl.DateTimeFormat("en-US", { month: "short" }).format(start);
  const endMonth = new Intl.DateTimeFormat("en-US", { month: "short" }).format(end);

  if (sameDay) {
    return formatMonthDayYear(start);
  }

  if (sameMonth) {
    return `${startMonth} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`;
  }

  if (sameYear) {
    return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${start.getFullYear()}`;
  }

  return `${formatMonthDayYear(start)} - ${formatMonthDayYear(end)}`;
}

function formatBasicOfferDetails(details: BasicOfferDetails): string {
  const dateRange = formatStayDateRange(details.checkIn, details.checkOut);
  const rooms = details.rooms ?? 0;
  const adults = details.adults ?? 0;
  const children = details.children ?? 0;
  return `${dateRange} | ${rooms} room${rooms === 1 ? "" : "s"} | ${adults}A/${children}C`;
}

function getPrimaryOfferFromPresentedOffers(
  detail: Awaited<ReturnType<typeof fetchOffersLogDetail>>,
): PrimaryOfferDisplay | null {
  const presentedOffers = detail.normalized.presentedOffers;
  if (presentedOffers.length === 0) {
    return null;
  }

  const recommendedOffer = presentedOffers.find((offer) => offer.recommended);
  const primaryOffer = recommendedOffer ?? presentedOffers[0];
  const nameParts = [primaryOffer.roomTypeName, primaryOffer.ratePlanName].filter(Boolean);
  const name = nameParts.length > 0
    ? nameParts.join(" - ")
    : primaryOffer.offerId || "-";

  return {
    name,
    totalPrice: primaryOffer.totalPrice,
    currency: primaryOffer.currency,
  };
}

function resolvePrimaryValues(
  row: {
    primaryOfferRoomTypeName?: string | null;
    primaryOfferRatePlanName?: string | null;
    primaryOfferTotalPrice?: number | null;
    primaryOfferCurrency?: string | null;
  },
  fallbackPrimary?: PrimaryOfferDisplay,
) {
  const primaryName = getPrimaryOfferNameFromRow(row);
  return {
    name: primaryName === "-" ? (fallbackPrimary?.name ?? "-") : primaryName,
    totalPrice: row.primaryOfferTotalPrice ?? fallbackPrimary?.totalPrice ?? null,
    currency: row.primaryOfferCurrency ?? fallbackPrimary?.currency ?? null,
  };
}

function hasMissingBasicDetails(details: BasicOfferDetails): boolean {
  return !details.checkIn || !details.checkOut || details.rooms === null || details.rooms === undefined;
}

export function OffersLogsDashboard() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [propertyId, setPropertyId] = useState(() => searchParams.get("propertyId") ?? DEFAULT_PROPERTY_ID);
  const [selectedDecisionId, setSelectedDecisionId] = useState(
    () => searchParams.get("selectedDecisionId") ?? "",
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const hasMountedRef = useRef(false);

  const propertiesQuery = useQuery({
    queryKey: ["offer-log-properties"],
    queryFn: () => fetchProperties({ activeOnly: true }),
  });

  const propertyOptions = useMemo(() => {
    const apiProperties = propertiesQuery.data ?? [];
    const filtered = apiProperties.filter((property) => property.propertyId !== DEFAULT_PROPERTY_ID);
    return [{ propertyId: DEFAULT_PROPERTY_ID, name: DEFAULT_PROPERTY_ID }, ...filtered];
  }, [propertiesQuery.data]);

  const listQuery = useInfiniteQuery({
    queryKey: ["offer-logs", propertyId],
    queryFn: ({ pageParam }) =>
      fetchOffersLogs({
        propertyId,
        from: ALL_TIME_FROM_ISO,
        to: ALL_TIME_TO_ISO,
        cursor: pageParam as string | undefined,
        limit: 25,
      }),
    enabled: Boolean(propertyId),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.pageInfo.hasMore ? lastPage.pageInfo.nextCursor : undefined),
  });

  const rows = useMemo(
    () => listQuery.data?.pages.flatMap((page) => page.rows) ?? [],
    [listQuery.data?.pages],
  );

  const rowsNeedingDetailEnrichment = useMemo(
    () =>
      rows.filter((row) => {
        const missingName = !row.primaryOfferRoomTypeName && !row.primaryOfferRatePlanName;
        const missingTotal = row.primaryOfferTotalPrice === null || row.primaryOfferTotalPrice === undefined;
        const missingBasic = hasMissingBasicDetails({
          checkIn: row.checkIn,
          checkOut: row.checkOut,
          rooms: row.rooms,
          adults: row.adults,
          children: row.children,
        });
        return missingName || missingTotal || missingBasic;
      }),
    [rows],
  );

  const rowDetailQueries = useQueries({
    queries: rowsNeedingDetailEnrichment.map((row) => ({
      queryKey: ["offer-log-row-primary", row.decisionId],
      queryFn: () => fetchOffersLogDetail(row.decisionId, { includeRawPayloads: false }),
      staleTime: 60_000,
      enabled: Boolean(row.decisionId),
    })),
  });

  const fallbackRowDataByDecisionId = useMemo(() => {
    const map = new Map<string, RowEnrichment>();
    rowsNeedingDetailEnrichment.forEach((row, index) => {
      const detail = rowDetailQueries[index]?.data;
      if (!detail) {
        return;
      }
      const primary = getPrimaryOfferFromPresentedOffers(detail);
      if (primary) {
        map.set(row.decisionId, {
          primary,
          basic: {
            checkIn: detail.decision.checkIn,
            checkOut: detail.decision.checkOut,
            rooms: detail.decision.rooms,
            adults: detail.decision.adults,
            children: detail.decision.children,
          },
        });
      } else {
        map.set(row.decisionId, {
          primary: { name: "-", totalPrice: null, currency: null },
          basic: {
            checkIn: detail.decision.checkIn,
            checkOut: detail.decision.checkOut,
            rooms: detail.decision.rooms,
            adults: detail.decision.adults,
            children: detail.decision.children,
          },
        });
      }
    });
    return map;
  }, [rowDetailQueries, rowsNeedingDetailEnrichment]);

  const detailQuery = useQuery({
    queryKey: ["offer-log-detail", selectedDecisionId],
    queryFn: () => fetchOffersLogDetail(selectedDecisionId, { includeRawPayloads: false }),
    enabled: Boolean(selectedDecisionId),
  });

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    setSelectedDecisionId("");
    setIsDrawerOpen(false);
  }, [propertyId]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (propertyId) {
      params.set("propertyId", propertyId);
    }
    if (selectedDecisionId) {
      params.set("selectedDecisionId", selectedDecisionId);
    }

    const next = params.toString();
    const current = searchParams.toString();
    if (next !== current) {
      router.replace(`${pathname}?${next}`, { scroll: false });
    }
  }, [pathname, propertyId, router, searchParams, selectedDecisionId]);

  function openDetail(decisionId: string) {
    setSelectedDecisionId(decisionId);
    setIsDrawerOpen(true);
  }

  const shouldExpandTimeline = Boolean(
    detailQuery.data && (
      detailQuery.data.decision.decisionStatus === "ERROR" ||
      (detailQuery.data.decision.httpStatus ?? 0) >= 400 ||
      detailQuery.data.events.some((entry) => entry.outbox?.state === "DLQ") ||
      detailQuery.data.integrityFlags.multipleCreatedEvents ||
      detailQuery.data.integrityFlags.missingCreatedEvent
    ),
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Offer Logs</CardTitle>
          <CardDescription>Table-first operations log of offer decisions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1 pr-2">
              <label htmlFor="propertyId" className="text-sm font-medium">Property</label>
              <select
                id="propertyId"
                value={propertyId}
                onChange={(event) => setPropertyId(event.target.value)}
                className="block h-9 min-w-[260px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
              >
                {propertyOptions.map((property) => (
                  <option key={property.propertyId} value={property.propertyId}>
                    {formatPropertyLabel(property.name || property.propertyId)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Decision Log</CardTitle>
          <CardDescription>
            Server now: {listQuery.data?.pages[0]?.serverNow ? formatDateTime(listQuery.data.pages[0].serverNow) : "-"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!propertyId ? (
            <p className="text-sm text-muted-foreground">Select a property to load logs.</p>
          ) : listQuery.isPending ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : listQuery.isError ? (
            <p className="text-sm text-destructive">{(listQuery.error as Error).message}</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No rows for current property/time window.</p>
          ) : (
            <>
              <div className="overflow-x-hidden">
                <table className="w-full table-fixed text-left text-sm">
                  <colgroup>
                    <col className="w-[14%]" />
                    <col className="w-[8%]" />
                    <col className="w-[14%]" />
                    <col className="w-[22%]" />
                    <col className="w-[14%]" />
                    <col className="w-[14%]" />
                    <col className="w-[14%]" />
                  </colgroup>
                  <thead className="text-xs uppercase tracking-wide text-muted-foreground">
                    <tr className="border-b">
                      <th className="px-2 py-2">Recorded At</th>
                      <th className="px-2 py-2">Channel</th>
                      <th className="px-2 py-2">Property</th>
                      <th className="px-2 py-2">Basic Offer Details</th>
                      <th className="px-2 py-2">Created Outbox</th>
                      <th className="px-2 py-2">Primary Offer Name</th>
                      <th className="px-2 py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      const fallbackRowData = fallbackRowDataByDecisionId.get(row.decisionId);
                      const resolvedPrimary = resolvePrimaryValues(row, fallbackRowData?.primary);
                      const resolvedBasic: BasicOfferDetails = {
                        checkIn: row.checkIn ?? fallbackRowData?.basic.checkIn,
                        checkOut: row.checkOut ?? fallbackRowData?.basic.checkOut,
                        rooms: row.rooms ?? fallbackRowData?.basic.rooms ?? null,
                        adults: row.adults ?? fallbackRowData?.basic.adults ?? null,
                        children: row.children ?? fallbackRowData?.basic.children ?? null,
                      };
                      return (
                      <tr
                        key={row.decisionId}
                        className={cn(
                          "cursor-pointer border-b align-top transition hover:bg-muted/50",
                          selectedDecisionId === row.decisionId ? "bg-muted/40" : "",
                        )}
                        onClick={() => openDetail(row.decisionId)}
                      >
                        <td className="px-2 py-3">{formatDateTimeWithoutSeconds(row.eventRecordedAt)}</td>
                        <td className="px-2 py-3">{row.channel || "-"}</td>
                        <td className="px-2 py-3">{formatPropertyLabel(row.propertyId || "-")}</td>
                        <td className="px-2 py-3 break-words">{formatBasicOfferDetails(resolvedBasic)}</td>
                        <td className="px-2 py-3">
                          {row.createdEventOutboxState ? (
                            <Badge variant={getOutboxBadgeVariant(row.createdEventOutboxState)}>{row.createdEventOutboxState}</Badge>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-2 py-3">{resolvedPrimary.name}</td>
                        <td className="px-2 py-3">
                          {formatPrimaryOfferTotal(resolvedPrimary.totalPrice)}
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {listQuery.hasNextPage ? (
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => listQuery.fetchNextPage()}
                    disabled={listQuery.isFetchingNextPage}
                  >
                    {listQuery.isFetchingNextPage ? "Loading..." : "Load more"}
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      {isDrawerOpen ? (
        <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setIsDrawerOpen(false)}>
          <aside
            className="absolute right-0 top-0 h-full w-full max-w-3xl bg-background shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <h2 className="text-base font-semibold">Decision Detail</h2>
                <Button type="button" variant="outline" size="sm" onClick={() => setIsDrawerOpen(false)}>
                  Close
                </Button>
              </div>

              <ScrollArea className="h-[calc(100vh-58px)] px-4 py-4">
                {detailQuery.isPending ? (
                  <div className="space-y-3">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : detailQuery.isError || !detailQuery.data ? (
                  <p className="text-sm text-destructive">{(detailQuery.error as Error)?.message ?? "Failed to load detail."}</p>
                ) : (
                  <div className="space-y-5 pb-8">
                    <section className="rounded-md border p-3">
                      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Summary</h3>
                      <div className="grid gap-2 text-sm md:grid-cols-3">
                        <p><span className="font-medium">Decision:</span> {detailQuery.data.decision.decisionId}</p>
                        <p><span className="font-medium">Status:</span> {detailQuery.data.decision.decisionStatus}</p>
                        <p><span className="font-medium">Channel:</span> {detailQuery.data.decision.channel || "-"}</p>
                        <p><span className="font-medium">Recorded:</span> {formatDateTime(detailQuery.data.decision.eventRecordedAt)}</p>
                        <p><span className="font-medium">Served/HTTP:</span> {detailQuery.data.decision.served ? "served" : "not served"} / {detailQuery.data.decision.httpStatus ?? "-"}</p>
                        <p><span className="font-medium">Latency:</span> {formatDuration(detailQuery.data.decision.latencyMs)}</p>
                      </div>
                    </section>

                    <section>
                      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Presented Offers</h3>
                      {detailQuery.data.normalized.presentedOffers.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No presented offers.</p>
                      ) : (
                        <div className="overflow-x-auto rounded-md border">
                          <table className="w-full text-sm">
                            <thead className="text-xs uppercase tracking-wide text-muted-foreground">
                              <tr className="border-b">
                                <th className="px-2 py-2">Offer</th>
                                <th className="px-2 py-2">Type</th>
                                <th className="px-2 py-2">Room</th>
                                <th className="px-2 py-2">Rate</th>
                                <th className="px-2 py-2">Total</th>
                                <th className="px-2 py-2">Basis</th>
                                <th className="px-2 py-2">Cancellation</th>
                              </tr>
                            </thead>
                            <tbody>
                              {detailQuery.data.normalized.presentedOffers.map((offer, index) => (
                                <tr key={`${offer.offerId}-${index}`} className="border-b align-top">
                                  <td className="px-2 py-2">{offer.offerId}</td>
                                  <td className="px-2 py-2">{offer.type ?? "-"}</td>
                                  <td className="px-2 py-2">{offer.roomTypeName ?? offer.roomTypeId ?? "-"}</td>
                                  <td className="px-2 py-2">{offer.ratePlanName ?? offer.ratePlanId ?? "-"}</td>
                                  <td className="px-2 py-2">{formatCurrency(offer.totalPrice)}</td>
                                  <td className="px-2 py-2">{offer.basis ?? "-"}</td>
                                  <td className="px-2 py-2">{offer.cancellationSummary ?? offer.policySummary ?? "-"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </section>

                    <section>
                      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Why</h3>
                      <div className="mb-2 flex flex-wrap gap-1">
                        {detailQuery.data.normalized.globalReasonCodes.map((code) => (
                          <Badge key={code} variant="secondary">{code}</Badge>
                        ))}
                      </div>
                      {detailQuery.data.normalized.selectionSummary ? (
                        <p className="mb-2 text-sm">{detailQuery.data.normalized.selectionSummary}</p>
                      ) : null}
                      <div className="space-y-2">
                        {detailQuery.data.normalized.presentedOffers.map((offer, index) => {
                          const reasons = detailQuery.data.normalized.reasonsByOfferId?.[offer.offerId] ?? [];
                          return (
                            <div key={`why-${offer.offerId}-${index}`} className="rounded-md border p-2 text-sm">
                              <p className="font-medium">{offer.offerId}</p>
                              {reasons.length > 0 ? (
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {reasons.map((reason) => (
                                    <Badge key={`${offer.offerId}-${reason}`} variant="outline">{reason}</Badge>
                                  ))}
                                </div>
                              ) : (
                                <p className="mt-1 text-xs text-muted-foreground">No offer-specific reasons.</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </section>

                    <section>
                      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Top Candidates (max 10)</h3>
                      {(detailQuery.data.normalized.topCandidates ?? []).length === 0 ? (
                        <p className="text-sm text-muted-foreground">No candidate table available.</p>
                      ) : (
                        <div className="overflow-x-auto rounded-md border">
                          <table className="w-full text-sm">
                            <thead className="text-xs uppercase tracking-wide text-muted-foreground">
                              <tr className="border-b">
                                <th className="px-2 py-2">Rank</th>
                                <th className="px-2 py-2">Offer</th>
                                <th className="px-2 py-2">Room</th>
                                <th className="px-2 py-2">Rate</th>
                                <th className="px-2 py-2">Score</th>
                                <th className="px-2 py-2">Total</th>
                                <th className="px-2 py-2">Flags</th>
                              </tr>
                            </thead>
                            <tbody>
                              {detailQuery.data.normalized.topCandidates?.slice(0, 10).map((candidate, index) => {
                                const isPresented = detailQuery.data.normalized.presentedOffers.some((offer) =>
                                  matchesOffer(candidate, offer),
                                );

                                return (
                                  <tr key={`${candidate.offerId ?? "candidate"}-${index}`} className={cn("border-b align-top", isPresented ? "bg-primary/5" : "")}>
                                    <td className="px-2 py-2">{candidate.rank ?? index + 1}</td>
                                    <td className="px-2 py-2">{candidate.offerId ?? "-"}</td>
                                    <td className="px-2 py-2">{candidate.roomTypeId ?? "-"}</td>
                                    <td className="px-2 py-2">{candidate.ratePlanId ?? "-"}</td>
                                    <td className="px-2 py-2">{candidate.score ?? "-"}</td>
                                    <td className="px-2 py-2">{formatCurrency(candidate.totalPrice)}</td>
                                    <td className="px-2 py-2">{isPresented ? <Badge>Presented</Badge> : "-"}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </section>

                    <details open={shouldExpandTimeline} className="rounded-md border p-3">
                      <summary className="cursor-pointer text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        Timeline
                      </summary>
                      <div className="mt-3 space-y-2">
                        {detailQuery.data.events.map((event) => (
                          <div key={event.eventId} className="rounded-md border p-2 text-sm">
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                              <Badge variant="outline">{event.eventType}</Badge>
                              {event.outbox ? (
                                <Badge variant={getOutboxBadgeVariant(event.outbox.state)}>{event.outbox.state}</Badge>
                              ) : null}
                            </div>
                            <div className="grid gap-1 md:grid-cols-2">
                              <p><span className="font-medium">Recorded:</span> {formatDateTime(event.eventRecordedAt)}</p>
                              <p><span className="font-medium">Engine:</span> {event.engineVersion}</p>
                              <p><span className="font-medium">Config:</span> {event.configVersion}</p>
                              <p><span className="font-medium">Attempts:</span> {event.outbox?.attempts ?? "-"}</p>
                            </div>
                            {event.errorSafeMessage ? (
                              <p className="mt-1 text-xs text-muted-foreground">{event.errorCode}: {event.errorSafeMessage}</p>
                            ) : null}
                            {event.outbox?.lastErrorSafeMessage ? (
                              <p className="mt-1 text-xs text-muted-foreground">Outbox: {event.outbox.lastErrorSafeMessage}</p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </details>

                    <details className="rounded-md border p-3">
                      <summary className="cursor-pointer text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        Raw JSON
                      </summary>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(detailQuery.data.normalized.resolvedRequest)}
                        >
                          Copy request payload
                        </Button>
                      </div>
                      <details className="mt-3 rounded-md border p-2">
                        <summary className="cursor-pointer text-xs font-medium">Core payload</summary>
                        <pre className="mt-2 overflow-auto text-xs">{JSON.stringify(detailQuery.data.normalized.rawCorePayload ?? {}, null, 2)}</pre>
                      </details>
                      <details className="mt-2 rounded-md border p-2">
                        <summary className="cursor-pointer text-xs font-medium">Debug payload</summary>
                        <pre className="mt-2 overflow-auto text-xs">{JSON.stringify(detailQuery.data.normalized.rawDebugPayload ?? {}, null, 2)}</pre>
                      </details>
                    </details>
                  </div>
                )}
              </ScrollArea>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
