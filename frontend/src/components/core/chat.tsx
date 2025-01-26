"use client";

import ChatInput from "./chat-input";
import ChatNav from "./chat-nav";
import type { UserInfo } from "~/lib/types";
import { ScrollArea } from "~/components/ui/scroll-area";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";

export default function Chat({ userInfo }: { userInfo: UserInfo }) {
  const [indexingStatus, setIndexingStatus] = useState<string>("not_started");
  const [isLoading, setIsLoading] = useState(true);
  const params = useParams<{ id: string }>();
  const chatId = params.id;

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const fetchIndexingStatus = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/ingest/${chatId}/status`);
      const data = (await response.json()) as { status: string };
      setIndexingStatus(data.status);

      if (data.status === "in_progress") {
        setTimeout(() => void fetchIndexingStatus(), 2000);
      } else if (data.status === "completed") {
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error fetching indexing status:", error);
      setIndexingStatus("failed");
      setIsLoading(false);
    }
  };

  const startIndexing = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/ingest/${chatId}`, {
        method: "POST",
      });
      const data = (await response.json()) as { status: string };

      if (data.status === "already_indexed") {
        setIndexingStatus("completed");
        setIsLoading(false);
      } else if (data.status === "indexing_started") {
        setIndexingStatus("in_progress");
        void fetchIndexingStatus();
      }
    } catch (error) {
      console.error("Error starting indexing:", error);
      setIndexingStatus("failed");
      setIsLoading(false);
    }
  };

  // useEffect(() => {
  //   void startIndexing();
  //   return () => {
  //     setIndexingStatus("not_started");
  //   };
  // }, []);

  if (indexingStatus === "in_progress") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          Indexing repository... Please wait.
        </p>
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
          This may take a few minutes depending on the repository size.
        </p>
      </div>
    );
  }

  if (indexingStatus === "failed") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <p className="mb-4 text-sm text-red-600 dark:text-red-400">
          Indexing stopped. Please try again.
        </p>
        <Button
          onClick={() => void startIndexing()}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isLoading ? "Retrying..." : "Retry Indexing"}
        </Button>
      </div>
    );
  }

  return (
    <main className="flex flex-1 flex-col">
      <ChatNav userInfo={userInfo} />
      <ScrollArea className="flex-1">
        <div className="flex-1" />
      </ScrollArea>
      <ChatInput />
    </main>
  );
}
