"use client";

import { dark } from "@clerk/themes";
import { useClerk } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { Button } from "./ui/button";
import { Sun, Moon } from "lucide-react";
import type { UserInfo } from "~/lib/types";
import Image from "next/image";
import { DropdownMenu, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { UserDropdown } from "./user-dropdown";

export function Header({ userInfo }: { userInfo: UserInfo }) {
  const { openSignIn } = useClerk();
  const { theme, setTheme } = useTheme();
  const isDarkMode = theme === "dark";

  return (
    <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
      {userInfo.id ? (
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
      ) : (
        <Button
          onClick={() =>
            openSignIn({
              appearance: { baseTheme: isDarkMode ? dark : undefined },
            })
          }
          variant="outline"
        >
          Sign in
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      >
        <Sun className="h-6 w-6 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-6 w-6 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </Button>
    </div>
  );
}
