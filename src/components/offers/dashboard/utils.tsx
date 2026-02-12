import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { ParsedOfferCard, OffersDraft } from "@/lib/offers-demo";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value ?? null, null, 2);
  } catch {
    return "Unable to stringify value.";
  }
}

export function toString(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number") {
    return String(value);
  }
  return "";
}

export function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

export function toBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") {
      return true;
    }
    if (value.toLowerCase() === "false") {
      return false;
    }
  }
  return null;
}

export function firstNumber(...values: unknown[]): number | null {
  for (const value of values) {
    const numeric = toNumber(value);
    if (numeric !== null) {
      return numeric;
    }
  }
  return null;
}

export function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

export function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean);
  }
  if (typeof value === "string") {
    return [value];
  }
  return [];
}

export function formatMoney(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return "n/a";
  }
  return `$${value.toFixed(2)}`;
}

export function scoreCell(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return "-";
  }
  return value.toFixed(2);
}

export function renderPriceDelta(primary: ParsedOfferCard | null, secondary: ParsedOfferCard | null): string {
  if (!primary || !secondary || primary.totalPrice === null || secondary.totalPrice === null || primary.totalPrice === 0) {
    return "n/a";
  }

  const amount = secondary.totalPrice - primary.totalPrice;
  const percent = (amount / primary.totalPrice) * 100;
  return `${percent.toFixed(2)}% / ${amount >= 0 ? "+" : "-"}$${Math.abs(amount).toFixed(2)}`;
}

export function inferLeadTimeDays(checkIn: string): number | null {
  if (!checkIn) {
    return null;
  }
  const target = new Date(checkIn);
  if (Number.isNaN(target.getTime())) {
    return null;
  }
  const now = new Date();
  const ms = target.getTime() - now.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

export function inferTripTypeFromDraft(draft: OffersDraft): string {
  if (Number(draft.children) > 0 || draft.roomOccupancies.some((room) => room.children > 0)) {
    return "family";
  }
  if (Number(draft.adults) <= 1) {
    return "solo";
  }
  return "couple";
}

export function countObjectKeys(value: unknown): number {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return 0;
  }
  return Object.keys(value).length;
}

export function toPercent(value: number, base: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(base) || base <= 0) {
    return 0;
  }
  return Number(((value / base) * 100).toFixed(1));
}

export function toBooleanText(value: unknown): string {
  const parsed = toBoolean(value);
  if (parsed === null) {
    return "unknown";
  }
  return parsed ? "true" : "false";
}

export function toNumericText(value: unknown): string {
  const parsed = toNumber(value);
  return parsed === null ? "unknown" : String(parsed);
}

export function toPassFailText(value: unknown): string {
  const parsed = toBoolean(value);
  if (parsed === null) {
    return "unknown";
  }
  return parsed ? "pass" : "fail";
}

export function renderGuardrailSummary(selectionSummary: Record<string, unknown>): string {
  const percent = firstNumber(selectionSummary.guardrailPercent, selectionSummary.guardrail_percent);
  const amount = firstNumber(selectionSummary.guardrailAmount, selectionSummary.guardrail_amount);

  if (percent === null && amount === null) {
    return "No explicit guardrail checks returned.";
  }

  const parts = [
    percent === null ? null : `${percent}%`,
    amount === null ? null : `$${amount}`,
  ].filter(Boolean);

  return parts.join(" / ");
}

export function renderDecisionTrace(decisionTrace: unknown): string {
  if (typeof decisionTrace === "string" && decisionTrace.trim()) {
    return decisionTrace;
  }

  if (Array.isArray(decisionTrace)) {
    const joined = decisionTrace.map((entry) => String(entry)).filter(Boolean).join(" -> ");
    return joined || "No decision trace details returned.";
  }

  if (decisionTrace && typeof decisionTrace === "object") {
    return "Decision trace returned in structured form; inspect Raw JSON for full details.";
  }

  return "No decision trace details returned.";
}
