import FileTree from "~/components/core/file-tree";
import Code from "~/components/core/code";
import Chat from "~/components/core/chat";
import Sidebar from "~/components/core/sidebar";

export default async function Page({
  params,
}: {
  params: Promise<{ owner: string; name: string }>;
}) {
  const { owner, name } = await params;

  return (
    <main className="flex h-screen">
      {/* <FileTree />
      <Code />
      <Chat /> */}
    </main>
  );
}
