"use client";

import { useClerk } from "@clerk/nextjs";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useTheme } from "next-themes";
import { dark } from "@clerk/themes";

export function SearchBar({ userId }: { userId: string | null }) {
  const { openSignIn } = useClerk();
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!userId) {
      openSignIn({ appearance: { baseTheme: isDarkMode ? dark : undefined } });
      return;
    }

    const formData = new FormData(e.target as HTMLFormElement);
    const url = formData.get("url") as string;
    console.log(url);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-2xl space-y-2 md:flex md:gap-2 md:space-y-0"
    >
      <Input
        name="url"
        type="text"
        placeholder="Enter GitHub repository URL"
        required
        className="h-12 flex-1 border-gray-300 bg-white/80 font-mono placeholder:text-gray-500 dark:border-white/20 dark:bg-white/10 dark:placeholder:text-white/50"
      />
      <Button
        type="submit"
        className="h-12 w-full px-6 font-mono font-bold md:w-auto"
      >
        Search
      </Button>
    </form>
  );
}
