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
import { FiDelete } from "react-icons/fi";
import { LuBookmarkX, LuBookmarkCheck, LuSettings2 } from "react-icons/lu";
import {
  HiOutlineChevronDoubleLeft,
  HiOutlineChevronDoubleRight,
} from "react-icons/hi";
import { Button } from "../ui/button";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useEffect } from "react";
import {
  Select,
  SelectItem,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import type { ChatStatus } from "~/lib/types";
import { deleteRepo } from "~/lib/db";

export default function ChatNav({
  userInfo,
  model,
  setModel,
  chatStatus,
  setChatStatus,
  showFileTreeAndCode,
  setShowFileTreeAndCode,
}: {
  userInfo: UserInfo;
  model: string;
  setModel: (model: string) => void;
  chatStatus: ChatStatus;
  setChatStatus: (chatStatus: ChatStatus) => void;
  showFileTreeAndCode: boolean;
  setShowFileTreeAndCode: (showFileTreeAndCode: boolean) => void;
}) {
  const params = useParams<{ id: string }>();
  const chatId = params.id;
  const router = useRouter();
  const MENU_ITEMS = [
    chatStatus.is_bookmarked
      ? {
          icon: <LuBookmarkX className="!h-5 !w-5" />,
          label: "Unbookmark",
          onClick: async () => {
            await handleBookmark(chatId, userInfo.id!);
            setChatStatus({
              is_bookmarked: false,
            });
          },
        }
      : {
          icon: <LuBookmarkCheck className="!h-5 !w-5" />,
          label: "Bookmark",
          onClick: async () => {
            await handleBookmark(chatId, userInfo.id!);
            setChatStatus({
              is_bookmarked: true,
            });
          },
        },
    {
      icon: <FiDelete className="!h-5 !w-5" />,
      label: "Delete",
      className:
        "text-red-600 hover:bg-red-50 hover:text-red-700 focus:bg-red-50 focus:text-red-700 dark:text-red-400 dark:hover:bg-red-950/50 dark:hover:text-red-300 dark:focus:bg-red-950/50 dark:focus:text-red-300",
      onClick: async () => {
        await handleDelete(chatId, userInfo.id!);
        router.push("/");
      },
    },
  ];

  const MODEL_OPTIONS = [
    {
      name: "GPT-4o",
      value: "gpt-4o",
    },
    {
      name: "Claude 3.5 Sonnet",
      value: "claude-3-5-sonnet-20241022",
      disabled: true,
    },
  ];

  useEffect(() => {
    const storedModel = window.localStorage.getItem("model");
    if (
      // storedModel === "claude-3-5-sonnet-20241022" ||
      storedModel === "gpt-4o"
    ) {
      setModel(storedModel);
    } else {
      window.localStorage.setItem("model", "gpt-4o");
    }
  }, [setModel, params.id]);

  return (
    <main className="flex w-full items-center justify-between p-2">
      <div className="flex items-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="hidden text-zinc-600 dark:text-zinc-300 md:flex"
              onClick={() => {
                setShowFileTreeAndCode(!showFileTreeAndCode);
                window.localStorage.setItem(
                  `${chatId}-showFileTreeAndCode`,
                  (!showFileTreeAndCode).toString(),
                );
              }}
            >
              {showFileTreeAndCode ? (
                <HiOutlineChevronDoubleLeft className="!h-5 !w-5" />
              ) : (
                <HiOutlineChevronDoubleRight className="!h-5 !w-5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent className="rounded-lg px-2 py-1.5 text-sm font-medium">
            {showFileTreeAndCode
              ? "Hide file tree and code"
              : "Show file tree and code"}
          </TooltipContent>
        </Tooltip>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-zinc-600 dark:text-zinc-300"
            >
              <LuSettings2 className="!h-5 !w-5" />
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
                disabled={option.disabled}
                className="px-2 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
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

export async function handleBookmark(chatId: string, userId: string) {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat/${chatId}/bookmark`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
        }),
      },
    );
    const data = (await response.json()) as { message: string; status: number };

    toast.success(data.message);
  } catch (error) {
    toast.error((error as Error).message);
  }
}

export async function handleDelete(chatId: string, userId: string) {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }

    toast.loading("Deleting chat...");
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat/${chatId}/delete`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
        }),
      },
    );
    const data = (await response.json()) as { message: string; status: number };
    if (data.status === 200) {
      await deleteRepo(chatId);
    }

    toast.dismiss();
    toast.success(data.message);
  } catch (error) {
    toast.dismiss();
    toast.error((error as Error).message);
  }
}
