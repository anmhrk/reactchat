"use client";

import { dark } from "@clerk/themes";
import { useClerk } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { Button } from "./ui/button";
import type { UserInfo } from "~/lib/types";
import Image from "next/image";
import { DropdownMenu, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { UserDropdown } from "./user-dropdown";
import { ThemeToggle } from "./theme-toggle";

export function Header({ userInfo }: { userInfo: UserInfo }) {
  const { openSignIn } = useClerk();
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  return (
    <div className="absolute right-3 top-2 z-10 flex items-center gap-2">
      <ThemeToggle />
      {userInfo.id ? (
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
      ) : (
        <Button
          onClick={() =>
            openSignIn({
              appearance: { baseTheme: isDarkMode ? dark : undefined },
            })
          }
          className="h-8 rounded-lg px-2"
        >
          Sign in
        </Button>
      )}
    </div>
  );
}
