"use client";

import { useState, useRef, type KeyboardEvent } from "react";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { FaArrowUp } from "react-icons/fa6";
import { cn } from "~/lib/utils";

export default function ChatInput() {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const lineBreaks = (textarea.value.match(/\n/g) ?? []).length;

    const contentWidth = textarea.clientWidth - 32;
    const characterWidth = 8;
    const charsPerLine = Math.floor(contentWidth / characterWidth);
    const wrappedLines = Math.ceil(textarea.value.length / charsPerLine);

    const totalRows = Math.max(4, Math.min(lineBreaks + wrappedLines, 20));

    textarea.rows = totalRows;
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    adjustTextareaHeight();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    console.log("Submitting:", input);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.rows = 4;
    }
    formRef.current?.reset();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="relative flex w-full items-end gap-2 p-3"
    >
      <Textarea
        ref={textareaRef}
        name="message"
        placeholder="Ask a question..."
        className="w-full resize-none rounded-lg border border-zinc-200 bg-[#FAFAFA] p-3 pr-14 focus-visible:ring-0 dark:border-zinc-800 dark:bg-[#141415]"
        rows={4}
        value={input}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        style={{
          maxHeight: "480px",
        }}
      />
      <Button
        type="submit"
        size="icon"
        variant="outline"
        className={cn(
          "absolute right-5 top-1/2 h-8 w-8 shrink-0 translate-y-1/3 rounded-xl",
          input.trim()
            ? "bg-black dark:bg-white"
            : "bg-[#F4F4F5] dark:bg-[#1F1F22]",
        )}
      >
        <FaArrowUp
          className={cn(
            "h-4 w-4",
            input.trim() ? "text-white" : "text-black dark:text-white",
          )}
        />
      </Button>
    </form>
  );
}
