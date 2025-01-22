"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getRepo, setRepo } from "~/lib/db";
import type { FileNode } from "~/lib/types";
import { Suspense } from "react";
import { Skeleton } from "~/components/ui/skeleton";
import { cn } from "~/lib/utils";

export default function FileTree() {
  const [tree, setTree] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  useEffect(() => {
    async function loadRepo() {
      // will first try to load repo from local db
      // if not found, will fetch from backend and save to local db

      try {
        const cachedRepo = await getRepo(params.id);
        if (cachedRepo) {
          buildTree(cachedRepo.files);
          setLoading(false);
          return;
        }

        const response = await fetch(
          `${BACKEND_URL}/repo/${decodeURIComponent(params.id)}`,
        );
        const data = (await response.json()) as {
          files: { path: string; content: string }[];
          github_url: string;
        };

        await setRepo(params.id, data);
        buildTree(data.files);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    void loadRepo();
  }, [params.id]);

  function buildTree(files: { path: string; content: string }[]) {
    const root: FileNode[] = [];

    files.forEach(({ path, content }) => {
      const parts = path.split("/");
      let currentLevel = root;

      parts.forEach((part, index) => {
        const isFile = index === parts.length - 1;
        const existing = currentLevel.find((node) => node.name === part);

        if (existing) {
          if (!isFile) {
            currentLevel = existing.children!;
          }
        } else {
          const newNode: FileNode = {
            name: part,
            path,
            type: isFile ? "file" : "directory",
            ...(isFile ? { content } : { children: [] }),
          };

          currentLevel.push(newNode);
          if (!isFile) {
            currentLevel = newNode.children!;
          }
        }
      });
    });

    setTree(root);
  }

  const renderNode = (node: FileNode, level = 0) => (
    <div key={node.path} style={{ paddingLeft: `${level * 12}px` }}>
      <button
        onClick={() => setSelectedFile(node.path)}
        className={cn(
          "flex w-full items-center rounded px-2 py-1 text-left text-sm hover:bg-zinc-200 dark:hover:bg-zinc-800",
          selectedFile === node.path && "bg-zinc-200 dark:bg-zinc-800",
        )}
      >
        {node.name}
      </button>
      {node.children?.map((child) => renderNode(child, level + 1))}
    </div>
  );

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <main className="hidden flex-col border-r border-zinc-600 bg-[#FAFAFA] dark:bg-background md:block md:w-[12%]">
        {tree.map((node) => renderNode(node))}
      </main>
    </Suspense>
  );
}
