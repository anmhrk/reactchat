/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

// Todo: hover on mobile for the buttons? look into it later
// Todo: add a select all chats button + delete button when all chats are selected

"use client";

import Link from "next/link";
import type { RecentChat } from "~/lib/types";
import { PiClockCounterClockwiseBold } from "react-icons/pi";
import { FaChevronRight, FaGithub } from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";
import { usePathname } from "next/navigation";
import { Input } from "~/components/ui/input";
import { useState } from "react";
import { IoSearchOutline } from "react-icons/io5";
import { Button } from "~/components/ui/button";
import { FiShare, FiDelete } from "react-icons/fi";
import { FaRegBookmark } from "react-icons/fa";
import { handleBookmark, handleDelete, handleShare } from "./core/chat-nav";

export function Recents({ chats }: { chats: RecentChat[] }) {
  const pathname = usePathname();
  const isRecentsPage = pathname === "/recents";
  const [search, setSearch] = useState("");

  return (
    <div className="w-full max-w-3xl py-14">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
          <PiClockCounterClockwiseBold className="h-7 w-7" />
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            Your recent chats
            {isRecentsPage && (
              <span className="text-sm text-zinc-500 dark:text-zinc-500">
                ({chats.length} chat{chats.length > 1 ? "s" : ""})
              </span>
            )}
          </h2>
        </div>
        {!isRecentsPage && (
          <Link
            href="/recents"
            className="flex items-center text-sm text-black/70 transition-colors hover:text-black dark:text-white/80 dark:hover:text-white"
          >
            View all
            <FaChevronRight className="ml-1 h-3 w-3" />
          </Link>
        )}
      </div>

      {isRecentsPage && (
        <div className="relative mb-4 flex items-center justify-between">
          <IoSearchOutline className="absolute left-3 top-1/2 h-6 w-6 -translate-y-1/2" />
          <Input
            placeholder="Search..."
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-12 flex-1 border-gray-300 bg-white/80 pl-12 !text-[15px] placeholder:text-gray-500 dark:border-white/20 dark:bg-white/10 dark:placeholder:text-white/50"
          />
        </div>
      )}

      {isRecentsPage ? (
        <div className="mt-14 w-full">
          {chats
            .filter((chat) => chat.github_url.includes(search.toLowerCase()))
            .slice(0, 6)
            .map((chat) => (
              <Link
                key={chat.id}
                href={`/chat/${chat.id}`}
                className="group flex flex-col rounded-xl bg-zinc-100 p-4 shadow-sm transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
              >
                <div className="mb-auto flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FaGithub className="h-4 w-4 shrink-0" />
                    <h3 className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {chat.github_url.split("/").slice(-1)[0]}
                    </h3>
                  </div>
                  <div className="invisible items-center gap-1 group-hover:visible">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-zinc-600 hover:!bg-zinc-100 dark:text-zinc-300 dark:hover:!bg-zinc-800"
                      onClick={async (e) => {
                        e.preventDefault();

                        const shareUrl = `${process.env.NEXT_PUBLIC_FRONTEND_URL}/chat/${chat.id}`;
                        await handleShare(shareUrl);
                      }}
                    >
                      <FiShare className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-zinc-600 hover:!bg-zinc-100 dark:text-zinc-300 dark:hover:!bg-zinc-800"
                      onClick={async (e) => {
                        e.preventDefault();
                        await handleBookmark();
                      }}
                    >
                      <FaRegBookmark className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-600 hover:!bg-zinc-100 hover:text-red-700 dark:text-red-400 dark:hover:!bg-zinc-800 dark:hover:text-red-300"
                      onClick={async (e) => {
                        e.preventDefault();
                        await handleDelete();
                      }}
                    >
                      <FiDelete className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-500">
                  {formatDistanceToNow(new Date(chat.created_at), {
                    addSuffix: true,
                  })}
                </p>
              </Link>
            ))}
        </div>
      ) : (
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
      )}
    </div>
  );
}
