import type { Message } from "~/components/core/chat";
import { cn } from "~/lib/utils";
import { Loader2 } from "lucide-react";

export default function Messages({
  messages,
  isStreaming,
}: {
  messages: Message[];
  isStreaming: boolean;
}) {
  return (
    <div className="flex-1 space-y-4 p-4">
      {messages.map((message, index) => (
        <div
          key={index}
          className={cn(
            "flex w-fit max-w-[85%] flex-col gap-2",
            message.role === "assistant" ? "items-start" : "ml-auto items-end",
          )}
        >
          <div
            className={cn(
              "rounded-md p-3 text-sm",
              message.role === "assistant"
                ? "bg-zinc-100 text-black dark:bg-zinc-900 dark:text-zinc-200"
                : "bg-blue-500 text-white",
            )}
          >
            {message.role === "assistant" && isStreaming && !message.content ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              message.content
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
