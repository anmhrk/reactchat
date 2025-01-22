import FileTree from "~/components/core/file-tree";
import Code from "~/components/core/code";
import Chat from "~/components/core/chat";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // add check here to see if valid chat id

  return (
    <main className="flex h-screen">
      <FileTree />
      <Code />
      <Chat />
    </main>
  );
}
