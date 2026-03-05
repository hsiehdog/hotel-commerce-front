"use client";

import { Fragment } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ParsedOffersResponse } from "@/lib/offers-demo";
import { cn, formatMoney, safeStringify, scoreCell } from "./utils";

type CandidateAnalysisProps = {
  expandedCandidate: string | null;
  setExpandedCandidate: (value: string | null | ((current: string | null) => string | null)) => void;
  parsedResponse: ParsedOffersResponse;
};

const DISPLAY_TOKEN_MAP: Record<string, string> = {
  ACC: "Accessible",
  KING: "King",
  QN: "Queen",
  FLEX: "Flexible",
  PAYNOW: "Pay Now",
  PREMIER: "Premier",
  SUITE: "Suite",
  BUNK: "Bunk",
};

function isCodeLikeLabel(value: string): boolean {
  return /^[A-Z0-9_]+$/.test(value.trim());
}

function formatIdentifierLabel(value: string, kind: "room" | "ratePlan"): string {
  const normalized = value
    .replace(/^rt_/i, "")
    .replace(/^rp_/i, "")
    .trim();
  const tokens = normalized.split(/[_-]+/).filter(Boolean);

  const mapped = tokens.map((token) => {
    const upper = token.toUpperCase();
    if (DISPLAY_TOKEN_MAP[upper]) {
      return DISPLAY_TOKEN_MAP[upper];
    }
    return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
  });

  if (
    kind === "room" &&
    mapped.length > 0 &&
    !mapped.includes("Room") &&
    ["King", "Queen", "Accessible"].some((token) => mapped.includes(token))
  ) {
    mapped.push("Room");
  }

  return mapped.join(" ");
}

function getRoomLabel(roomTypeName: string, roomTypeId: string): string {
  if (roomTypeName && roomTypeName !== "-" && !isCodeLikeLabel(roomTypeName)) {
    return roomTypeName;
  }
  return roomTypeId ? formatIdentifierLabel(roomTypeId, "room") : "-";
}

function getRatePlanLabel(ratePlanId: string): string {
  return ratePlanId ? formatIdentifierLabel(ratePlanId, "ratePlan") : "-";
}

export function CandidateAnalysis({
  expandedCandidate,
  setExpandedCandidate,
  parsedResponse,
}: CandidateAnalysisProps) {
  const rankedRooms = parsedResponse.rankedRooms;
  const recommendedRoom = parsedResponse.recommendedRoom;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Room Ranking</CardTitle>
          <CardDescription>Ranked rooms returned by the offers engine.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full table-fixed text-left text-sm">
              <thead className="bg-muted/50">
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="w-[58%] px-3 py-2 font-medium">Room / Plan / Price</th>
                  <th className="w-[14%] px-3 py-2 font-medium">Score</th>
                  <th className="w-[28%] px-3 py-2 font-medium">Reasons</th>
                </tr>
              </thead>
              <tbody>
                {rankedRooms.map((room, index) => {
                  const rowId = `${room.roomTypeId || room.roomTypeName}-${room.ratePlanId || "rate"}-${index}`;
                  const selected = Boolean(
                    recommendedRoom &&
                      room.roomTypeId === recommendedRoom.roomTypeId &&
                      room.ratePlanId === recommendedRoom.ratePlanId,
                  );
                  const roomLabel = getRoomLabel(room.roomTypeName, room.roomTypeId);
                  const ratePlanLabel = getRatePlanLabel(room.ratePlanId);
                  const reasons =
                    room.reasons.length > 0
                      ? room.reasons
                      : selected && recommendedRoom?.reasons.length
                        ? recommendedRoom.reasons
                        : [];

                  return (
                    <Fragment key={rowId}>
                      <tr
                        className={cn(
                          "border-b transition-colors hover:bg-muted/30",
                          selected && "bg-emerald-50 dark:bg-emerald-950/30",
                        )}
                      >
                        <td className="px-3 py-2 text-xs">
                          <div className="flex items-start gap-3">
                            <div className="flex items-center gap-2 shrink-0">
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={() =>
                                  setExpandedCandidate((prev) => (prev === rowId ? null : rowId))
                                }
                              >
                                {expandedCandidate === rowId ? "▼" : "▶"}
                              </Button>
                              {selected ? <Badge className="h-5 px-1.5 text-[10px]">Sel</Badge> : null}
                            </div>
                            <div className="min-w-0">
                              <span className="block break-words">{roomLabel}</span>
                              <span className="block break-words text-muted-foreground">{ratePlanLabel}</span>
                              <span className="block text-[10px] text-muted-foreground">{formatMoney(room.price)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 font-mono font-bold text-foreground">{scoreCell(room.score)}</td>
                        <td className="px-3 py-2 text-xs">
                          {reasons.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {reasons.map((reason) => (
                                <Badge key={`${rowId}-${reason}`} variant="outline" className="h-5 px-1 text-[10px] font-normal">
                                  {reason}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                      {expandedCandidate === rowId ? (
                        <tr className="bg-muted/10">
                          <td className="px-3 py-3" colSpan={3}>
                            <div className="rounded-md border bg-background p-4 shadow-sm">
                              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Component Scores</p>
                              <pre className="max-h-40 overflow-auto rounded border bg-muted/10 p-2 font-mono text-[10px]">
                                {safeStringify(room.componentScores)}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
                {rankedRooms.length === 0 ? (
                  <tr>
                    <td className="px-3 py-8 text-center text-muted-foreground" colSpan={3}>
                      No ranked rooms returned for this request.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
