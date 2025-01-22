"use client";

import { useState } from "react";
import type { FileNode } from "~/lib/types";
import { FaChevronRight } from "react-icons/fa";
import {
  FaFolder,
  FaFile,
  FaInfoCircle,
  FaGitAlt,
  FaHtml5,
  FaCss3,
} from "react-icons/fa";
import { SiTypescript, SiJavascript, SiNextdotjs } from "react-icons/si";
import { FaReact } from "react-icons/fa";
import { VscJson } from "react-icons/vsc";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { useParams, useRouter } from "next/navigation";

const ICON_MAP = {
  ".ts": SiTypescript,
  ".tsx": FaReact,
  ".js": SiJavascript,
  ".mjs": SiJavascript,
  ".jsx": FaReact,
  ".json": VscJson,
  ".md": FaInfoCircle,
  ".gitignore": FaGitAlt,
  ".html": FaHtml5,
  "next.config.ts": SiNextdotjs,
  "next.config.js": SiNextdotjs,
  ".css": FaCss3,
};

const ICON_COLORS = {
  ".ts": "text-[#0088D1]",
  ".tsx": "text-[#58C4DC]",
  ".js": "text-[#FFCA27]",
  ".mjs": "text-[#FFCA27]",
  ".jsx": "text-[#58C4DC]",
  ".json": "text-gray-500",
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
}: {
  node: FileNode;
  selectedFile: string | null;
  onSelectFile: (path: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const getFileIcon = () => {
    if (node.type === "directory") {
      return <FaFolder className="!h-5 !w-5 text-sky-500" />;
    }

    // Checks for exact file name match first (for next.config.ts/js)
    if (node.name in ICON_MAP) {
      const Icon = ICON_MAP[node.name as keyof typeof ICON_MAP];
      const colorClass = ICON_COLORS[node.name as keyof typeof ICON_COLORS];
      return <Icon className={`ml-[22px] !h-5 !w-5 ${colorClass}`} />;
    }

    // Checks for file extension match
    const extension = `.${node.name.split(".").pop()}`;
    if (extension in ICON_MAP) {
      const Icon = ICON_MAP[extension as keyof typeof ICON_MAP];
      const colorClass = ICON_COLORS[extension as keyof typeof ICON_COLORS];
      return <Icon className={`ml-[22px] !h-5 !w-5 ${colorClass}`} />;
    }

    // Default file icon if no match found
    return (
      <FaFile className="ml-[22px] !h-5 !w-5 text-gray-500 dark:text-gray-400" />
    );
  };

  return (
    <li key={node.path}>
      <Button
        variant="ghost"
        onClick={() => {
          if (node.type === "file") {
            onSelectFile(node.path);
            router.push(`/chat/${params.id}?file=${node.path}`);
          } else {
            setIsOpen(!isOpen);
          }
        }}
        className={cn(
          "h-8 w-full justify-start gap-1.5 rounded-sm px-2 py-1 text-left text-sm font-normal transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800/50",
          selectedFile === node.path && "bg-zinc-200 dark:bg-zinc-800",
          "focus-visible:ring-1 focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-300",
        )}
      >
        {node.type === "directory" && (
          <FaChevronRight
            className={cn(
              "h-3.5 w-3.5 text-zinc-500/80 transition-transform dark:text-zinc-400",
              isOpen && "rotate-90",
            )}
          />
        )}
        {getFileIcon()}
        <span className="truncate text-zinc-700 dark:text-zinc-300">
          {node.name}
        </span>
      </Button>
      {isOpen && node.children && (
        <ul className="pl-3 pt-0.5">
          {node.children.map((child) => (
            <FileTreeItem
              key={child.path}
              node={child}
              selectedFile={selectedFile}
              onSelectFile={onSelectFile}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
