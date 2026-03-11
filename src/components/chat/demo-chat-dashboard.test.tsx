import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DemoChatDashboard } from "@/components/chat/demo-chat-dashboard";
import { ApiClientRequestError, answerConciergeQuestion, fetchProperties } from "@/lib/api-client";

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
    answerConciergeQuestion: vi.fn(),
  };
});

const mockedFetchProperties = vi.mocked(fetchProperties);
const mockedAnswerConciergeQuestion = vi.mocked(answerConciergeQuestion);

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
    mockedAnswerConciergeQuestion.mockReset();

    mockedFetchProperties.mockResolvedValue([
      { propertyId: "demo_hotel_sf", name: "Demo Hotel San Francisco" },
    ]);
  });

  it("renders a local concierge greeting without creating a backend session", async () => {
    renderDashboard();

    expect(await screen.findByText("Ask me anything about this property, including amenities, policies, parking, or dining.")).toBeTruthy();
    expect(mockedAnswerConciergeQuestion).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Start new chat" })).toBeTruthy();
  });

  it("sends the selected property and renders answer metadata", async () => {
    const user = userEvent.setup();
    mockedAnswerConciergeQuestion.mockResolvedValue({
      answer: "Yes, the pool is heated year-round.",
      confidence: 0.92,
      sources: [{ id: "pool", title: "Amenities fact sheet", url: "https://example.com/amenities" }],
      answerType: "fact",
    });

    renderDashboard();

    await screen.findByText("Ask me anything about this property, including amenities, policies, parking, or dining.");
    await user.type(screen.getByPlaceholderText("Type your request..."), "Is the pool heated?");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(mockedAnswerConciergeQuestion).toHaveBeenCalledWith("demo_property", "Is the pool heated?");
    expect(await screen.findByText("Yes, the pool is heated year-round.")).toBeTruthy();
    expect(screen.getByText("fact")).toBeTruthy();
    expect(screen.getByText("Confidence 92%")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Amenities fact sheet" }).getAttribute("href")).toBe("https://example.com/amenities");
  });

  it("renders source links from alternate backend URL keys", async () => {
    const user = userEvent.setup();
    mockedAnswerConciergeQuestion.mockResolvedValue({
      answer: "The spa menu is available online.",
      confidence: null,
      sources: [{ title: "Spa menu", reference_url: "https://example.com/spa-menu" }],
      answerType: "fact",
    });

    renderDashboard();

    await screen.findByText("Ask me anything about this property, including amenities, policies, parking, or dining.");
    await user.type(screen.getByPlaceholderText("Type your request..."), "Where is the spa menu?");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByRole("link", { name: "Spa menu" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Spa menu" }).getAttribute("href")).toBe("https://example.com/spa-menu");
  });

  it("switches property scope before sending", async () => {
    const user = userEvent.setup();
    mockedAnswerConciergeQuestion.mockResolvedValue({
      answer: "Parking is valet only.",
      confidence: null,
      sources: [],
      answerType: "policy",
    });

    renderDashboard();

    await screen.findByRole("option", { name: "Demo Hotel San Francisco" });
    await user.selectOptions(screen.getByRole("combobox"), "demo_hotel_sf");
    await user.type(screen.getByPlaceholderText("Type your request..."), "What parking is available?");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(mockedAnswerConciergeQuestion).toHaveBeenCalledWith("demo_hotel_sf", "What parking is available?");
  });

  it("retries the same question after a request failure", async () => {
    const user = userEvent.setup();
    mockedAnswerConciergeQuestion
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({
        answer: "Breakfast starts at 7 AM.",
        confidence: 0.81,
        sources: [],
        answerType: "fact",
      });

    renderDashboard();

    await screen.findByText("Ask me anything about this property, including amenities, policies, parking, or dining.");
    await user.type(screen.getByPlaceholderText("Type your request..."), "When is breakfast?");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText("Network error. Retry with the same message.")).toBeTruthy();
    await user.click(await screen.findByRole("button", { name: "Retry" }));

    expect(mockedAnswerConciergeQuestion).toHaveBeenCalledTimes(2);
    expect(await screen.findByText("Breakfast starts at 7 AM.")).toBeTruthy();
  });

  it("shows a rate-limit banner from backend 429 errors", async () => {
    const user = userEvent.setup();
    mockedAnswerConciergeQuestion.mockRejectedValue(
      new ApiClientRequestError({
        status: 429,
        message: "Too many requests",
        retryAfterSeconds: 12,
      }),
    );

    renderDashboard();

    await screen.findByText("Ask me anything about this property, including amenities, policies, parking, or dining.");
    await user.type(screen.getByPlaceholderText("Type your request..."), "Do you allow pets?");
    await user.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => {
      expect(screen.getByText("Rate limited. Try again in 12s.")).toBeTruthy();
    });
    expect(screen.getByText("Rate limited. You can send again in 12s.")).toBeTruthy();
  });
});
