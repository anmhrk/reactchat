import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import PageWrapper from "~/components/page-wrapper";
import { Recents } from "~/components/recents";
import { serverFetch } from "~/lib/server-fetch";
import type { RecentChat } from "~/lib/types";

export default async function RecentsPage() {
  const { userId } = await auth();

  let chats: RecentChat[] = [];
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  if (userId) {
    const response = await serverFetch(`${BACKEND_URL}/chat/recents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = (await response.json()) as { chats: RecentChat[] };
      chats = data.chats;
    }
  } else {
    redirect("/");
  }

  return (
    <PageWrapper className="items-center">
      <Recents recentChats={chats} userId={userId} />
    </PageWrapper>
  );
}
