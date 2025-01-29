"use client";

import type { UserInfo } from "~/lib/types";
import type { IngestStatus } from "~/app/chat/[id]/page";
import Chat from "./chat";
import Code from "./code";
import FileTree from "./file-tree";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { Progress } from "~/components/ui/progress";

const POLL_INTERVAL = 1000; // 1 second

export default function LayoutHelper({
  userInfo,
  initialStatus,
}: {
  userInfo: UserInfo;
  initialStatus: IngestStatus;
}) {
  const [indexingStatus, setIndexingStatus] =
    useState<IngestStatus>(initialStatus);
  const [progress, setProgress] = useState(0);
  const params = useParams<{ id: string }>();
  const chatId = params.id;
  const pollingRef = useRef<NodeJS.Timeout>();

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const pollIndexingStatus = useCallback(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/ingest/${chatId}/status`);
      const data = (await response.json()) as {
        status: IngestStatus;
        progress: number;
      };
      setIndexingStatus(data.status);

      if (data.progress !== undefined) {
        setProgress(data.progress);
      }

      if (data.status === "in_progress") {
        pollingRef.current = setTimeout(
          () => void pollIndexingStatus(),
          POLL_INTERVAL,
        );
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
          setIndexingStatus("in_progress");
          const response = await fetch(`${BACKEND_URL}/ingest/${chatId}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          });

          const data = (await response.json()) as { status: IngestStatus };

          if (data.status === "completed") {
            setIndexingStatus("completed");
          } else if (data.status === "in_progress") {
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

    return () => {
      if (pollingRef.current) {
        clearTimeout(pollingRef.current);
      }
    };
  }, [indexingStatus, BACKEND_URL, chatId, pollIndexingStatus]);

  if (indexingStatus === "in_progress" || indexingStatus === "not_started") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-6">
          <Progress value={progress} className="w-[180px]" />
          <p className="text-md text-zinc-500 dark:text-zinc-400">
            {indexingStatus === "not_started"
              ? "Preparing to index codebase..."
              : `Indexing codebase (${Math.round(progress)}%)... Please wait.`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex h-screen overflow-hidden">
      <FileTree />
      <Code />
      <Chat userInfo={userInfo} />
    </main>
  );
}
