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
    username: user?.username ?? null,
    imageUrl: user?.imageUrl ?? null,
    email: user?.primaryEmailAddress?.emailAddress ?? null,
  };

  const { id } = await params;

  // add check here to see if valid chat id

  return (
    <main className="flex h-screen">
      <FileTree />
      <Code />
      <Chat userInfo={userInfo} />
    </main>
  );
}
