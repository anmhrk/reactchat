"use client";

import Image from "next/image";
import type { UserInfo } from "~/lib/types";
import { DropdownMenu, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { UserDropdown } from "../user-dropdown";

export default function ChatNav({ userInfo }: { userInfo: UserInfo }) {
  return (
    <main className="flex items-center justify-end px-2 py-1.5">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Image
            src={userInfo.imageUrl ?? ""}
            alt="User avatar"
            width={32}
            height={32}
            className="rounded-full object-cover hover:cursor-pointer"
          />
        </DropdownMenuTrigger>
        <UserDropdown userInfo={userInfo} />
      </DropdownMenu>
    </main>
  );
}
