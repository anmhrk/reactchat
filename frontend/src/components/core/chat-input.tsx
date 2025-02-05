"use client";

import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { FaArrowUp } from "react-icons/fa6";
import { cn } from "~/lib/utils";
import { useParams } from "next/navigation";
import type { Message } from "./chat";
import type { SelectedContext } from "./layout-helper";
import { X } from "lucide-react";
import type { UserInfo } from "~/lib/types";

export default function ChatInput({
  userInfo,
  model,
  onNewMessage,
  isStreaming,
  setIsStreaming,
  selectedContext,
  setSelectedContext,
}: {
  userInfo: UserInfo;
  model: string;
  onNewMessage: (message: Message) => void;
  isStreaming: boolean;
  setIsStreaming: (isStreaming: boolean) => void;
  selectedContext: SelectedContext;
  setSelectedContext: React.Dispatch<React.SetStateAction<SelectedContext>>;
}) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const params = useParams<{ id: string }>();
  const chatId = params.id;

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const lineBreaks = (textarea.value.match(/\n/g) ?? []).length;

    const contentWidth = textarea.clientWidth - 32;
    const characterWidth = 8;
    const charsPerLine = Math.floor(contentWidth / characterWidth);
    const wrappedLines = Math.ceil(textarea.value.length / charsPerLine);

    const totalRows = Math.max(3, Math.min(lineBreaks + wrappedLines, 15));

    textarea.rows = totalRows;
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    adjustTextareaHeight();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      content: input,
      role: "user",
    };
    onNewMessage(userMessage);
    setInput("");
    setIsStreaming(true);
    const assistantMessageId = Date.now().toString();
    onNewMessage({ id: assistantMessageId, content: "", role: "assistant" });

    try {
      const response = await fetch(`${BACKEND_URL}/chat/${chatId}/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userInfo.id,
          message: input,
          model,
          selected_context: selectedContext,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to get reader");
      }

      let assistantMessageContent = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split("\n\n");

        for (const line of lines) {
          if (line.startsWith("data:")) {
            const jsonStr = line.substring(5);
            try {
              const payload = JSON.parse(jsonStr) as { content: string };
              assistantMessageContent = payload.content;
              onNewMessage({
                id: assistantMessageId,
                content: assistantMessageContent,
                role: "assistant",
              });
            } catch (e) {
              console.error("Error parsing JSON chunk:", e, jsonStr);
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsStreaming(false);
      if (textareaRef.current) {
        textareaRef.current.rows = 3;
      }
      formRef.current?.reset();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  return (
    <div className="flex w-full flex-col gap-2 p-3">
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="flex flex-col gap-0"
      >
        <Textarea
          ref={textareaRef}
          name="message"
          placeholder="Ask a question..."
          className="w-full resize-none rounded-t-lg border border-zinc-200 bg-[#FAFAFA] p-3 focus-visible:ring-0 dark:border-zinc-800 dark:bg-[#141415]"
          rows={3}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          style={{
            maxHeight: "480px",
            borderBottomLeftRadius: "0",
            borderBottomRightRadius: "0",
            borderBottom: "none",
          }}
        />
        <div className="flex w-full items-center justify-between rounded-b-lg border border-t-0 border-zinc-200 bg-[#FAFAFA] p-2 dark:border-zinc-800 dark:bg-[#141415]">
          {selectedContext && Object.keys(selectedContext).length > 0 ? (
            <>
              <div className="flex items-center justify-center text-sm text-zinc-500 dark:text-zinc-400">
                {Object.entries(selectedContext).reduce(
                  (total, [_, selections]) => total + selections.length,
                  0,
                )}{" "}
                code snippet
                {Object.entries(selectedContext).reduce(
                  (total, [_, selections]) => total + selections.length,
                  0,
                ) === 1
                  ? ""
                  : "s"}{" "}
                added as context
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-2 h-4 w-4 bg-[#FAFAFA] hover:bg-[#FAFAFA] hover:text-red-500 dark:bg-[#141415] dark:hover:bg-[#141415]"
                  onClick={() => {
                    setSelectedContext({});
                  }}
                >
                  <X />
                </Button>
              </div>
            </>
          ) : (
            <div></div>
          )}
          <Button
            type="submit"
            disabled={!input.trim() || isStreaming}
            size="icon"
            variant="outline"
            className={cn(
              "h-8 w-8 shrink-0 rounded-xl border-zinc-300 transition-all duration-300 dark:border-zinc-700",
              input.trim()
                ? "bg-black dark:bg-white"
                : "bg-[#F4F4F5] dark:bg-[#1F1F22]",
            )}
          >
            <FaArrowUp
              className={cn(
                "h-4 w-4",
                input.trim()
                  ? "text-white dark:text-black"
                  : "text-black dark:text-white",
              )}
            />
          </Button>
        </div>
      </form>
    </div>
  );
}
