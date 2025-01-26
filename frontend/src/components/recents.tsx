/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

"use client";

import Link from "next/link";
import type { RecentChat } from "~/lib/types";
import { PiClockCounterClockwiseBold } from "react-icons/pi";
import { FaChevronRight, FaGithub } from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";
import { usePathname } from "next/navigation";

export function Recents({ chats }: { chats: RecentChat[] }) {
  const pathname = usePathname();
  const isRecentsPage = pathname === "/recents";

  return (
    <div className="w-full max-w-3xl py-14">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
          <PiClockCounterClockwiseBold className="h-7 w-7" />
          <h2 className="text-xl font-semibold">Your recent chats</h2>
        </div>
        <Link
          href="/recents"
          className="flex items-center text-sm text-black/70 transition-colors hover:text-black dark:text-white/80 dark:hover:text-white"
        >
          View all
          <FaChevronRight className="ml-1 h-3 w-3" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {chats.slice(0, 6).map((chat) => (
          <Link
            key={chat.id}
            href={`/chat/${chat.id}`}
            className="flex flex-col rounded-xl bg-zinc-100 p-4 shadow-sm transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
          >
            <div className="mb-auto flex items-center gap-2">
              <FaGithub className="h-4 w-4 shrink-0" />
              <h3 className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {chat.github_url.split("/").slice(-1)[0]}
              </h3>
            </div>
            <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-500">
              {formatDistanceToNow(new Date(chat.created_at), {
                addSuffix: true,
              })}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
