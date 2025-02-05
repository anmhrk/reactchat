"use client";

import { useState, useEffect } from "react";
import type { FileNode } from "~/lib/types";
import { FaChevronRight } from "react-icons/fa";
import {
  FaFolder,
  FaFolderOpen,
  FaFile,
  FaInfoCircle,
  FaGitAlt,
  FaHtml5,
  FaCss3,
} from "react-icons/fa";
import { SiTypescript, SiJavascript, SiNextdotjs } from "react-icons/si";
import { IoIosSettings } from "react-icons/io";
import { FaReact } from "react-icons/fa";
import { VscJson } from "react-icons/vsc";
import { cn } from "~/lib/utils";
import { useParams, useRouter, useSearchParams } from "next/navigation";

const ICON_MAP = {
  ".ts": SiTypescript,
  ".tsx": FaReact,
  ".js": SiJavascript,
  ".mjs": SiJavascript,
  ".cjs": SiJavascript,
  ".jsx": FaReact,
  ".json": VscJson,
  ".md": FaInfoCircle,
  ".gitignore": FaGitAlt,
  ".html": FaHtml5,
  "next.config.ts": SiNextdotjs,
  "next.config.js": SiNextdotjs,
  ".css": FaCss3,
  ".env.example": IoIosSettings,
};

const ICON_COLORS = {
  ".ts": "text-[#0088D1]",
  ".tsx": "text-[#58C4DC]",
  ".js": "text-[#FFCA27]",
  ".mjs": "text-[#FFCA27]",
  ".cjs": "text-[#FFCA27]",
  ".jsx": "text-[#58C4DC]",
  ".json": "text-black dark:text-white/80",
  ".md": "text-[#42A5F5]",
  ".gitignore": "text-[#E64A19]",
  ".html": "text-[#FFCA27]",
  "next.config.ts": "dark:text-[#CFD8DB] text-black/80",
  "next.config.js": "dark:text-[#CFD8DB] text-black/80",
  ".css": "text-[#42A5F5]",
};

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
