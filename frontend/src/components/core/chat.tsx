"use client";

import ChatInput from "./chat-input";
import ChatNav from "./chat-nav";
import type { UserInfo } from "~/lib/types";
import { ScrollArea } from "~/components/ui/scroll-area";
import Messages from "./messages";
import { useState, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export type Message = {
  id?: string;
  content: string;
  role: "user" | "assistant";
};

export default function Chat({ userInfo }: { userInfo: UserInfo }) {
  const [model, setModel] = useState<string>("claude-3-5-sonnet-20241022");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const params = useParams<{ id: string }>();
  const chatId = params.id;

  useEffect(() => {
    const fetchMessages = async () => {
      const response = await fetch(
        `${BACKEND_URL}/chat/${chatId}/fetch/messages`,
      );

      if (response.ok) {
        const data = (await response.json()) as { messages: Message[] };
        setMessages(data.messages);
      }
      setIsLoading(false);
    };
    void fetchMessages();
  }, [chatId, BACKEND_URL]);

  const handleNewMessage = useCallback((message: Message) => {
    setMessages((prevMessages) => {
      if (message.id) {
        const exists = prevMessages.some((msg) => msg.id === message.id);
        if (exists) {
          return prevMessages.map((msg) =>
            msg.id === message.id ? message : msg,
          );
        }
      }

      return [...prevMessages, message];
    });
  }, []);

  // Todo: Skeleton loading
  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  return (
    <main className="flex flex-1 flex-col">
      <ChatNav userInfo={userInfo} model={model} setModel={setModel} />
      <ScrollArea className="flex-1">
        <Messages messages={messages} isStreaming={isStreaming} />
      </ScrollArea>
      <ChatInput
        model={model}
        onNewMessage={handleNewMessage}
        isStreaming={isStreaming}
        setIsStreaming={setIsStreaming}
      />
    </main>
  );
}
