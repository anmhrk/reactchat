import ChatInput from "./chat-input";
import ChatNav from "./chat-nav";
import type { UserInfo } from "~/lib/types";

export default function Chat({ userInfo }: { userInfo: UserInfo }) {
  return (
    <main className="flex flex-1 flex-col">
      <ChatNav userInfo={userInfo} />
      <div className="flex-1" /> {/* Spacer for messages */}
      <ChatInput />
    </main>
  );
}
