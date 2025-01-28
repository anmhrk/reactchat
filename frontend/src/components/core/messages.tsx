import type { Message } from "~/components/core/chat";
import { cn } from "~/lib/utils";

export default function Messages({ messages }: { messages: Message[] }) {
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
            {message.content}
          </div>
        </div>
      ))}
    </div>
  );
}
