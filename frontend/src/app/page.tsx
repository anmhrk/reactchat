"use client";

import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { FaGithub } from "react-icons/fa";
import Link from "next/link";

export default function HomePage() {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const url = formData.get("url") as string;
    console.log(url);
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden">
        <div className="animate-blob absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        <div className="animate-blob animation-delay-2000 absolute right-1/4 top-1/3 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        <div className="animate-blob animation-delay-4000 absolute bottom-1/4 left-1/3 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
      </div>
      <div className="relative z-10 w-full max-w-3xl space-y-6 text-center">
        <div className="flex items-center justify-center space-x-4">
          <FaGithub className="h-12 w-12" />
          <h1 className="font-mono text-5xl font-bold">RepoFlow</h1>
        </div>
        <p className="text-md font-mono text-white/80 md:text-xl">
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
            className="h-12 flex-1 border-white/20 bg-white/10 font-mono placeholder:text-white/50"
          />
          <Button
            type="submit"
            className="h-12 w-full px-6 font-mono font-bold md:w-auto"
          >
            Search
          </Button>
        </form>
      </div>

      <div className="absolute bottom-4 right-4 z-10 font-mono text-sm text-white/80">
        made by{" "}
        <Link
          href="https://github.com/anmhrk"
          className="underline transition-colors duration-200 hover:text-white hover:underline-offset-4"
        >
          @anmhrk
        </Link>
      </div>
    </main>
  );
}
