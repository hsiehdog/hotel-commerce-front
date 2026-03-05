import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DemoChatDashboard } from "@/components/chat/demo-chat-dashboard";
import {
  ChatSession,
  createChatSession,
  fetchProperties,
  sendChatSessionMessage,
} from "@/lib/api-client";

const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/demo/chat",
  useRouter: () => ({ replace: replaceMock }),
  useSearchParams: () => new URLSearchParams(""),
}));

vi.mock("@/lib/chat-telemetry", () => ({
  emitChatTelemetry: vi.fn(),
}));

vi.mock("@/lib/api-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api-client")>("@/lib/api-client");
  return {
    ...actual,
    fetchProperties: vi.fn(),
    createChatSession: vi.fn(),
    sendChatSessionMessage: vi.fn(),
  };
});

const mockedFetchProperties = vi.mocked(fetchProperties);
const mockedCreateChatSession = vi.mocked(createChatSession);
const mockedSendChatSessionMessage = vi.mocked(sendChatSessionMessage);

function buildSession(overrides: Partial<ChatSession> = {}): ChatSession {
  return {
    sessionId: "session-1",
    createdAt: "2026-03-01T00:00:00.000Z",
    expiresAt: "2099-03-01T01:00:00.000Z",
    propertyId: "demo_property",
    language: "en-US",
    greeting: "Hello from backend",
    ...overrides,
  };
}

function renderDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <DemoChatDashboard />
    </QueryClientProvider>,
  );
}

describe("DemoChatDashboard", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
    replaceMock.mockReset();
    mockedFetchProperties.mockReset();
    mockedCreateChatSession.mockReset();
    mockedSendChatSessionMessage.mockReset();

    mockedFetchProperties.mockResolvedValue([
      { propertyId: "demo_hotel_sf", name: "Demo Hotel San Francisco" },
    ]);
    mockedCreateChatSession.mockResolvedValue(buildSession());
  });

  it("creates a session and renders greeting", async () => {
    renderDashboard();

    await waitFor(() => {
      expect(mockedCreateChatSession).toHaveBeenCalledTimes(1);
    });

    expect(await screen.findByText("Hello from backend")).toBeTruthy();
  });

  it("renders single recommended room from new commerce payload", async () => {
    const user = userEvent.setup();
    mockedSendChatSessionMessage.mockResolvedValue({
      sessionId: "session-1",
      assistantMessage: "I found a recommendation",
      status: "OK",
      nextAction: "PRESENT_OFFERS",
      slots: {},
      commerce: {
        currency: "USD",
        recommended_room: {
          room_type: "Family Suite",
          rate_plan: "Flexible Rate",
          nightly_price: 329,
          total_price: 987,
          score: 0.8731,
          reasons: ["Strong fit"],
          policy_summary: "Refundable",
          inventory_note: "Only 2 left",
          room_type_id: "rt_family_suite",
          rate_plan_id: "rp_flex",
        },
      },
      decisionId: "decision-1",
    });

    renderDashboard();

    await screen.findByText("Hello from backend");
    await user.type(screen.getByPlaceholderText("Type your request..."), "Show recommendation");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText("Recommended Room")).toBeTruthy();
    expect(screen.getByText("Family Suite")).toBeTruthy();
  });

  it("does not render offers list when recommended_room is absent", async () => {
    const user = userEvent.setup();
    mockedSendChatSessionMessage.mockResolvedValue({
      sessionId: "session-1",
      assistantMessage: "No room could be recommended right now.",
      status: "OK",
      nextAction: "CONFIRM",
      slots: {},
      commerce: {
        recommended_room: null,
        recommended_offers: [],
        ranked_rooms: [],
        fallback: {
          type: "suggest_alternate_dates",
          reason: "No eligible room remained.",
          suggestions: [],
        },
      },
    });

    renderDashboard();

    await screen.findByText("Hello from backend");
    await user.type(screen.getByPlaceholderText("Type your request..."), "Show recommendation");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText("No room could be recommended right now.")).toBeTruthy();
    expect(screen.queryByText("Recommended Room")).toBeNull();
  });
});
