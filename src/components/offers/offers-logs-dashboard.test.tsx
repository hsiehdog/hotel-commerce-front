import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
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
          primaryOfferName: "Family Suite",
          primaryOfferTotal: 451.36,
          decisionStatus: "OK",
          offersCount: 1,
          truncated: false,
          served: true,
          servedSuccess: true,
          reasonCodes: [],
          reasonCodesCount: 0,
          reasonCodesTruncated: false,
          latencyMs: 950,
          decisionAgeMs: 3_000,
        },
      ],
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Family Suite")).toBeTruthy();
      expect(screen.getByText("$451.36")).toBeTruthy();
      expect(screen.getByText("PROCESSED")).toBeTruthy();
    });
  });

  it("opens detail drawer and maps new contract payload", async () => {
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
          primaryOfferName: "Family Suite",
          primaryOfferTotal: 451.36,
          decisionStatus: "OK",
          offersCount: 1,
          truncated: false,
          served: true,
          servedSuccess: true,
          reasonCodes: [],
          reasonCodesCount: 0,
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
        currency: "USD",
        recommendedOfferCount: 1,
        decisionStatus: "OK",
        reasonCodes: [],
        truncated: false,
        eventRecordedAt: new Date().toISOString(),
        served: true,
        servedSuccess: true,
        latencyMs: 40,
      },
      createdEventCount: 1,
      selectedCreatedEventId: "event-created-1",
      selectedCreatedEventRecordedAt: new Date().toISOString(),
      integrityFlags: {},
      normalizationWarnings: [],
      events: [],
      normalized: {},
      generateResponse: {
        data: {
          propertyId: "demo_hotel_sf",
          channel: "voice",
          currency: "USD",
          priceBasisUsed: "afterTax",
          persona_confidence: {
            family: 0.62,
          },
          recommended_room: {
            room_type: "Family Suite",
            rate_plan: "Flexible",
            nightly_price: 225.68,
            total_price: 451.36,
            pricing_breakdown: {
              subtotal: 380,
              taxes_and_fees: 71.36,
              included_fees: {},
            },
            score: 0.88,
            reasons: ["Strong fit"],
            policy_summary: "Refundable rate",
            inventory_note: "Only 2 left",
            room_type_id: "rt_family_suite",
            rate_plan_id: "rp_flex",
          },
          recommended_offers: [],
          ranked_rooms: [
            {
              room_type_id: "rt_family_suite",
              room_type_name: "Family Suite",
              rate_plan_id: "rp_flex",
              price: 451.36,
              score: 0.88,
              component_scores: { fit: 0.95 },
              reasons: ["Strong fit"],
            },
          ],
          fallback: null,
          configVersion: 1,
          debug: {},
        },
      },
    });

    renderDashboard();

    const rowLabel = await screen.findByText("Family Suite");
    const row = rowLabel.closest("tr");
    expect(row).toBeTruthy();
    await user.click(row as HTMLElement);

    await waitFor(() => {
      expect(mockedFetchOffersLogDetail).toHaveBeenCalledWith(
        "decision-2",
        expect.objectContaining({ includeRawPayloads: true, payloadCapKb: 512 }),
      );
    });

    expect(screen.getAllByText("Recommended Room").length).toBeGreaterThan(0);
    expect(screen.getByText("Family Suite | Flexible")).toBeTruthy();
    expect(screen.getByText("User Profile")).toBeTruthy();
    expect(screen.getByText("Room Ranking")).toBeTruthy();
    expect(screen.getByText("Audit Trail")).toBeTruthy();
  });

  it("falls back to table primary offer when detail payload has no recommendation data", async () => {
    const user = userEvent.setup();

    mockedFetchOffersLogs.mockResolvedValue({
      serverNow: new Date().toISOString(),
      pageInfo: {
        hasMore: false,
        limit: 25,
      },
      rows: [
        {
          decisionId: "decision-5",
          requestId: "request-5",
          propertyId: "demo_hotel_sf",
          property: "demo_hotel_sf",
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
          primaryOfferName: "King Room",
          primaryOfferTotal: 190.3,
          decisionStatus: "OK",
          offersCount: 1,
          truncated: false,
          served: true,
          servedSuccess: true,
          reasonCodes: [],
          reasonCodesCount: 0,
          reasonCodesTruncated: false,
          latencyMs: 40,
          decisionAgeMs: 100,
        },
      ],
    });

    mockedFetchOffersLogDetail.mockResolvedValue({
      decision: {
        decisionId: "decision-5",
        tenantId: "tenant-1",
        propertyId: "demo_hotel_sf",
        requestId: "request-5",
        channel: "web",
        currency: "USD",
        recommendedOfferCount: 1,
        decisionStatus: "OK",
        reasonCodes: [],
        truncated: false,
        eventRecordedAt: new Date().toISOString(),
        served: true,
        servedSuccess: true,
        latencyMs: 40,
      },
      createdEventCount: 1,
      selectedCreatedEventId: "event-created-5",
      selectedCreatedEventRecordedAt: new Date().toISOString(),
      integrityFlags: {
        missingDebugPayload: false,
      },
      events: [],
      normalized: {
        reasonDetailsVersion: 1,
        globalReasonCodes: [],
        selectionSummary: null,
        reasonDetails: {},
        reasonsByOfferId: {},
        presentedOffers: [],
        topCandidates: [],
        resolvedRequest: {},
      },
      generateResponse: null,
    });

    renderDashboard();

    const rowLabel = await screen.findByText("King Room");
    const row = rowLabel.closest("tr");
    expect(row).toBeTruthy();
    await user.click(row as HTMLElement);

    expect((await screen.findAllByText("Recommended Room")).length).toBeGreaterThan(0);
    expect(screen.getByText("King Room | -")).toBeTruthy();
    expect(screen.queryByText("No Recommendation")).toBeNull();
  });

  it("hydrates detail UI from generateResponse.data", async () => {
    const user = userEvent.setup();

    mockedFetchOffersLogs.mockResolvedValue({
      serverNow: new Date().toISOString(),
      pageInfo: {
        hasMore: false,
        limit: 25,
      },
      rows: [
        {
          decisionId: "decision-6",
          requestId: "request-6",
          propertyId: "demo_hotel_sf",
          property: "demo_hotel_sf",
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
          primaryOfferName: "Skyline Suite",
          primaryOfferTotal: 610.5,
          decisionStatus: "OK",
          offersCount: 1,
          truncated: false,
          served: true,
          servedSuccess: true,
          reasonCodes: [],
          reasonCodesCount: 0,
          reasonCodesTruncated: false,
          latencyMs: 40,
          decisionAgeMs: 100,
        },
      ],
    });

    mockedFetchOffersLogDetail.mockResolvedValue({
      decision: {
        decisionId: "decision-6",
        tenantId: "tenant-1",
        propertyId: "demo_hotel_sf",
        requestId: "request-6",
        channel: "web",
        currency: "USD",
        recommendedOfferCount: 1,
        decisionStatus: "OK",
        reasonCodes: [],
        truncated: false,
        eventRecordedAt: new Date().toISOString(),
        served: true,
        servedSuccess: true,
        latencyMs: 40,
      },
      createdEventCount: 1,
      selectedCreatedEventId: "event-created-6",
      selectedCreatedEventRecordedAt: new Date().toISOString(),
      integrityFlags: {
        missingDebugPayload: false,
      },
      events: [],
      normalized: {
        reasonDetailsVersion: 1,
        globalReasonCodes: [],
        selectionSummary: "Selected room from normalized payload",
        reasonDetails: {},
        reasonsByOfferId: {},
        presentedOffers: [],
        topCandidates: [],
        resolvedRequest: {
          property_id: "demo_hotel_sf",
          currency: "USD",
        },
        engineVersion: "dev",
        configVersion: 7,
        artifactVersionsJson: {},
        rawCorePayload: {},
        rawDebugPayload: {
          persona_confidence: {
            family: 0.81,
          },
          scoring: {
            weights: {
              value: 0.4,
              conversion: 0.3,
              experience: 0.2,
              margin: 0.1,
              risk: 0.05,
            },
          },
        },
      },
      generateResponse: {
        data: {
          propertyId: "demo_hotel_sf",
          channel: "web",
          currency: "USD",
          priceBasisUsed: "afterTax",
          configVersion: 7,
          persona_confidence: {
            family_traveler: 0.81,
          },
          recommended_room: {
            room_type: "Skyline Suite",
            rate_plan: "Member Flexible",
            nightly_price: 305.25,
            total_price: 610.5,
            pricing_breakdown: {
              subtotal: 540,
              taxes_and_fees: 70.5,
              included_fees: [],
            },
            score: 0.94,
            reasons: ["Best fit for requested stay"],
            policy_summary: "Free cancellation",
            inventory_note: "Only 1 left",
            room_type_id: "rt_skyline_suite",
            rate_plan_id: "rp_member_flex",
          },
          recommended_offers: [],
          ranked_rooms: [],
          debug: {
            scoring: {
              weights: {
                value: 0.4,
                conversion: 0.3,
                experience: 0.2,
                margin: 0.1,
                risk: 0.05,
              },
            },
          },
        },
      },
    });

    renderDashboard();

    const rowLabel = await screen.findByText("Skyline Suite");
    const row = rowLabel.closest("tr");
    expect(row).toBeTruthy();
    await user.click(row as HTMLElement);

    expect(await screen.findByText("Skyline Suite | Member Flexible")).toBeTruthy();
    expect(screen.getByText("Family Traveler")).toBeTruthy();
    expect(screen.getByText("81.00%")).toBeTruthy();
    expect(screen.getByText(/Value:/)).toBeTruthy();
    expect(screen.getByText(/0.40/)).toBeTruthy();
  });

  it("uses generateResponse.data so detail matches offers generate structure", async () => {
    const user = userEvent.setup();

    mockedFetchOffersLogs.mockResolvedValue({
      serverNow: new Date().toISOString(),
      pageInfo: {
        hasMore: false,
        limit: 25,
      },
      rows: [
        {
          decisionId: "decision-7",
          requestId: "request-7",
          propertyId: "demo_hotel_sf",
          property: "demo_hotel_sf",
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
          primaryOfferName: "King Room",
          primaryOfferTotal: 213.14,
          decisionStatus: "OK",
          offersCount: 4,
          truncated: false,
          served: true,
          servedSuccess: true,
          reasonCodes: [],
          reasonCodesCount: 0,
          reasonCodesTruncated: false,
          latencyMs: 40,
          decisionAgeMs: 100,
        },
      ],
    });

    mockedFetchOffersLogDetail.mockResolvedValue({
      decision: {
        decisionId: "decision-7",
        tenantId: "tenant-1",
        propertyId: "demo_hotel_sf",
        requestId: "request-7",
        channel: "web",
        currency: "USD",
        recommendedOfferCount: 4,
        decisionStatus: "OK",
        reasonCodes: [],
        truncated: false,
        eventRecordedAt: new Date().toISOString(),
        served: true,
        servedSuccess: true,
        latencyMs: 40,
      },
      createdEventCount: 1,
      selectedCreatedEventId: "event-created-7",
      selectedCreatedEventRecordedAt: new Date().toISOString(),
      integrityFlags: {
        missingDebugPayload: false,
      },
      events: [],
      normalized: {
        reasonDetailsVersion: 1,
        globalReasonCodes: [],
        selectionSummary: "Selected room",
        reasonDetails: {},
        reasonsByOfferId: {},
        presentedOffers: [],
        topCandidates: [],
        resolvedRequest: {},
        engineVersion: "dev",
        configVersion: 1,
        artifactVersionsJson: {},
        rawCorePayload: {},
        rawDebugPayload: {},
      },
      generateResponse: {
        data: {
          propertyId: "demo_hotel_sf",
          channel: "web",
          currency: "USD",
          priceBasisUsed: "afterTax",
          configVersion: 1,
          persona_confidence: {
            solo_business_traveler: 0.6104,
            last_minute_traveler: 0.1153,
            family_traveler: 0.038,
          },
          recommended_room: {
            room_type: "King Room",
            rate_plan: "Pay Now Saver",
            nightly_price: 106.57,
            total_price: 213.14,
            pricing_breakdown: {
              subtotal: 190.3,
              taxes_and_fees: 22.84,
              included_fees: [],
            },
            score: 0.71,
            reasons: [
              "Good relative value for this search",
              "Limited remaining inventory at this rate",
            ],
            policy_summary: "Non-refundable rate with fixed booking terms.",
            inventory_note: "Inventory available at this rate.",
            room_type_id: "rt_king",
            rate_plan_id: "rp_paynow",
          },
          recommended_offers: [
            {
              bundle_type: "late_checkout",
              label: "Late checkout",
              score: 0.59,
              reasons: [
                "Expected attach probability 19%",
                "Estimated satisfaction lift 8%",
                "Adds schedule flexibility",
              ],
              estimated_price_delta: 35,
            },
          ],
          ranked_rooms: [
            {
              room_type_id: "rt_king",
              room_type_name: "King Room",
              rate_plan_id: "rp_paynow",
              price: 213.14,
              score: 0.71,
              component_scores: {},
              reasons: [
                "Good relative value for this search",
                "Limited remaining inventory at this rate",
              ],
            },
          ],
          debug: {
            scoring: {
              weights: {
                value: 0.4,
              },
            },
          },
        },
      },
    });

    renderDashboard();

    const rowLabel = await screen.findByText("King Room");
    const row = rowLabel.closest("tr");
    expect(row).toBeTruthy();
    await user.click(row as HTMLElement);

    expect(await screen.findByText("Recommended Upsells")).toBeTruthy();
    expect(screen.getByText("Late checkout")).toBeTruthy();
    expect(screen.getByText("Last Minute Traveler")).toBeTruthy();
    expect(screen.getByText("11.53%")).toBeTruthy();
    expect(screen.getAllByText("King Room").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Limited remaining inventory at this rate").length).toBeGreaterThan(0);
  });
});
