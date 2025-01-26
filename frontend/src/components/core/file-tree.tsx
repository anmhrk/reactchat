"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getRepo, setRepo } from "~/lib/db";
import type { FileNode } from "~/lib/types";
import FileTreeItem from "./file-tree-item";
import { Skeleton } from "~/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "~/components/ui/scroll-area";
import Link from "next/link";
import { FaReact } from "react-icons/fa";

export default function FileTree() {
  const [tree, setTree] = useState<FileNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const file = searchParams.get("file");

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  useEffect(() => {
    async function loadRepo() {
      // will first try to load repo from local db
      // if not found, will fetch from backend and save to local db

      try {
        const cachedRepo = await getRepo(params.id);
        if (cachedRepo) {
          buildTree(cachedRepo.files);
          setIsLoading(false);
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
        setIsLoading(false);
      }
    }

    void loadRepo();
  }, [params.id, BACKEND_URL]);

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

    const sortTree = (nodes: FileNode[]): FileNode[] => {
      return nodes
        .sort((a, b) => {
          if (a.type === b.type) {
            return a.name.localeCompare(b.name);
          }
          return a.type === "directory" ? -1 : 1;
        })
        .map((node) => {
          if (node.children) {
            node.children = sortTree(node.children);
          }
          return node;
        });
    };

    setTree(sortTree(root));
  }

  useEffect(() => {
    if (file) {
      setSelectedFile(file);
    }
  }, [file]);

  return (
    <main className="hidden w-[15%] flex-col border-r border-zinc-200 bg-[#F3F3F3] dark:border-zinc-800 dark:bg-[#0F0F10] md:flex">
      <Link href="/" className="flex items-center gap-2 p-2">
        <FaReact className="h-7 w-7 text-[#58C4DC]" />
        <h1 className="text-xl font-bold">ReactChat</h1>
      </Link>
      {isLoading ? (
        <Loading />
      ) : (
        <>
          <ScrollArea className="h-full">
            <ul className="px-3 py-2 pb-8 pt-3">
              {tree.map((node) => (
                <FileTreeItem
                  key={node.path}
                  node={node}
                  selectedFile={selectedFile}
                  onSelectFile={setSelectedFile}
                />
              ))}
            </ul>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </>
      )}
    </main>
  );
}

function Loading() {
  return (
    <div className="space-y-2 p-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={`skeleton-group-${index}`} className="space-y-4">
          {/* First level */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-3.5 w-3.5" />
            <Skeleton className="h-3.5 w-[120px]" />
          </div>

          {/* Nested items */}
          <div className="space-y-2.5 pl-5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3.5 w-3.5" />
              <Skeleton className="h-3.5 w-[100px]" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-3.5 w-3.5" />
              <Skeleton className="h-3.5 w-[80px]" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-3.5 w-3.5" />
              <Skeleton className="h-3.5 w-[95px]" />
            </div>
          </div>

          {/* Another top level item */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-3.5 w-3.5" />
            <Skeleton className="h-3.5 w-[110px]" />
          </div>

          {/* More nested items */}
          <div className="space-y-2.5 pl-5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3.5 w-3.5" />
              <Skeleton className="h-3.5 w-[85px]" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-3.5 w-3.5" />
              <Skeleton className="h-3.5 w-[70px]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
