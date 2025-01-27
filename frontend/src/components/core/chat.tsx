"use client";

import ChatInput from "./chat-input";
import ChatNav from "./chat-nav";
import type { UserInfo } from "~/lib/types";
import { ScrollArea } from "~/components/ui/scroll-area";

export default function Chat({ userInfo }: { userInfo: UserInfo }) {
  return (
    <main className="flex flex-1 flex-col">
      <ChatNav userInfo={userInfo} />
      <ScrollArea className="flex-1">
        <div className="flex-1" />
      </ScrollArea>
      <ChatInput />
    </main>
  );
}
