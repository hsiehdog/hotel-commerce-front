"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UpgradeLadderEntry } from "@/lib/offers-demo";
import { formatMoney, scoreCell } from "./utils";

type UpgradeLadderCardProps = {
  entries: UpgradeLadderEntry[];
};

const upgradeLevelLabels: Record<Exclude<UpgradeLadderEntry["upgradeLevel"], "">, string> = {
  next_step: "Next Step",
  premium_step: "Premium",
  top_step: "Top Tier",
};

export function UpgradeLadderCard({ entries }: UpgradeLadderCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Upgrade Ladder</CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No room upgrades returned above the recommended room.</p>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => <UpgradeLadderEntryCard key={`${entry.roomTypeId}-${entry.ratePlanId}`} entry={entry} />)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function UpgradeLadderEntryCard({ entry }: { entry: UpgradeLadderEntry }) {
  const upgradeReasons = getUpgradeReasons(entry);

  return (
    <div className="rounded-md border p-3 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="font-medium">
            {entry.roomType} | {entry.ratePlan}
          </p>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>Total: {formatMoney(entry.totalPrice)}</span>
            <span>Delta: {formatMoney(entry.priceDeltaPerNight)}/night</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {entry.upgradeLevel ? (
            <Badge variant="outline">{upgradeLevelLabels[entry.upgradeLevel]}</Badge>
          ) : null}
          <Badge variant="secondary">{scoreCell(entry.ladderScore)}</Badge>
        </div>
      </div>

      {entry.roomDescription ? (
        <p className="mt-3 text-xs text-foreground">{entry.roomDescription}</p>
      ) : null}

      {upgradeReasons.length > 0 ? (
        <div className="mt-3 border-t pt-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Why upgrade
          </p>
          <ul className="list-disc pl-4 text-xs text-muted-foreground">
            {upgradeReasons.map((reason) => (
              <li key={`${entry.ratePlanId}-${reason}`}>{reason}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function getUpgradeReasons(entry: UpgradeLadderEntry): string[] {
  return entry.reasons.length > 0 ? entry.reasons : entry.benefitSummary;
}
