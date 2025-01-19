"use client";

import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { FaGithub } from "react-icons/fa";
import Link from "next/link";
import { ThemeToggle } from "~/components/theme-toggle";

export default function HomePage() {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const url = formData.get("url") as string;
    console.log(url);
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-6">
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>

      <div className="z-10 w-full max-w-3xl space-y-6 text-center">
        <div className="flex items-center justify-center space-x-4">
          <FaGithub className="h-12 w-12" />
          <h1 className="font-mono text-5xl font-bold">RepoFlow</h1>
        </div>
        <p className="text-md font-mono md:text-xl dark:text-white/80">
          Actually understand open source GitHub repos
        </p>

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
      </div>

      <div className="absolute bottom-4 right-4 z-10 font-mono text-sm dark:text-white/80">
        made by{" "}
        <Link
          href="https://github.com/anmhrk"
          className="underline transition-colors duration-200 hover:underline-offset-4 dark:hover:text-white"
        >
          @anmhrk
        </Link>
      </div>
    </main>
  );
}
