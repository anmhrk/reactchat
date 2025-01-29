/* eslint-disable @typescript-eslint/no-unsafe-assignment */

"use client";

import type { Message } from "~/components/core/chat";
import { cn } from "~/lib/utils";
import { Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  dracula,
  oneLight,
} from "react-syntax-highlighter/dist/cjs/styles/prism";
import type { Components } from "react-markdown";
import { useTheme } from "next-themes";
import React from "react";

export default function Messages({
  messages,
  isStreaming,
}: {
  messages: Message[];
  isStreaming: boolean;
}) {
  return (
    <div className="flex-1 space-y-4 p-4 text-sm">
      {messages.map((message, index) => (
        <div
          key={index}
          className={cn(
            "flex w-full flex-col",
            message.role === "assistant" ? "items-start" : "items-end",
          )}
        >
          <div
            className={cn(
              "w-fit break-words rounded-lg p-3",
              message.role === "assistant"
                ? "bg-zinc-100 text-black dark:bg-zinc-900 dark:text-zinc-200"
                : "bg-blue-500 text-white",
              "max-w-full",
            )}
          >
            {message.role === "assistant" && isStreaming && !message.content ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <div className="prose prose-sm dark:prose-invert prose-pre:bg-transparent prose-pre:p-0 max-w-full overflow-x-auto">
                <ReactMarkdown components={MarkdownComponents}>
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// want to remove wrapLines and wrapLongLines but the code block overflows the container without them
const Code = React.memo(
  ({ className, children }: { className: string; children: string }) => {
    const { theme } = useTheme();
    const match = /language-(\w+)/.exec(className ?? "");
    const isDark = theme === "dark";

    return match ? (
      <SyntaxHighlighter
        style={isDark ? dracula : oneLight}
        language={match[1]}
        PreTag="div"
        wrapLines
        wrapLongLines
        className="rounded-lg"
        customStyle={{
          width: "100%",
          maxWidth: "100%",
        }}
        codeTagProps={{
          style: {
            display: "block",
            overflowX: "auto",
          },
        }}
      >
        {String(children).replace(/\n$/, "")}
      </SyntaxHighlighter>
    ) : (
      <code
        className={cn(
          "rounded-sm bg-zinc-200 px-1 py-0.5 font-mono text-sm dark:bg-zinc-700",
          className,
        )}
      >
        {children}
      </code>
    );
  },
);

Code.displayName = "Code";

const MarkdownComponents: Components = {
  // @ts-expect-error - code block
  code: Code,

  p({ children }) {
    return <p className="mb-4 last:mb-0">{children}</p>;
  },

  ul({ children }) {
    return <ul className="mb-4 ml-6 list-disc">{children}</ul>;
  },

  ol({ children }) {
    return <ol className="mb-4 ml-6 list-decimal">{children}</ol>;
  },

  li({ children }) {
    return <li className="mb-1">{children}</li>;
  },

  h1({ children }) {
    return <h1 className="mb-4 text-2xl font-bold">{children}</h1>;
  },

  h2({ children }) {
    return <h2 className="mb-3 text-xl font-bold">{children}</h2>;
  },

  h3({ children }) {
    return <h3 className="mb-2 text-lg font-bold">{children}</h3>;
  },
};
