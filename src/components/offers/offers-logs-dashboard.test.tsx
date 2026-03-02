import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OffersLogsDashboard } from "@/components/offers/offers-logs-dashboard";
import * as apiClient from "@/lib/api-client";

const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/demo/offers/logs",
  useRouter: () => ({ replace: replaceMock }),
  useSearchParams: () => new URLSearchParams(""),
}));

vi.mock("@/lib/api-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api-client")>(
    "@/lib/api-client",
  );

  return {
    ...actual,
    fetchProperties: vi.fn(),
    fetchOffersLogs: vi.fn(),
    fetchOffersLogDetail: vi.fn(),
  };
});

const mockedFetchProperties = vi.mocked(apiClient.fetchProperties);
const mockedFetchOffersLogs = vi.mocked(apiClient.fetchOffersLogs);
const mockedFetchOffersLogDetail = vi.mocked(apiClient.fetchOffersLogDetail);

function renderDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(createDashboardTree(queryClient));
}

function createDashboardTree(queryClient: QueryClient) {
  return (
    <QueryClientProvider client={queryClient}>
      <OffersLogsDashboard />
    </QueryClientProvider>
  );
}

describe("OffersLogsDashboard", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    mockedFetchProperties.mockReset();
    mockedFetchOffersLogs.mockReset();
    mockedFetchOffersLogDetail.mockReset();

    mockedFetchProperties.mockResolvedValue([
      { propertyId: "demo_hotel_sf", name: "Demo Hotel San Francisco" },
      { propertyId: "demo_hotel_nyc", name: "Demo Hotel New York" },
    ]);
  });

  it("auto-selects first property and loads decision rows", async () => {
    mockedFetchOffersLogs.mockResolvedValue({
      serverNow: new Date().toISOString(),
      pageInfo: {
        hasMore: false,
        limit: 25,
      },
      rows: [
        {
          decisionId: "decision-1",
          requestId: "request-1",
          propertyId: "demo_hotel_sf",
          tenantId: "tenant-1",
          eventRecordedAt: new Date().toISOString(),
          channel: "web",
          decisionStatus: "OK",
          offersCount: 2,
          truncated: false,
          served: true,
          servedSuccess: true,
          reasonCodes: ["selection_margin_priority"],
          reasonCodesCount: 1,
          reasonCodesTruncated: false,
          latencyMs: 950,
          decisionAgeMs: 3_000,
          createdEventOutboxState: "PROCESSED",
        },
      ],
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("selection_margin_priority")).toBeTruthy();
    });

    await waitFor(() => {
      expect(mockedFetchOffersLogs).toHaveBeenCalled();
    });

    expect(mockedFetchOffersLogs).toHaveBeenCalledWith(
      expect.objectContaining({
        propertyId: "demo_hotel_sf",
      }),
    );
  });

  it("does not emit hydration mismatch when time changes between server and client", async () => {
    mockedFetchOffersLogs.mockResolvedValue({
      serverNow: new Date().toISOString(),
      pageInfo: {
        hasMore: false,
        limit: 25,
      },
      rows: [],
    });

    mockedFetchProperties.mockResolvedValue([]);

    vi.useFakeTimers();
    let errorSpy: ReturnType<typeof vi.spyOn> | undefined;
    let root: ReturnType<typeof hydrateRoot> | undefined;

    try {
      vi.setSystemTime(new Date("2026-03-01T10:16:53.000Z"));

      const serverTree = createDashboardTree(new QueryClient({
        defaultOptions: { queries: { retry: false } },
      }));
      const html = renderToString(serverTree);

      const container = document.createElement("div");
      container.innerHTML = html;

      errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      vi.setSystemTime(new Date("2026-03-01T10:16:54.000Z"));

      await act(async () => {
        root = hydrateRoot(
          container,
          createDashboardTree(new QueryClient({
            defaultOptions: { queries: { retry: false } },
          })),
        );
        await Promise.resolve();
      });

      expect(
        errorSpy.mock.calls.some(([value]) =>
          String(value).includes("Hydration failed because the server rendered text didn't match the client"),
        ),
      ).toBe(false);
    } finally {
      await act(async () => {
        root?.unmount();
      });
      errorSpy?.mockRestore();
      vi.useRealTimers();
    }
  });

  it("opens detail drawer with presented offers, why, candidates, and timeline", async () => {
    const user = userEvent.setup();

    mockedFetchOffersLogs.mockResolvedValue({
      serverNow: new Date().toISOString(),
      pageInfo: {
        hasMore: false,
        limit: 25,
      },
      rows: [
        {
          decisionId: "decision-2",
          requestId: "request-2",
          propertyId: "demo_hotel_sf",
          tenantId: "tenant-1",
          eventRecordedAt: new Date().toISOString(),
          channel: "voice",
          decisionStatus: "FALLBACK_ONLY",
          offersCount: 1,
          truncated: true,
          served: false,
          servedSuccess: false,
          reasonCodes: ["fallback_waitlist"],
          reasonCodesCount: 1,
          reasonCodesTruncated: false,
          latencyMs: 2500,
          decisionAgeMs: 20_000,
          createdEventOutboxState: "DLQ",
        },
      ],
    });

    mockedFetchOffersLogDetail.mockResolvedValue({
      decision: {
        decisionId: "decision-2",
        tenantId: "tenant-1",
        propertyId: "demo_hotel_sf",
        requestId: "request-2",
        channel: "voice",
        offersCount: 1,
        decisionStatus: "FALLBACK_ONLY",
        reasonCodes: ["fallback_waitlist"],
        truncated: true,
        eventRecordedAt: new Date().toISOString(),
        served: false,
        servedSuccess: false,
        latencyMs: 2500,
      },
      createdEventCount: 2,
      selectedCreatedEventId: "event-created-2",
      selectedCreatedEventRecordedAt: new Date().toISOString(),
      integrityFlags: {
        multipleCreatedEvents: true,
      },
      normalizationWarnings: ["Normalized from legacy payload path."],
      events: [
        {
          eventId: "event-created-2",
          eventType: "decision.created",
          eventKey: "key-1",
          schemaMajor: 1,
          schemaMinor: 0,
          engineVersion: "1.2.3",
          configVersion: 7,
          truncated: false,
          truncationFields: [],
          eventRecordedAt: new Date().toISOString(),
          outbox: {
            state: "DLQ",
            attempts: 3,
            lastErrorSafeMessage: "worker retry limit reached",
          },
        },
      ],
      normalized: {
        reasonDetailsVersion: 1,
        globalReasonCodes: ["fallback_waitlist"],
        selectionSummary: "Fallback path selected due to guardrail miss.",
        reasonDetails: { global: ["fallback_waitlist"] },
        reasonsByOfferId: {
          "offer-voice": ["fallback_waitlist"],
        },
        presentedOffers: [
          {
            offerId: "offer-voice",
            roomTypeId: "rt-1",
            ratePlanId: "rp-1",
            roomTypeName: "King",
            ratePlanName: "Flexible",
            totalPrice: 199,
            currency: "USD",
          },
        ],
        topCandidates: [
          {
            roomTypeId: "rt-1",
            ratePlanId: "rp-1",
            rank: 1,
            score: 0.8,
            totalPrice: 199,
            currency: "USD",
          },
        ],
        engineVersion: "1.2.3",
        configVersion: 7,
        artifactVersionsJson: { scorer: "v4" },
      },
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("fallback_waitlist")).toBeTruthy();
    });

    const fallbackReasonCell = screen.getByText("fallback_waitlist");
    const row = fallbackReasonCell.closest("tr");
    expect(row).toBeTruthy();
    await user.click(row as HTMLElement);

    await waitFor(() => {
      expect(mockedFetchOffersLogDetail).toHaveBeenCalledWith(
        "decision-2",
        expect.objectContaining({ includeRawPayloads: false }),
      );
    });

    expect(screen.getByText("Decision Detail")).toBeTruthy();
    expect(screen.getByText("Presented Offers")).toBeTruthy();
    expect(screen.getByText("Fallback path selected due to guardrail miss.")).toBeTruthy();
    expect(screen.getByText("Presented")).toBeTruthy();
    const outboxErrorMatches = screen.getAllByText((_, node) =>
      node?.textContent?.includes("worker retry limit reached") ?? false,
    );
    expect(outboxErrorMatches.length).toBeGreaterThan(0);
  });
});
