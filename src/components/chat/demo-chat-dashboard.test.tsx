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
    expect(screen.getByRole("button", { name: "Start new chat" })).toBeTruthy();
  });

  it("renders single recommended room from new commerce payload", async () => {
    const user = userEvent.setup();
    mockedSendChatSessionMessage.mockResolvedValue({
      sessionId: "session-1",
      assistantMessage: "I found a recommendation",
      status: "OK",
      nextAction: "PRESENT_OFFERS",
      slots: {},
      responseUi: {
        type: "offer_recommendation",
        showRecommendedRoom: true,
        showRecommendedOffers: false,
        showRankedRooms: false,
      },
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
    expect(screen.getByText("Family Suite | Flexible Rate")).toBeTruthy();
    expect(screen.getByText("$987")).toBeTruthy();
    expect(screen.getByText("I found a recommendation")).toBeTruthy();
  });

  it("renders question UI without slot hint badges", async () => {
    const user = userEvent.setup();
    mockedSendChatSessionMessage.mockResolvedValue({
      sessionId: "session-1",
      assistantMessage: "What dates are you looking for?",
      status: "NEEDS_CLARIFICATION",
      nextAction: "ASK_QUESTION",
      slots: {},
      responseUi: {
        type: "question",
        answerMode: "free_text",
        targetSlots: ["check_in", "check_out"],
        slotHints: {
          missingRequired: ["check_in", "check_out"],
          collected: ["adults"],
        },
      },
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

    expect(await screen.findByText("What dates are you looking for?")).toBeTruthy();
    expect(screen.getByPlaceholderText("Type your response...")).toBeTruthy();
    expect(screen.queryByText("Waiting for: Check In, Check Out")).toBeNull();
    expect(screen.queryByText("Need Check In")).toBeNull();
    expect(screen.queryByText("Need Check Out")).toBeNull();
    expect(screen.queryByText("Have Adults")).toBeNull();
    expect(screen.queryByText("Recommended Room")).toBeNull();
  });

  it("renders yes/no confirmation prompt without summary details", async () => {
    const user = userEvent.setup();
    mockedSendChatSessionMessage.mockResolvedValue({
      sessionId: "session-1",
      assistantMessage: "Please confirm these stay details.",
      status: "OK",
      nextAction: "CONFIRM",
      slots: {},
      responseUi: {
        type: "confirmation",
        answerMode: "yes_no",
        targetSlots: ["confirm_dates"],
        summary: {
          check_in: "2026-06-10",
          check_out: "2026-06-12",
          adults: 2,
        },
      },
      commerce: {},
    });

    renderDashboard();

    await screen.findByText("Hello from backend");
    await user.type(screen.getByPlaceholderText("Type your request..."), "Continue");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText("Please confirm these stay details.")).toBeTruthy();
    expect(screen.queryByText("Review details")).toBeNull();
    expect(screen.queryByText("Check In")).toBeNull();
    expect(screen.queryByText("2026-06-10")).toBeNull();
    expect(screen.queryByText("Check Out")).toBeNull();
    expect(screen.queryByRole("button", { name: "Yes" })).toBeNull();
    expect(screen.queryByRole("button", { name: "No" })).toBeNull();
    expect(screen.getByPlaceholderText("Type your response...")).toBeTruthy();
  });

  it("renders confirm_offer_recap details in a recap table", async () => {
    const user = userEvent.setup();
    mockedSendChatSessionMessage.mockResolvedValue({
      sessionId: "session-1",
      assistantMessage:
        "Just to confirm, here are the details I have: check-in Friday, April 3, 2026, check-out Sunday, April 5, 2026, nights 2, adults 2, rooms 1, children 0. Is this correct?",
      status: "OK",
      nextAction: "CONFIRM",
      pendingAction: {
        type: "confirm_offer_recap",
        answerMode: "yes_no",
        source: "offer_engine",
        targetSlots: ["offer_recap_confirmation"],
        proposedPatch: {
          room_type_name: "Family Suite",
          rate_plan_name: "Flexible Rate",
          total_price: 987,
          currency: "USD",
          check_in: "2026-06-10",
          check_out: "2026-06-12",
        },
      },
      slots: {},
      responseUi: {
        type: "confirmation",
        answerMode: "yes_no",
        targetSlots: ["offer_recap_confirmation"],
        summary: {
          adults: 2,
          children: 1,
        },
      },
      commerce: {},
    });

    renderDashboard();

    await screen.findByText("Hello from backend");
    await user.type(screen.getByPlaceholderText("Type your request..."), "Show me the offer");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText("Just to confirm, here are the details I have: Is this correct?")).toBeTruthy();
    expect(screen.queryByText(/check-out Sunday, April 5, 2026/)).toBeNull();
    expect(screen.getByText("Room Type Name")).toBeTruthy();
    expect(screen.getByText("Family Suite")).toBeTruthy();
    expect(screen.getByText("Rate Plan Name")).toBeTruthy();
    expect(screen.getByText("Flexible Rate")).toBeTruthy();
    expect(screen.getByText("Total Price")).toBeTruthy();
    expect(screen.getByText("987")).toBeTruthy();
    expect(screen.getByText("Adults")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
    expect(screen.getByText("Children")).toBeTruthy();
    expect(screen.getByText("1")).toBeTruthy();
  });

  it("sends yes/no replies only when responseUi answerMode expects them", async () => {
    const user = userEvent.setup();
    mockedSendChatSessionMessage
      .mockResolvedValueOnce({
        sessionId: "session-1",
        assistantMessage: "Will any children be traveling with you?",
        status: "NEEDS_CLARIFICATION",
        nextAction: "ASK_QUESTION",
        slots: {},
        responseUi: {
          type: "question",
          answerMode: "yes_no",
          targetSlots: ["children_presence"],
        },
        commerce: {},
      })
      .mockResolvedValueOnce({
        sessionId: "session-1",
        assistantMessage: "Confirmed. I will keep those dates.",
        status: "OK",
        nextAction: "ASK_QUESTION",
        slots: {},
        responseUi: {
          type: "question",
          answerMode: "free_text",
          targetSlots: ["children_count"],
        },
        commerce: {},
      });

    renderDashboard();

    await screen.findByText("Hello from backend");
    await user.type(screen.getByPlaceholderText("Type your request..."), "Next weekend");
    await user.click(screen.getByRole("button", { name: "Send" }));

    await screen.findByText("Will any children be traveling with you?");
    await user.type(screen.getByPlaceholderText("Type your response..."), "yes");
    await user.click(screen.getByRole("button", { name: "Send" }));

    await screen.findByText("Confirmed. I will keep those dates.");
    expect(mockedSendChatSessionMessage).toHaveBeenNthCalledWith(
      2,
      "session-1",
      expect.objectContaining({ message: "yes" }),
    );
    expect(screen.getByPlaceholderText("Type your response...")).toBeTruthy();
  });

  it("renders retry action from error responseUi", async () => {
    const user = userEvent.setup();
    mockedSendChatSessionMessage
      .mockResolvedValueOnce({
        sessionId: "session-1",
        assistantMessage: "Something went wrong. Try again.",
        status: "ERROR",
        nextAction: "ASK_QUESTION",
        slots: {},
        responseUi: {
          type: "error",
          retryable: true,
        },
        commerce: {},
      })
      .mockResolvedValueOnce({
        sessionId: "session-1",
        assistantMessage: "What dates are you looking for?",
        status: "NEEDS_CLARIFICATION",
        nextAction: "ASK_QUESTION",
        slots: {},
        responseUi: {
          type: "question",
          answerMode: "free_text",
        },
        commerce: {},
      });

    renderDashboard();

    await screen.findByText("Hello from backend");
    await user.type(screen.getByPlaceholderText("Type your request..."), "Hello");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText("Something went wrong. Try again.")).toBeTruthy();
    await user.click(screen.getAllByRole("button", { name: "Retry" })[0]);
    expect(await screen.findByText("What dates are you looking for?")).toBeTruthy();
    expect(mockedSendChatSessionMessage).toHaveBeenCalledTimes(2);
  });

  it("uses typed input for single-choice turns instead of option buttons", async () => {
    const user = userEvent.setup();
    mockedSendChatSessionMessage
      .mockResolvedValueOnce({
        sessionId: "session-1",
        assistantMessage: "Choose a room view.",
        status: "NEEDS_CLARIFICATION",
        nextAction: "ASK_QUESTION",
        pendingAction: "select_room_view",
        slots: {},
        responseUi: {
          type: "selection",
          answerMode: "single_choice",
          targetSlots: ["room_view"],
          options: [
            { label: "City View", value: "city_view" },
            { label: "Ocean View", value: "ocean_view" },
          ],
        },
        commerce: {},
      })
      .mockResolvedValueOnce({
        sessionId: "session-1",
        assistantMessage: "Ocean view noted.",
        status: "OK",
        nextAction: "ASK_QUESTION",
        slots: {},
        responseUi: {
          type: "question",
          answerMode: "free_text",
        },
        commerce: {},
      });

    renderDashboard();

    await screen.findByText("Hello from backend");
    await user.type(screen.getByPlaceholderText("Type your request..."), "Find a room");
    await user.click(screen.getByRole("button", { name: "Send" }));

    await screen.findByText("Choose a room view.");
    expect(screen.queryByRole("button", { name: "City View" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Ocean View" })).toBeNull();
    await user.type(screen.getByPlaceholderText("Type your response..."), "ocean_view");
    await user.click(screen.getByRole("button", { name: "Send" }));

    await screen.findByText("Ocean view noted.");
    expect(mockedSendChatSessionMessage).toHaveBeenNthCalledWith(
      2,
      "session-1",
      expect.objectContaining({ message: "ocean_view" }),
    );
  });
});
