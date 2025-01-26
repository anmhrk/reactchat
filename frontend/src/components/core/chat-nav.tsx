"use client";

import Image from "next/image";
import type { UserInfo } from "~/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { UserDropdown } from "../user-dropdown";
import { ThemeToggle } from "../theme-toggle";
import { FiShare, FiDelete } from "react-icons/fi";
import { FaRegBookmark } from "react-icons/fa6";
import { HiOutlineChevronDoubleLeft } from "react-icons/hi";
import { BsThreeDots } from "react-icons/bs";
import { Button } from "../ui/button";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import {
  Select,
  SelectItem,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

export default function ChatNav({ userInfo }: { userInfo: UserInfo }) {
  const [model, setModel] = useState<string>("claude-3-5-sonnet-20241022");
  const params = useParams<{ id: string }>();
  const shareUrl = `${process.env.NEXT_PUBLIC_FRONTEND_URL}/chat/${params.id}`;

  useEffect(() => {
    const storedModel = window.localStorage.getItem("model");
    if (storedModel) {
      setModel(storedModel);
    } else {
      window.localStorage.setItem("model", "claude-3-5-sonnet-20241022");
    }
  }, []);

  const MENU_ITEMS = [
    {
      icon: <FiShare className="!h-5 !w-5" />,
      label: "Share",
      onClick: () => handleShare(shareUrl),
    },
    {
      icon: <FaRegBookmark className="!h-5 !w-5" />,
      label: "Bookmark",
      onClick: () => handleBookmark(),
    },
    {
      icon: <FiDelete className="!h-5 !w-5" />,
      label: "Delete",
      className:
        "text-red-600 hover:bg-red-50 hover:text-red-700 focus:bg-red-50 focus:text-red-700 dark:text-red-400 dark:hover:bg-red-950/50 dark:hover:text-red-300 dark:focus:bg-red-950/50 dark:focus:text-red-300",
      onClick: () => handleDelete(),
    },
  ];

  const MODEL_OPTIONS = [
    {
      name: "Claude 3.5 Sonnet",
      value: "claude-3-5-sonnet-20241022",
    },
    {
      name: "GPT-4o",
      value: "gpt-4o",
    },
    {
      name: "Deepseek R1",
      value: "deepseek-r1",
    },
  ];

  return (
    <main className="flex w-full items-center justify-between p-2">
      <div className="flex items-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-zinc-600 dark:text-zinc-300"
            >
              <HiOutlineChevronDoubleLeft className="!h-5 !w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="rounded-lg px-2 py-1.5 text-sm font-medium">
            Hide file tree and code
          </TooltipContent>
        </Tooltip>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-zinc-600 dark:text-zinc-300"
            >
              <BsThreeDots className="!h-5 !w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-40 rounded-lg border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
          >
            {MENU_ITEMS.map((item) => (
              <DropdownMenuItem
                key={item.label}
                onClick={item.onClick}
                className={`flex cursor-pointer items-center px-2 py-1.5 text-sm text-zinc-600 dark:text-zinc-300 ${item.className}`}
              >
                {item.icon}
                {item.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Select
          value={model}
          onValueChange={(value) => {
            setModel(value);
            window.localStorage.setItem("model", value);
          }}
        >
          <SelectTrigger className="ml-2 w-40 border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900">
            <SelectValue placeholder={model ?? "Select Model"} />
          </SelectTrigger>
          <SelectContent className="rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
            {MODEL_OPTIONS.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className="cursor-pointer px-2 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Image
              src={userInfo.imageUrl ?? ""}
              alt="User avatar"
              width={28}
              height={28}
              className="rounded-full object-cover hover:cursor-pointer"
            />
          </DropdownMenuTrigger>
          <UserDropdown userInfo={userInfo} />
        </DropdownMenu>
      </div>
    </main>
  );
}

export async function handleShare(shareUrl: string) {
  // Todo: implement sharing on backend, make chat id public, then fix middleware
  await navigator.clipboard.writeText(shareUrl);
  toast.success("Link copied to clipboard");
}

export async function handleBookmark() {
  // Todo: implement bookmarking
}

export async function handleDelete() {
  // Todo: implement deleting chat
}
