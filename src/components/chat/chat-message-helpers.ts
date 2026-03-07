import type { DemoChatMessageItem } from "@/components/chat/demo-chat-message";

export function isConfirmOfferRecapMessage(message?: DemoChatMessageItem | null): boolean {
  return Boolean(
    message?.pendingAction &&
    typeof message.pendingAction !== "string" &&
    message.pendingAction.type === "confirm_offer_recap" &&
    message.responseUi?.type === "confirmation",
  );
}

export function compactConfirmOfferRecapText(text: string): string {
  return text
    .replace(/(details I have:)([\s\S]*?)(Is this correct\?)/i, "$1 $3")
    .replace(/\s+/g, " ")
    .trim();
}

export function getDisplayPromptText(message?: DemoChatMessageItem | null): string {
  if (!message) {
    return "";
  }

  return isConfirmOfferRecapMessage(message)
    ? compactConfirmOfferRecapText(message.text)
    : message.text;
}
