import { useAuth } from "@clerk/nextjs";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { MdLogout } from "react-icons/md";
import type { UserInfo } from "~/lib/types";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function UserDropdown({ userInfo }: { userInfo: UserInfo }) {
  const { signOut } = useAuth();
  const params = useParams<{ id: string }>();
  const isChatPage = !!params.id;
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenuContent
      className="w-60 rounded-lg border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
      align="end"
    >
      <div className="px-2 py-1.5">
        <p className="text-sm font-medium text-zinc-900 dark:text-white">
          {userInfo.fullName ?? userInfo.username}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {userInfo.email}
        </p>
      </div>

      <DropdownMenuSeparator className="my-1 bg-zinc-200 dark:bg-zinc-800" />

      {isChatPage && (
        <DropdownMenuItem
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setTheme(theme === "dark" ? "light" : "dark");
          }}
          className="flex cursor-pointer items-center px-2 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 focus:bg-zinc-100 focus:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white dark:focus:bg-zinc-800 dark:focus:text-white"
        >
          <Sun className="mr-2 h-6 w-6 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute mr-2 h-6 w-6 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          {theme === "dark" ? "Toggle light mode" : "Toggle dark mode"}
        </DropdownMenuItem>
      )}

      <DropdownMenuItem
        onClick={() => signOut()}
        className="flex cursor-pointer items-center px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 focus:bg-red-50 focus:text-red-700 dark:text-red-400 dark:hover:bg-red-950/50 dark:hover:text-red-300 dark:focus:bg-red-950/50 dark:focus:text-red-300"
      >
        <MdLogout className="mr-2 h-4 w-4" />
        Sign out
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}
