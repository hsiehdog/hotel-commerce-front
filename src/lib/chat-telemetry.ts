export type ChatTelemetryEventName =
  | "chat_session_created"
  | "chat_message_sent"
  | "chat_message_retry"
  | "chat_response_received"
  | "chat_error_http"
  | "chat_error_network"
  | "chat_session_expired"
  | "chat_offers_presented";

export type ChatTelemetryPayload = {
  sessionId?: string;
  clientMessageId?: string;
  requestId?: string | null;
  httpStatus?: number;
  latencyMs?: number;
  [key: string]: unknown;
};

export function emitChatTelemetry(event: ChatTelemetryEventName, payload: ChatTelemetryPayload) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("chat-telemetry", {
        detail: {
          event,
          payload,
        },
      }),
    );
  }

  if (process.env.NODE_ENV !== "production") {
    // Keep logs in dev only while no analytics sink is wired.
    console.debug("[chat-telemetry]", event, payload);
  }
}
