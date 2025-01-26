import FileTree from "~/components/core/file-tree";
import Code from "~/components/core/code";
import Chat from "~/components/core/chat";
import { currentUser } from "@clerk/nextjs/server";
import type { UserInfo } from "~/lib/types";

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
  } else {
    return (
      <main className="flex h-screen">
        <FileTree />
        <Code />
        <Chat userInfo={userInfo} />
      </main>
    );
  }
}
