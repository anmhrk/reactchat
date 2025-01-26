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
import { usePathname } from "next/navigation";
import { FaReact } from "react-icons/fa";
import Link from "next/link";

export function Header({ userInfo }: { userInfo: UserInfo }) {
  const pathname = usePathname();
  const isRecentsPage = pathname === "/recents";
  const { openSignIn } = useClerk();
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  return (
    <header className="flex h-14 items-center justify-between px-4">
      {isRecentsPage && (
        <Link href="/" className="flex items-center gap-3 p-2">
          <FaReact className="h-7 w-7 text-[#58C4DC]" />
          <h1 className="text-xl font-bold">ReactChat</h1>
        </Link>
      )}
      <div className="ml-auto flex items-center gap-2">
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
    </header>
  );
}
