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
      className="w-50 rounded-lg border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
      align="end"
    >
      <div className="px-2 py-1.5">
        <p className="text-sm font-medium text-zinc-900 dark:text-white">
          {userInfo.fullName ?? userInfo.username}
        </p>
        <p className="line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">
          {userInfo.email}
        </p>
      </div>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onClick={() => signOut()}
        className="flex cursor-pointer items-center px-2 py-1.5 text-sm"
      >
        <MdLogout className="h-4 w-4" />
        Sign out
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}
