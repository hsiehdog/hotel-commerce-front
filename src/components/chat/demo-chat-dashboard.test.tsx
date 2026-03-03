import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DemoChatDashboard } from "@/components/chat/demo-chat-dashboard";
import {
  ApiClientRequestError,
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

  it("sends a message and renders NEEDS_CLARIFICATION assistant response", async () => {
    const user = userEvent.setup();
    mockedSendChatSessionMessage.mockResolvedValue({
      sessionId: "session-1",
      assistantMessage: "What dates are you looking for?",
      status: "NEEDS_CLARIFICATION",
      nextAction: "ASK_QUESTION",
      slots: {},
    });

    renderDashboard();

    await screen.findByText("Hello from backend");
    await user.type(screen.getByPlaceholderText("Type your request..."), "Need a room");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText("What dates are you looking for?")).toBeTruthy();
    expect(screen.getByText("NEEDS_CLARIFICATION")).toBeTruthy();
    expect(screen.getByText("ASK_QUESTION")).toBeTruthy();
  });

  it("renders up to two offers and marks first as recommended", async () => {
    const user = userEvent.setup();
    mockedSendChatSessionMessage.mockResolvedValue({
      sessionId: "session-1",
      assistantMessage: "I found options",
      status: "OK",
      nextAction: "PRESENT_OFFERS",
      slots: {},
      offers: [
        {
          id: "o1",
          name: "Offer One",
          description: "First",
          rate_type: "flexible",
          cancellation_policy: "Free cancellation",
          payment_policy: "Pay later",
          price: {
            currency: "USD",
            per_night: 100,
            subtotal: 200,
            taxes_and_fees: 30,
            total: 230,
          },
        },
        {
          id: "o2",
          name: "Offer Two",
          description: "Second",
          rate_type: "non_refundable",
          cancellation_policy: "No cancellation",
          payment_policy: "Pay now",
          price: {
            currency: "USD",
            per_night: 90,
            subtotal: 180,
            taxes_and_fees: 28,
            total: 208,
          },
        },
        {
          id: "o3",
          name: "Offer Three",
          description: "Third",
          rate_type: "flexible",
          cancellation_policy: "Flexible",
          payment_policy: "Pay later",
          price: {
            currency: "USD",
            per_night: 110,
            subtotal: 220,
            taxes_and_fees: 32,
            total: 252,
          },
        },
      ],
      decisionId: "decision-1",
    });

    renderDashboard();

    await screen.findByText("Hello from backend");
    await user.type(screen.getByPlaceholderText("Type your request..."), "Show offers");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText(/Offer One/)).toBeTruthy();
    expect(screen.getByText(/Offer Two/)).toBeTruthy();
    expect(screen.queryByText("Offer Three")).toBeNull();
    expect(screen.getByText("Recommended")).toBeTruthy();
  });

  it("prefers commerce.offers when present", async () => {
    const user = userEvent.setup();
    mockedSendChatSessionMessage.mockResolvedValue({
      sessionId: "session-1",
      assistantMessage: "Commerce offers returned",
      status: "OK",
      nextAction: "PRESENT_OFFERS",
      slots: {},
      offers: [
        {
          id: "legacy-1",
          name: "Legacy Offer",
          description: "Legacy",
          rate_type: "flexible",
          cancellation_policy: "Legacy policy",
          payment_policy: "Legacy payment",
          price: {
            currency: "USD",
            per_night: 100,
            subtotal: 200,
            taxes_and_fees: 20,
            total: 220,
          },
        },
      ],
      commerce: {
        offers: [
          {
            offerId: "commerce-1",
            name: "Commerce Offer",
            description: "From commerce payload",
            rate_type: "flexible",
            cancellation_policy: "Commerce cancellation",
            payment_policy: "Commerce payment",
            pricing: {
              currency: "USD",
              total: 250,
              breakdown: {
                baseRateSubtotal: 210,
                taxesAndFees: 40,
                includedFees: {
                  totalIncludedFees: 0,
                },
              },
            },
          },
        ],
      },
    });

    renderDashboard();

    await screen.findByText("Hello from backend");
    await user.type(screen.getByPlaceholderText("Type your request..."), "Show commerce offers");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText(/Commerce Offer/)).toBeTruthy();
    expect(screen.queryByText(/Legacy Offer/)).toBeNull();
  });

  it("maps commerce room type labels and itemized included fees", async () => {
    const user = userEvent.setup();
    mockedSendChatSessionMessage.mockResolvedValue({
      sessionId: "session-1",
      assistantMessage: "Here are your options",
      status: "OK",
      nextAction: "PRESENT_OFFERS",
      slots: {},
      commerce: {
        offers: [
          {
            offerId: "offer-1",
            name: "Offer 1",
            roomType: { name: "Bunk Suite" },
            ratePlan: { name: "Flexible" },
            pricing: {
              currency: "USD",
              total: 451.36,
              breakdown: {
                baseRateSubtotal: 323,
                taxesAndFees: 48.36,
                includedFees: {
                  totalIncludedFees: 80,
                  petFeeTotal: 50,
                  parkingFeeTotal: 30,
                },
              },
            },
            enhancements: [{ name: "Pet fee" }, { name: "Guest parking" }],
          },
        ],
      },
    });

    renderDashboard();

    await screen.findByText("Hello from backend");
    await user.type(screen.getByPlaceholderText("Type your request..."), "Show detailed offers");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText("Bunk Suite | Flexible")).toBeTruthy();
    expect(screen.queryByText("Offer 1 | Flexible")).toBeNull();
    expect(screen.getByText("Pet Fee")).toBeTruthy();
    expect(screen.getByText("Parking Fee")).toBeTruthy();
    expect(screen.queryByText("Included fees")).toBeNull();
  });

  it("retries failed network send with same clientMessageId", async () => {
    const user = userEvent.setup();
    const uuidSpy = vi.spyOn(crypto, "randomUUID").mockReturnValue("uuid-1");

    mockedSendChatSessionMessage
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValueOnce({
        sessionId: "session-1",
        assistantMessage: "Recovered",
        status: "OK",
        nextAction: "CONFIRM",
        slots: {},
      });

    renderDashboard();

    await screen.findByText("Hello from backend");
    await user.type(screen.getByPlaceholderText("Type your request..."), "Retry test");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText("Network error. Retry with the same message id.")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => {
      expect(mockedSendChatSessionMessage).toHaveBeenCalledTimes(2);
    });

    expect(mockedSendChatSessionMessage.mock.calls[0]?.[1].clientMessageId).toBe("uuid-1");
    expect(mockedSendChatSessionMessage.mock.calls[1]?.[1].clientMessageId).toBe("uuid-1");
    uuidSpy.mockRestore();
  });

  it("handles 404 session expiry and restart", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    mockedSendChatSessionMessage.mockRejectedValueOnce(
      new ApiClientRequestError({ status: 404, message: "expired" }),
    );
    mockedCreateChatSession
      .mockResolvedValueOnce(buildSession())
      .mockResolvedValueOnce(buildSession({ sessionId: "session-2" }));

    renderDashboard();

    await screen.findByText("Hello from backend");
    await user.type(screen.getByPlaceholderText("Type your request..."), "Hello");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect((await screen.findAllByText("Session expired, start new chat.")).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Start new chat" }));

    await waitFor(() => {
      expect(mockedCreateChatSession).toHaveBeenCalledTimes(2);
    });

    confirmSpy.mockRestore();
  });

  it("handles 429 with cooldown UI and disabled send", async () => {
    const user = userEvent.setup();
    mockedSendChatSessionMessage.mockRejectedValueOnce(
      new ApiClientRequestError({ status: 429, message: "rate limited", retryAfterSeconds: 10 }),
    );

    renderDashboard();

    await screen.findByText("Hello from backend");
    await user.type(screen.getByPlaceholderText("Type your request..."), "Hello");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect((await screen.findAllByText(/Rate limited/)).length).toBeGreaterThan(0);
    expect((screen.getByRole("button", { name: "Send" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("blocks empty and over-length messages", async () => {
    const user = userEvent.setup();

    renderDashboard();

    await screen.findByText("Hello from backend");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(mockedSendChatSessionMessage).not.toHaveBeenCalled();

    await user.type(screen.getByPlaceholderText("Type your request..."), "a".repeat(1001));
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText("Message cannot exceed 1000 characters.")).toBeTruthy();
    expect(mockedSendChatSessionMessage).not.toHaveBeenCalled();
  });

  it("keeps composer enabled after recoverable 400 error", async () => {
    const user = userEvent.setup();

    mockedSendChatSessionMessage.mockRejectedValueOnce(
      new ApiClientRequestError({ status: 400, message: "Bad input" }),
    );

    renderDashboard();

    await screen.findByText("Hello from backend");
    const textarea = screen.getByPlaceholderText("Type your request...");

    await user.type(textarea, "Bad input test");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText("Bad input")).toBeTruthy();
    expect((textarea as HTMLTextAreaElement).disabled).toBe(false);
  });
});
