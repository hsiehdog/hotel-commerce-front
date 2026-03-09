"use client";

import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  AuditOutboxState,
  fetchOffersLogDetail,
  fetchOffersLogs,
} from "@/lib/api-client";
import { ParsedOffersResponse } from "@/lib/offers-demo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { asRecord } from "./dashboard/utils";
import { buildEffectiveConfigRows } from "./dashboard/dashboard-logic";
import { DecisionPanels } from "./dashboard/decision-panels";
import { useOfferPropertyOptions } from "./use-offer-property-options";
import {
  buildRoomFallbackFromRow,
  formatBasicOfferDetails,
  formatPrimaryOfferName,
  formatPrimaryOfferTotal,
  formatPropertyLabel,
  mapDetailToParsedOffersResponse,
  toRecordOrNull,
  type BasicOfferDetails,
} from "./offers-logs-dashboard-helpers";

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

function getOutboxBadgeVariant(state?: AuditOutboxState | null): "outline" | "secondary" | "destructive" {
  if (state === "DLQ") {
    return "destructive";
  }
  if (state === "PROCESSED") {
    return "secondary";
  }
  return "outline";
}

export function OffersLogsDashboard() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [propertyId, setPropertyId] = useState("");
  const [selectedDecisionId, setSelectedDecisionId] = useState(
    () => searchParams.get("selectedDecisionId") ?? "",
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [expandedCandidate, setExpandedCandidate] = useState<string | null>(null);
  const { defaultPropertyId, propertyOptions } = useOfferPropertyOptions("offer-log-properties");
  const selectedPropertyId = propertyOptions.some((property) => property.propertyId === propertyId)
    ? propertyId
    : defaultPropertyId;

  const listQuery = useInfiniteQuery({
    queryKey: ["offer-logs", selectedPropertyId],
    queryFn: ({ pageParam }) =>
      fetchOffersLogs({
        propertyId: selectedPropertyId,
        from: ALL_TIME_FROM_ISO,
        to: ALL_TIME_TO_ISO,
        cursor: pageParam as string | undefined,
        limit: 25,
      }),
    enabled: Boolean(selectedPropertyId),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.pageInfo.hasMore ? lastPage.pageInfo.nextCursor : undefined),
  });

  const rows = useMemo(
    () => listQuery.data?.pages.flatMap((page) => page.rows) ?? [],
    [listQuery.data?.pages],
  );

  const detailQuery = useQuery({
    queryKey: ["offer-log-detail", selectedDecisionId],
    queryFn: () => fetchOffersLogDetail(selectedDecisionId, { includeRawPayloads: true, payloadCapKb: 512 }),
    enabled: Boolean(selectedDecisionId),
  });

  function openDetail(decisionId: string) {
    setSelectedDecisionId(decisionId);
    setIsDrawerOpen(true);
    setExpandedCandidate(null);
    void queryClient.fetchQuery({
      queryKey: ["offer-log-detail", decisionId],
      queryFn: () =>
        fetchOffersLogDetail(decisionId, {
          includeRawPayloads: true,
          payloadCapKb: 512,
        }),
    });
  }

  const parsedDetailResponse = useMemo(
    () => (detailQuery.data ? mapDetailToParsedOffersResponse(detailQuery.data) : null),
    [detailQuery.data],
  );
  const selectedRow = useMemo(
    () => rows.find((row) => row.decisionId === selectedDecisionId),
    [rows, selectedDecisionId],
  );
  const decisionSummaryRoom = useMemo(
    () => parsedDetailResponse?.recommendedRoom ?? buildRoomFallbackFromRow(selectedRow),
    [parsedDetailResponse?.recommendedRoom, selectedRow],
  );
  const parsedDetailForView = useMemo(
    (): ParsedOffersResponse | null => {
      if (parsedDetailResponse) {
        return {
          ...parsedDetailResponse,
          recommendedRoom: decisionSummaryRoom,
        };
      }

      if (!decisionSummaryRoom) {
        return null;
      }

      return {
        propertyId: selectedRow?.propertyId ?? "-",
        channel: selectedRow?.channel ?? "-",
        currency: selectedRow?.primaryOfferCurrency ?? "USD",
        priceBasisUsed: "-",
        configVersion: "-",
        personaConfidence: {},
        recommendedRoom: decisionSummaryRoom,
        recommendedOffers: [],
        upgradeLadder: [],
        rankedRooms: [],
        fallback: null,
        propertyContext: {
          propertyId: selectedRow?.propertyId ?? "-",
          currency: selectedRow?.primaryOfferCurrency ?? "USD",
          strategyMode: "-",
          timezone: "-",
          policies: [],
          capabilities: [],
        },
        debug: {
          resolvedRequest: null,
          profilePreAri: null,
          profileFinal: null,
          scoring: null,
          selectionSummary: null,
        },
        raw: {
          decision: detailQuery.data?.decision ?? null,
          events: detailQuery.data?.events ?? [],
          normalized: detailQuery.data?.normalized ?? {},
          generateResponse: detailQuery.data?.generateResponse ?? null,
        },
      };
    },
    [decisionSummaryRoom, detailQuery.data, parsedDetailResponse, selectedRow],
  );
  const requestPayload = toRecordOrNull(parsedDetailResponse?.debug.resolvedRequest ?? null);
  const effectiveConfigRows = useMemo(
    () => buildEffectiveConfigRows(parsedDetailResponse, requestPayload),
    [parsedDetailResponse, requestPayload],
  );
  const scoringWeights = useMemo(
    () => asRecord(asRecord(parsedDetailResponse?.debug.scoring).weights),
    [parsedDetailResponse],
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
                value={selectedPropertyId}
                onChange={(event) => {
                  setPropertyId(event.target.value);
                  setSelectedDecisionId("");
                  setIsDrawerOpen(false);
                  setExpandedCandidate(null);
                }}
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
          {!selectedPropertyId ? (
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
                      <th className="px-2 py-2">User Details</th>
                      <th className="px-2 py-2">Created Outbox</th>
                      <th className="px-2 py-2">Offer Name</th>
                      <th className="px-2 py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      const resolvedBasic: BasicOfferDetails = {
                        checkIn: row.checkIn ?? null,
                        checkOut: row.checkOut ?? null,
                        rooms: row.rooms ?? null,
                        adults: row.adults ?? null,
                        children: row.children ?? null,
                      };
                      const primaryName = formatPrimaryOfferName(row);
                      const primaryTotal = row.primaryOfferTotal ?? row.primaryOfferTotalPrice ?? null;
                      const createdOutboxState = row.createdOutbox?.state ?? row.createdEventOutboxState;
                      return (
                        <tr
                          key={row.decisionId}
                          className={cn(
                            "cursor-pointer border-b align-top transition hover:bg-muted/50",
                            selectedDecisionId === row.decisionId ? "bg-muted/40" : "",
                          )}
                          onClick={() => openDetail(row.decisionId)}
                        >
                          <td className="px-2 py-3">{formatDateTimeWithoutSeconds(row.recordedAt ?? row.eventRecordedAt)}</td>
                          <td className="px-2 py-3">{row.channel || "-"}</td>
                          <td className="px-2 py-3">{formatPropertyLabel(row.property || row.propertyId || "-")}</td>
                          <td className="px-2 py-3 break-words">{formatBasicOfferDetails(resolvedBasic)}</td>
                          <td className="px-2 py-3">
                            {createdOutboxState ? (
                              <Badge variant={getOutboxBadgeVariant(createdOutboxState)}>{createdOutboxState}</Badge>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="px-2 py-3">{primaryName}</td>
                          <td className="px-2 py-3">{formatPrimaryOfferTotal(primaryTotal)}</td>
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
                ) : parsedDetailForView ? (
                  <DecisionPanels
                    parsedResponse={parsedDetailForView}
                    scoringWeights={scoringWeights}
                    requestPayload={requestPayload}
                    rawResponse={parsedDetailForView.raw}
                    effectiveConfigRows={effectiveConfigRows}
                    expandedCandidate={expandedCandidate}
                    setExpandedCandidate={setExpandedCandidate}
                    showFullScore
                    showRawJson={false}
                  />
                ) : null}
              </ScrollArea>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
