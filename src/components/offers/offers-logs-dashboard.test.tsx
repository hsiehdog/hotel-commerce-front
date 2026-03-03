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

  return render(
    <QueryClientProvider client={queryClient}>
      <OffersLogsDashboard />
    </QueryClientProvider>,
  );
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

  it("loads rows from /offers/logs table fields", async () => {
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
          propertyId: "demo_property",
          property: "demo_property",
          tenantId: "tenant-1",
          eventRecordedAt: new Date().toISOString(),
          recordedAt: new Date().toISOString(),
          channel: "web",
          checkIn: "2026-05-01",
          checkOut: "2026-05-03",
          rooms: 1,
          adults: 2,
          children: 0,
          createdOutbox: {
            state: "PROCESSED",
            attempts: 1,
            lastErrorSafeMessage: null,
          },
          primaryOfferName: "Bunk Suite - Flexible",
          primaryOfferTotal: 451.36,
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
        },
      ],
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Bunk Suite - Flexible")).toBeTruthy();
      expect(screen.getByText("$451.36")).toBeTruthy();
      expect(screen.getByText("PROCESSED")).toBeTruthy();
    });

    expect(mockedFetchOffersLogs).toHaveBeenCalledWith(
      expect.objectContaining({
        propertyId: "demo_property",
        from: "1970-01-01T00:00:00.000Z",
        to: "9999-12-31T23:59:59.999Z",
      }),
    );
  });

  it("shows human-readable property labels with demo_property first", async () => {
    mockedFetchOffersLogs.mockResolvedValue({
      serverNow: new Date().toISOString(),
      pageInfo: {
        hasMore: false,
        limit: 25,
      },
      rows: [],
    });

    renderDashboard();

    const select = await screen.findByLabelText("Property");
    await waitFor(() => {
      const optionValues = Array.from((select as HTMLSelectElement).options).map((option) => option.value);
      const optionLabels = Array.from((select as HTMLSelectElement).options).map((option) => option.textContent);
      expect(optionValues[0]).toBe("demo_property");
      expect(optionValues.slice(1)).toEqual(["demo_hotel_sf", "demo_hotel_nyc"]);
      expect(optionLabels[0]).toBe("Demo Property");
      expect(optionLabels.slice(1)).toEqual(["Demo Hotel San Francisco", "Demo Hotel New York"]);
    });
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

  it("opens detail drawer and maps trip type, weights, and candidate names", async () => {
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
          property: "demo_hotel_sf",
          tenantId: "tenant-1",
          eventRecordedAt: new Date().toISOString(),
          recordedAt: new Date().toISOString(),
          channel: "voice",
          checkIn: "2026-05-01",
          checkOut: "2026-05-03",
          rooms: 1,
          adults: 2,
          children: 0,
          createdOutbox: {
            state: "PROCESSED",
            attempts: 1,
            lastErrorSafeMessage: null,
          },
          primaryOfferName: "Bunk Suite - Flexible",
          primaryOfferTotal: 451.36,
          decisionStatus: "OK",
          offersCount: 2,
          truncated: false,
          served: true,
          servedSuccess: true,
          reasonCodes: ["SELECT_PRIMARY_SAFE"],
          reasonCodesCount: 1,
          reasonCodesTruncated: false,
          latencyMs: 40,
          decisionAgeMs: 100,
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
        offersCount: 2,
        decisionStatus: "OK",
        reasonCodes: ["SELECT_PRIMARY_SAFE"],
        truncated: false,
        eventRecordedAt: new Date().toISOString(),
        served: true,
        servedSuccess: true,
        latencyMs: 40,
      },
      createdEventCount: 1,
      selectedCreatedEventId: "event-created-1",
      selectedCreatedEventRecordedAt: new Date().toISOString(),
      integrityFlags: {
        missingDebugPayload: false,
      },
      events: [],
      normalized: {
        reasonDetailsVersion: 1,
        globalReasonCodes: ["SELECT_PRIMARY_SAFE"],
        selectionSummary: "Primary SAFE",
        reasonDetails: {},
        reasonsByOfferId: null,
        presentedOffers: [
          {
            offerId: "rp_flex",
            roomTypeId: "rt_bunk_suite",
            ratePlanId: "rp_flex",
            roomTypeName: "Bunk Suite",
            ratePlanName: "Flexible",
            type: "SAFE",
            recommended: true,
            totalPrice: 451.36,
            basis: "afterTax",
            policySummary: "You can cancel for free.",
            cancellationSummary: "You can cancel for free.",
            paymentTiming: "pay_at_property",
            enhancements: [
              { id: "fee_pet_per_night", name: "Pet fee", price: { amount: 25 } },
              { id: "addon_parking", name: "Guest parking", price: { amount: 15 } },
            ],
          },
        ],
        topCandidates: [
          {
            roomTypeId: "RT_ACC_QN",
            ratePlanId: "RP_FLEX",
            scoreTotal: 50,
            totalPrice: 399,
            components: {
              valueScore: 40,
              conversionScore: 70,
              experienceScore: 60,
              marginProxyScore: 50,
              riskScore: 20,
            },
          },
        ],
        resolvedRequest: {},
        engineVersion: "dev",
        configVersion: 1,
        artifactVersionsJson: {},
        rawCorePayload: {
          profile: {
            tripType: "couple",
            decisionPosture: "experience",
          },
        },
        rawDebugPayload: {
          scoring: {
            weights: {
              value: 0.2,
              conversion: 0.25,
              experience: 0.15,
              margin: 0.2,
              risk: 0.1,
            },
          },
        },
      },
      generateResponse: {
        data: {
          propertyId: "demo_hotel_sf",
          channel: "voice",
          currency: "USD",
          priceBasisUsed: "afterTax",
          offers: [
            {
              offerId: "rp_flex",
              recommended: true,
              type: "SAFE",
              roomType: { id: "rt_bunk_suite", name: "Bunk Suite" },
              ratePlan: { id: "rp_flex", name: "Flexible" },
              pricing: {
                totalAfterTax: 451.36,
                breakdown: {
                  baseRateSubtotal: 323,
                  taxesAndFees: 48.36,
                  includedFees: {
                    petFeeTotal: 50,
                    parkingFeeTotal: 30,
                    totalIncludedFees: 80,
                  },
                },
              },
              enhancements: [
                { id: "fee_pet_per_night", name: "Pet fee", price: { amount: 25 } },
                { id: "addon_parking", name: "Guest parking", price: { amount: 15 } },
              ],
            },
          ],
          decisionTrace: ["Selected refundable primary offer."],
          configVersion: 1,
        },
      },
    });

    renderDashboard();

    const rowLabel = await screen.findByText("Bunk Suite - Flexible");
    const row = rowLabel.closest("tr");
    expect(row).toBeTruthy();
    await user.click(row as HTMLElement);

    await waitFor(() => {
      expect(mockedFetchOffersLogDetail).toHaveBeenCalledWith(
        "decision-2",
        expect.objectContaining({ includeRawPayloads: true, payloadCapKb: 512 }),
      );
    });

    expect(screen.getByText("User Profile")).toBeTruthy();
    expect(screen.getByText("couple")).toBeTruthy();
    expect(screen.getByText("Weights")).toBeTruthy();
    expect(screen.getByText("Accessible Queen")).toBeTruthy();
    expect(screen.queryByText("Weights missing in debug.scoring.weights")).toBeNull();
  });
});
