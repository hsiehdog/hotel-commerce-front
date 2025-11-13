import { cn } from "@/lib/utils";
import { ChatMessage } from "@/lib/api-client";

type ChatMessageProps = {
  message: ChatMessage;
};

export function ChatMessageBubble({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn("flex w-full", {
        "justify-end": isUser,
        "justify-start": !isUser,
      })}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-2xl border px-4 py-2 text-sm shadow-sm",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted/60 text-foreground",
          message.isOptimistic && "opacity-70",
        )}
      >
        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        <p className="mt-1 text-xs text-muted-foreground/80">
          {formatTimestamp(message.createdAt)}
        </p>
      </div>
    </div>
  );
}

function formatTimestamp(value?: string) {
  if (!value) {
    return "Just now";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}
