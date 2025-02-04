"use client";

import ChatInput from "./chat-input";
import ChatNav from "./chat-nav";
import type { UserInfo } from "~/lib/types";
import { ScrollArea } from "~/components/ui/scroll-area";
import Messages from "./messages";
import { useState, useCallback, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { SelectedContext } from "./layout-helper";
import type { ChatStatus } from "~/lib/types";
import { getRepo } from "~/lib/db";
import Link from "next/link";
import { useIsMobile } from "~/hooks/use-mobile";

export type Message = {
  id?: string;
  content: string;
  role: "user" | "assistant";
};

export default function Chat({
  userInfo,
  selectedContext,
  setSelectedContext,
  chatStatus,
  setChatStatus,
  showFileTreeAndCode,
  setShowFileTreeAndCode,
}: {
  userInfo: UserInfo;
  selectedContext: SelectedContext;
  setSelectedContext: React.Dispatch<React.SetStateAction<SelectedContext>>;
  chatStatus: ChatStatus;
  setChatStatus: (chatStatus: ChatStatus) => void;
  showFileTreeAndCode: boolean;
  setShowFileTreeAndCode: (showFileTreeAndCode: boolean) => void;
}) {
  const [model, setModel] = useState<string>("gpt-4o");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const params = useParams<{ id: string }>();
  const chatId = params.id;
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [repoName, setRepoName] = useState("");
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchMessages = async () => {
      const response = await fetch(
        `${BACKEND_URL}/chat/${chatId}/fetch/messages`,
      );

      if (response.ok) {
        const data = (await response.json()) as { messages: Message[] };
        setMessages(data.messages);
        setTimeout(() => {
          const scrollContainer = scrollAreaRef.current?.querySelector(
            "[data-radix-scroll-area-viewport]",
          );
          if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
          }
        }, 100);
      }
      setIsLoading(false);
    };

    const getRepoName = async () => {
      const repo = await getRepo(chatId);
      const parts = repo?.github_url.split("/").slice(-2);
      const [owner, name] = parts ?? [];
      setRepoName(`${owner}/${name}`);
    };

    void getRepoName();
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

  useEffect(() => {
    if (!isStreaming) return;
    const scrollContainer = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]",
    );
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [messages, isStreaming]);

  return (
    <main
      className={`flex flex-1 flex-col ${!showFileTreeAndCode && "mx-auto max-w-3xl"}`}
    >
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin" />
        </div>
      ) : (
        <>
          <ChatNav
            userInfo={userInfo}
            model={model}
            setModel={setModel}
            chatStatus={chatStatus}
            setChatStatus={setChatStatus}
            showFileTreeAndCode={showFileTreeAndCode}
            setShowFileTreeAndCode={setShowFileTreeAndCode}
          />
          {(!showFileTreeAndCode || isMobile) && (
            <div className="flex flex-col items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
              <p>
                Chatting with{" "}
                <Link href={`https://github.com/${repoName}`}>
                  <span className="font-medium text-foreground hover:underline">
                    {repoName}
                  </span>
                </Link>
              </p>
            </div>
          )}
          <ScrollArea className="flex-1" ref={scrollAreaRef}>
            <Messages messages={messages} isStreaming={isStreaming} />
          </ScrollArea>
          <ChatInput
            model={model}
            onNewMessage={handleNewMessage}
            isStreaming={isStreaming}
            setIsStreaming={setIsStreaming}
            selectedContext={selectedContext}
            setSelectedContext={setSelectedContext}
          />
        </>
      )}
    </main>
  );
}
