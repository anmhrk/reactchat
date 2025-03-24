"use client";

import { useState, useEffect } from "react";
import type { FileNode } from "~/lib/types";
import { FaChevronRight } from "react-icons/fa";
import { FaFolder, FaFolderOpen, FaFile } from "react-icons/fa";
import { cn } from "~/lib/utils";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ICON_MAP, ICON_COLORS } from "~/constants";

export default function FileTreeItem({
  node,
  selectedFile,
  onSelectFile,
  level = 0,
}: {
  node: FileNode;
  selectedFile: string | null;
  onSelectFile: (path: string) => void;
  level?: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const file = searchParams.get("file");

  // Auto expand file tree logic on refresh
  useEffect(() => {
    if (file && node.type === "directory") {
      const filePathParts = file.split("/");
      const currentDir = node.name;
      const currentLevelIndex = level;

      if (filePathParts[currentLevelIndex] === currentDir) {
        setIsOpen(true);
      }
    }
  }, [file, node.type, node.name, level]);

  const getFileIcon = () => {
    if (node.type === "directory") {
      return isOpen ? (
        <FaFolderOpen className="h-4 w-4 shrink-0 text-[#DCB67A]" />
      ) : (
        <FaFolder className="h-4 w-4 shrink-0 text-[#DCB67A]" />
      );
    }

    // Checks for exact file name match first
    if (node.name in ICON_MAP) {
      const Icon = ICON_MAP[node.name as keyof typeof ICON_MAP];
      const colorClass = ICON_COLORS[node.name as keyof typeof ICON_COLORS];
      return <Icon className={`h-4 w-4 shrink-0 ${colorClass}`} />;
    }

    // Checks for file extension match
    const extension = `.${node.name.split(".").pop()}`;
    if (extension in ICON_MAP) {
      const Icon = ICON_MAP[extension as keyof typeof ICON_MAP];
      const colorClass = ICON_COLORS[extension as keyof typeof ICON_COLORS];
      return <Icon className={`h-4 w-4 shrink-0 ${colorClass}`} />;
    }

    return <FaFile className="h-4 w-4 shrink-0 text-[#8C8C8C]" />;
  };

  return (
    <li className="relative">
      {/* Indent guides */}
      {level > 0 && (
        <div
          className="absolute left-0 h-full w-px bg-zinc-200 dark:bg-zinc-800"
          style={{ left: `${level * 12}px` }}
        />
      )}

      <div
        role="button"
        onClick={() => {
          if (node.type === "file") {
            onSelectFile(node.path);
            router.push(`/chat/${params.id}?file=${node.path}`);
          } else {
            setIsOpen(!isOpen);
          }
        }}
        className={cn(
          "group flex h-6 items-center gap-1 rounded-sm px-2 py-0.5",
          "hover:bg-zinc-200 dark:hover:bg-zinc-800/50",
          selectedFile === node.path && "bg-zinc-300 dark:bg-zinc-700/50",
          "relative",
          { "pl-[calc(12px_*_var(--level)_+_8px)]": level > 0 },
        )}
        style={{ "--level": level } as React.CSSProperties}
      >
        {node.type === "directory" && (
          <FaChevronRight
            className={cn(
              "h-3 w-3 shrink-0 text-zinc-400 transition-transform",
              isOpen && "rotate-90",
            )}
          />
        )}
        {getFileIcon()}
        <span className="truncate text-sm text-zinc-700 dark:text-zinc-300">
          {node.name}
        </span>
      </div>

      {isOpen && node.children && (
        <ul>
          {node.children.map((child) => (
            <FileTreeItem
              key={child.path}
              node={child}
              selectedFile={selectedFile}
              onSelectFile={onSelectFile}
              level={level + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
