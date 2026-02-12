"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "./utils";

export type TimelineStep = {
  id: string;
  label: string;
  state: "green" | "yellow" | "red";
  count: number;
};

interface TimelineNavProps {
  steps: TimelineStep[];
  onStepClick: (id: string) => void;
}

export function TimelineNav({ steps, onStepClick }: TimelineNavProps) {
  return (
    <div className="flex w-full items-center gap-2 overflow-x-auto rounded-lg border bg-background p-2 shadow-sm">
      {steps.map((step, index) => (
        <button
          key={step.id}
          onClick={() => onStepClick(step.id)}
          className="group flex min-w-fit items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-muted"
        >
          <div className="flex flex-col items-start text-left">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-foreground">
              {step.label}
            </span>
          </div>
          <StatusDot state={step.state} />
          {step.count > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
              {step.count}
            </Badge>
          )}
          {index < steps.length - 1 && (
             <div className="ml-2 h-4 w-px bg-border/60" />
          )}
        </button>
      ))}
    </div>
  );
}

function StatusDot({ state }: { state: "green" | "yellow" | "red" }) {
  const className =
    state === "green"
      ? "bg-emerald-500"
      : state === "yellow"
        ? "bg-amber-500"
        : "bg-red-500";

  return <span className={cn("inline-block h-2 w-2 rounded-full", className)} />;
}
