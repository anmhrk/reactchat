"use client";

import type { UserInfo } from "~/lib/types";
import type { ChatStatus, IngestStatus } from "~/lib/types";
import Chat from "./chat";
import Code from "./code";
import FileTree from "./file-tree";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { Progress } from "~/components/ui/progress";
import { useClientFetch } from "~/lib/client-fetch";

const POLL_INTERVAL = 1000; // poll every second

export type SelectedContext = Record<string, string[]>; // { file_path: [code_snippet] }

export default function LayoutHelper({
  userInfo,
  initialStatus,
  initialChatStatus,
}: {
  userInfo: UserInfo;
  initialStatus: IngestStatus;
  initialChatStatus: ChatStatus;
}) {
  const [indexingStatus, setIndexingStatus] =
    useState<IngestStatus>(initialStatus);
  const [progress, setProgress] = useState(0);
  const [selectedContext, setSelectedContext] = useState<SelectedContext>({});
  const [chatStatus, setChatStatus] = useState<ChatStatus>(initialChatStatus);
  const params = useParams<{ id: string }>();
  const chatId = params.id;
  const pollingRef = useRef<NodeJS.Timeout>();
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const [showFileTreeAndCode, setShowFileTreeAndCode] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const clientFetch = useClientFetch();

  useEffect(() => {
    const res = window.localStorage.getItem(`${chatId}-showFileTreeAndCode`);
    if (!res) {
      window.localStorage.setItem(`${chatId}-showFileTreeAndCode`, "true");
    } else {
      setShowFileTreeAndCode(res === "true");
    }
    setIsLoading(false);
  }, [chatId]);

  const pollIndexingStatus = useCallback(async () => {
    try {
      const response = await clientFetch(
        `${BACKEND_URL}/ingest/${chatId}/status`,
      );
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
  }, [BACKEND_URL, chatId, clientFetch]);

  useEffect(() => {
    if (indexingStatus === "not_started") {
      const startIndexing = async () => {
        try {
          setIndexingStatus("in_progress");
          const response = await clientFetch(
            `${BACKEND_URL}/ingest/${chatId}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
            },
          );

          const data = (await response.json()) as { status: IngestStatus };

          if (data.status === "completed") {
            setIndexingStatus("completed");
            window.location.reload();
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
  }, [indexingStatus, BACKEND_URL, chatId, pollIndexingStatus, clientFetch]);

  if (isLoading) {
    return null;
  }

  if (indexingStatus === "completed") {
    return (
      <main className="flex h-screen">
        {showFileTreeAndCode ? (
          <>
            <FileTree />
            <Code setSelectedContext={setSelectedContext} />
            <Chat
              showFileTreeAndCode={showFileTreeAndCode}
              setShowFileTreeAndCode={setShowFileTreeAndCode}
              userInfo={userInfo}
              selectedContext={selectedContext}
              setSelectedContext={setSelectedContext}
              chatStatus={chatStatus}
              setChatStatus={setChatStatus}
            />
          </>
        ) : (
          <>
            <Chat
              showFileTreeAndCode={showFileTreeAndCode}
              setShowFileTreeAndCode={setShowFileTreeAndCode}
              userInfo={userInfo}
              selectedContext={selectedContext}
              setSelectedContext={setSelectedContext}
              chatStatus={chatStatus}
              setChatStatus={setChatStatus}
            />
          </>
        )}
      </main>
    );
  } else if (indexingStatus === undefined || indexingStatus === "in_progress") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-6">
          <Progress value={progress} className="w-[180px]" />
          <p className="text-md text-zinc-500 dark:text-zinc-400">
            {`Indexing codebase (${Math.round(progress)}%)... Please wait.`}
          </p>
        </div>
      </div>
    );
  } else if (indexingStatus === "failed") {
    return <p>Something went wrong. Please try again.</p>;
  }
}
