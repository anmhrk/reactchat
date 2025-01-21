"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { Button } from "../ui/button";

export default function FileTree() {
  const { user } = useUser();

  return (
    <main className="hidden flex-col border-r border-zinc-600 bg-[#FAFAFA] dark:bg-background md:block md:w-[15%]">
      <div className="flex h-full flex-col justify-between">
        <div className="flex-1">File tree goes here</div>
        <div className="flex min-h-[60px] items-center justify-between p-3">
          <div className="flex items-center gap-2">
            <UserButton
              appearance={{
                elements: {
                  userButtonAvatarBox: "h-8 w-8",
                },
              }}
            />
            <span className="text-sm font-light">
              {user?.fullName ?? user?.username}
            </span>
          </div>
          <Button variant="ghost" size="icon"></Button>
        </div>
      </div>
    </main>
  );
}
