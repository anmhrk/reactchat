"use client";

import ChatInput from "./chat-input";
import ChatNav from "./chat-nav";
import type { UserInfo } from "~/lib/types";
import { ScrollArea } from "~/components/ui/scroll-area";
import type { IngestStatus } from "~/app/chat/[id]/page";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";

const POLL_INTERVAL = 7000; // 7 seconds

export default function Chat({
  userInfo,
  initialStatus,
}: {
  userInfo: UserInfo;
  initialStatus: IngestStatus;
}) {
  const [indexingStatus, setIndexingStatus] =
    useState<IngestStatus>(initialStatus);
  const params = useParams<{ id: string }>();
  const chatId = params.id;

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const pollIndexingStatus = useCallback(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/ingest/${chatId}/status`);
      const data = (await response.json()) as { status: IngestStatus };
      setIndexingStatus(data.status);

      if (data.status === "in_progress") {
        setTimeout(() => void pollIndexingStatus(), POLL_INTERVAL);
      }
    } catch (error) {
      console.log(error);
      setIndexingStatus("failed");
    }
  }, [BACKEND_URL, chatId]);

  useEffect(() => {
    if (indexingStatus === "not_started") {
      const startIndexing = async () => {
        try {
          const response = await fetch(`${BACKEND_URL}/ingest/${chatId}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          });

          const data = (await response.json()) as { status: IngestStatus };

          if (data.status === "already_indexed") {
            setIndexingStatus("completed");
          } else if (data.status === "indexing_started") {
            setIndexingStatus("in_progress");
            void pollIndexingStatus();
          }
        } catch (error) {
          console.log(error);
          setIndexingStatus("failed");
        }
      };

      void startIndexing();
    } else if (indexingStatus === "in_progress") {
      void pollIndexingStatus();
    }
  }, [indexingStatus, BACKEND_URL, chatId, pollIndexingStatus]);

  return (
    <main className="flex flex-1 flex-col">
      <ChatNav userInfo={userInfo} />
      {indexingStatus === "in_progress" ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <Loader2 className="h-16 w-16 animate-spin" />
          <p className="text-md text-zinc-500 dark:text-zinc-400">
            Indexing... Please wait.
          </p>
          {/* Todo: Show progress bar */}
        </div>
      ) : (
        <>
          <ScrollArea className="flex-1">
            <div className="flex-1" />
          </ScrollArea>
          <ChatInput />
        </>
      )}
    </main>
  );
}
