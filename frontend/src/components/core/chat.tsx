"use client";

import ChatInput from "./chat-input";
import ChatNav from "./chat-nav";
import type { UserInfo } from "~/lib/types";
import { ScrollArea } from "~/components/ui/scroll-area";
import Messages from "./messages";
import { useState, useCallback } from "react";

export type Message = {
  content: string;
  role: "user" | "assistant";
};

export default function Chat({ userInfo }: { userInfo: UserInfo }) {
  const [model, setModel] = useState<string>("claude-3-5-sonnet-20241022");
  const [messages, setMessages] = useState<Message[]>([]);

  const handleNewMessage = useCallback((message: Message) => {
    setMessages((prevMessages) => {
      if (
        prevMessages.length > 0 &&
        prevMessages[prevMessages.length - 1]!.role === "assistant"
      ) {
        const updatedMessages = [...prevMessages];
        const lastMessage = updatedMessages[updatedMessages.length - 1];
        if (lastMessage) {
          updatedMessages[updatedMessages.length - 1] = {
            ...lastMessage,
            content: lastMessage.content + message.content,
          };
        }
        return updatedMessages;
      } else {
        return [...prevMessages, message];
      }
    });
  }, []);

  return (
    <main className="flex flex-1 flex-col">
      <ChatNav userInfo={userInfo} model={model} setModel={setModel} />
      <ScrollArea className="flex-1">
        <Messages messages={messages} />
      </ScrollArea>
      <ChatInput model={model} onNewMessage={handleNewMessage} />
    </main>
  );
}
