import { auth } from "@clerk/nextjs/server";
import PageWrapper from "~/components/page-wrapper";
import { Recents } from "~/components/recents";
import type { RecentChat } from "~/lib/types";

export default async function RecentsPage() {
  const { userId } = await auth();

  let chats: RecentChat[] = [];
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  if (userId) {
    const response = await fetch(`${BACKEND_URL}/chat/recents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_id: userId }),
    });

    if (response.ok) {
      const data = (await response.json()) as { chats: RecentChat[] };
      chats = data.chats;
    }
  }

  return (
    <PageWrapper className="items-center">
      <Recents chats={chats} userId={userId} />
    </PageWrapper>
  );
}
