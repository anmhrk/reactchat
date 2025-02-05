import { currentUser } from "@clerk/nextjs/server";
import type { ChatStatus, IngestStatus, UserInfo } from "~/lib/types";
import LayoutHelper from "~/components/core/layout-helper";
import type { Metadata } from "next";

type Props = {
  params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  try {
    const response = await fetch(`${BACKEND_URL}/chat/${params.id}/repo-name`);
    if (response.ok) {
      const { repo_name } = (await response.json()) as { repo_name: string };
      return {
        title: `${repo_name} - ReactChat`,
      };
    }
  } catch (error) {
    console.error("Failed to fetch repo name:", error);
  }

  // Fallback
  return {
    title: `Chat ${params.id} - ReactChat`,
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await currentUser();
  const userInfo: UserInfo = {
    id: user?.id ?? null,
    fullName: user?.fullName ?? null,
    imageUrl: user?.imageUrl ?? null,
    email: user?.primaryEmailAddress?.emailAddress ?? null,
  };

  const chatId = (await params).id;
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const chat = await fetch(`${BACKEND_URL}/chat/${chatId}/validate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: userInfo.id,
    }),
  });

  if (!chat.ok) {
    if (chat.status === 404) {
      return <div>Chat Not Found</div>;
    }
    if (chat.status === 403) {
      return <div>Forbidden</div>;
    }
  }

  const chatStatus = (await chat.json()) as ChatStatus;

  // Fetch indexing status on server
  const statusResponse = await fetch(`${BACKEND_URL}/ingest/${chatId}/status`);
  const { status } = (await statusResponse.json()) as { status: IngestStatus };

  return (
    <LayoutHelper
      userInfo={userInfo}
      initialStatus={status}
      initialChatStatus={chatStatus}
    />
  );
}
