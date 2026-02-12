"use client";

import { Dispatch, SetStateAction, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  OffersDraft,
  scenarioPresets,
} from "@/lib/offers-demo";
import { safeStringify } from "./utils";

interface RequestFormProps {
  draft: OffersDraft;
  setDraft: Dispatch<SetStateAction<OffersDraft>>;
  isSubmitting: boolean;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
  formErrors: string[];
  apiError: string | null;
  isAdvanced: boolean;
  setIsAdvanced: (v: boolean) => void;
  onApplyPreset: (id: string) => void;
  requestPreview: unknown;
}

export function RequestForm({
  draft,
  setDraft,
  isSubmitting,
  onSubmit,
  onReset,
  formErrors,
  apiError,
  isAdvanced,
  setIsAdvanced,
  onApplyPreset,
  requestPreview,
}: RequestFormProps) {
  function handleChildrenChange(value: string) {
    const parsed = Number(value);
    const nextChildren = Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;

    setDraft((prev) => {
      const nextAges = [...prev.child_ages];
      if (nextAges.length > nextChildren) {
        nextAges.length = nextChildren;
      }
      while (nextAges.length < nextChildren) {
        nextAges.push(0);
      }

      return {
        ...prev,
        children: String(nextChildren),
        child_ages: nextAges,
      };
    });
  }

  function handleRoomsChange(value: string) {
    const parsed = Number(value);
    const nextRooms = Number.isFinite(parsed) ? Math.max(1, Math.floor(parsed)) : 1;

    setDraft((prev) => {
      const nextOccupancies = [...prev.roomOccupancies];
      if (nextOccupancies.length > nextRooms) {
        nextOccupancies.length = nextRooms;
      }
      while (nextOccupancies.length < nextRooms) {
        nextOccupancies.push({ adults: 1, children: 0 });
      }

      return {
        ...prev,
        rooms: String(nextRooms),
        roomOccupancies: nextOccupancies,
      };
    });
  }

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <Card className="border-muted bg-gradient-to-br from-background via-background to-muted/20">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-xl">Request</CardTitle>
              <CardDescription>
                Configure the guest intent.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={!isAdvanced ? "default" : "outline"}
                onClick={() => setIsAdvanced(false)}
              >
                Basic
              </Button>
              <Button
                type="button"
                size="sm"
                variant={isAdvanced ? "default" : "outline"}
                onClick={() => setIsAdvanced(true)}
              >
                Adv
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <section className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Scenarios</p>
            <div className="flex flex-wrap gap-2">
              {scenarioPresets.map((preset) => (
                <Button
                  key={preset.id}
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => onApplyPreset(preset.id)}
                  title={preset.description}
                  className="h-7 text-xs"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Details</p>
            <div className="grid gap-3">
              <div className="space-y-1">
                <Label htmlFor="property_id" className="text-xs">property_id</Label>
                <select
                  id="property_id"
                  value={draft.property_id}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, property_id: event.target.value }))
                  }
                  className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:ring-[3px]"
                >
                  <option value="demo_property">demo_property</option>
                  <option value="inn_at_mount_shasta">inn_at_mount_shasta</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="check_in" className="text-xs">check_in</Label>
                  <Input
                    id="check_in"
                    type="date"
                    className="h-9"
                    value={draft.check_in}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, check_in: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="check_out" className="text-xs">check_out</Label>
                  <Input
                    id="check_out"
                    type="date"
                    className="h-9"
                    value={draft.check_out}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, check_out: event.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                 <div className="space-y-1">
                  <Label htmlFor="rooms" className="text-xs">rooms</Label>
                  <Input
                    id="rooms"
                    type="number"
                    min={1}
                    className="h-9"
                    value={draft.rooms}
                    onChange={(event) => handleRoomsChange(event.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="adults" className="text-xs">adults</Label>
                  <Input
                    id="adults"
                    type="number"
                    min={1}
                    className="h-9"
                    value={draft.adults}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, adults: event.target.value }))
                    }
                  />
                </div>
                 <div className="space-y-1">
                  <Label htmlFor="children" className="text-xs">children</Label>
                  <Input
                    id="children"
                    type="number"
                    min={0}
                    className="h-9"
                    value={draft.children}
                    onChange={(event) => handleChildrenChange(event.target.value)}
                  />
                </div>
              </div>
            </div>

            {draft.child_ages.length > 0 && (
              <div className="space-y-1">
                <Label className="text-xs">child_ages</Label>
                <div className="grid grid-cols-4 gap-2">
                  {draft.child_ages.map((age, index) => (
                    <Input
                      key={`child-age-${index}`}
                      type="number"
                      min={0}
                      className="h-8 text-xs"
                      value={age}
                      onChange={(event) => {
                        const nextAge = Number(event.target.value || 0);
                        setDraft((prev) => {
                          const nextAges = [...prev.child_ages];
                          nextAges[index] = Number.isFinite(nextAge) ? nextAge : 0;
                          return {
                            ...prev,
                            child_ages: nextAges,
                          };
                        });
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            
            <div className="space-y-2 rounded-md border bg-muted/10 p-3">
              <p className="text-xs font-semibold text-muted-foreground">Constraints</p>
              <div className="grid grid-cols-2 gap-y-2 gap-x-1">
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={draft.pet_friendly}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, pet_friendly: event.target.checked }))
                    }
                    className="h-3.5 w-3.5 rounded border-input"
                  />
                  pet_friendly
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={draft.accessible_room}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, accessible_room: event.target.checked }))
                    }
                    className="h-3.5 w-3.5 rounded border-input"
                  />
                  accessible
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={draft.needs_two_beds}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, needs_two_beds: event.target.checked }))
                    }
                    className="h-3.5 w-3.5 rounded border-input"
                  />
                  two_beds
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={draft.parking_needed}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, parking_needed: event.target.checked }))
                    }
                    className="h-3.5 w-3.5 rounded border-input"
                  />
                  parking
                </label>
              </div>
            </div>
          </section>

          {isAdvanced && (
            <section className="space-y-3 rounded-md border bg-muted/10 p-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Advanced</p>
              <div className="space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="stub_scenario" className="text-xs">Demo scenario</Label>
                  <Input
                    id="stub_scenario"
                    className="h-8 text-xs"
                    value={draft.stub_scenario}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, stub_scenario: event.target.value }))
                    }
                    placeholder="price_sensitive_guest"
                  />
                </div>
                 <div className="space-y-1">
                  <Label htmlFor="channel" className="text-xs">channel</Label>
                  <select
                    id="channel"
                    value={draft.channel}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        channel: event.target.value as OffersDraft["channel"],
                      }))
                    }
                    className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none focus-visible:ring-[3px]"
                  >
                    <option value="web">web</option>
                    <option value="voice">voice</option>
                    <option value="agent">agent</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="extra-json" className="text-xs">JSON Override</Label>
                <Textarea
                  id="extra-json"
                  value={draft.extraJson}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, extraJson: event.target.value }))
                  }
                  placeholder='{"force_fallback":true}'
                  className="min-h-24 font-mono text-[10px] leading-tight"
                />
              </div>
            </section>
          )}

          {formErrors.length > 0 && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
              <p className="font-medium">Validation error:</p>
              <ul className="mt-1 list-disc space-y-1 pl-4">
                {formErrors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {apiError && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
              {apiError}
            </div>
          )}

          <div className="flex flex-col gap-2 pt-2">
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Running..." : "Run Decision"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="text-muted-foreground"
            >
              Reset to defaults
            </Button>
          </div>

          <div className="mt-4 border-t pt-4">
            <details className="text-xs">
              <summary className="cursor-pointer font-medium text-muted-foreground hover:text-foreground">
                Live request preview
              </summary>
               <pre className="mt-2 max-h-48 overflow-auto rounded-md border bg-muted/30 p-2 font-mono text-[10px]">
                {safeStringify(requestPreview)}
              </pre>
            </details>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
