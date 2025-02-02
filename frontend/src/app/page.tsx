import { SearchBar } from "~/components/search-bar";
import { FaReact } from "react-icons/fa";
import { auth } from "@clerk/nextjs/server";
import { Recents } from "~/components/recents";
import PageWrapper from "~/components/page-wrapper";
import type { RecentChat } from "~/lib/types";

export default async function HomePage() {
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
    <PageWrapper className="items-center justify-center">
      <div className="z-10 w-full max-w-3xl space-y-6 text-center">
        <div className="flex items-center justify-center space-x-4">
          <FaReact className="h-16 w-16 text-[#58C4DC]" />
          <h1 className="text-5xl font-bold">ReactChat</h1>
        </div>
        <p className="text-md dark:text-white/80 md:text-xl">
          Easily chat with open source React apps
        </p>
        <SearchBar userId={userId} />
      </div>
      {chats.length > 0 && <Recents recentChats={chats} userId={userId} />}
    </PageWrapper>
  );
}
