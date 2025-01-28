"use client";

import ChatInput from "./chat-input";
import ChatNav from "./chat-nav";
import type { UserInfo } from "~/lib/types";
import { ScrollArea } from "~/components/ui/scroll-area";
import Messages from "./messages";
import { useState } from "react";

export default function Chat({ userInfo }: { userInfo: UserInfo }) {
  const [model, setModel] = useState<string>("claude-3-5-sonnet-20241022");

  return (
    <main className="flex flex-1 flex-col">
      <ChatNav userInfo={userInfo} model={model} setModel={setModel} />
      <ScrollArea className="flex-1">
        <Messages />
      </ScrollArea>
      <ChatInput model={model} />
    </main>
  );
}
