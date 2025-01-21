import { useAuth } from "@clerk/nextjs";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { MdLogout } from "react-icons/md";
import type { UserInfo } from "~/lib/types";

export function UserDropdown({ userInfo }: { userInfo: UserInfo }) {
  const { signOut } = useAuth();

  return (
    <DropdownMenuContent
      className="w-56 rounded-md border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
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

      <DropdownMenuItem
        onClick={() => signOut()}
        className="flex cursor-pointer items-center px-2 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 focus:bg-zinc-100 focus:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white dark:focus:bg-zinc-800 dark:focus:text-white"
      >
        <MdLogout className="mr-2 h-4 w-4" />
        Sign out
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}
