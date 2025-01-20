"use client";

import { useClerk } from "@clerk/nextjs";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useTheme } from "next-themes";
import { dark } from "@clerk/themes";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function SearchBar({ userId }: { userId: string | null }) {
  const [isLoading, setIsLoading] = useState(false);
  const { openSignIn } = useClerk();
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  const router = useRouter();

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!userId) {
      openSignIn({ appearance: { baseTheme: isDarkMode ? dark : undefined } });
      return;
    }

    const formData = new FormData(e.target as HTMLFormElement);
    const url = formData.get("url") as string;

    setIsLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const data = (await response.json()) as {
        message: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error);
      }

      router.push(data.message);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsLoading(false);
    }
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
        disabled={isLoading}
        className="h-12 w-full px-6 font-mono font-bold md:w-auto md:min-w-[100px]"
      >
        {isLoading ? (
          <Loader2 className="!h-6 !w-6 animate-spin text-white dark:text-black" />
        ) : (
          "Search"
        )}
      </Button>
    </form>
  );
}
