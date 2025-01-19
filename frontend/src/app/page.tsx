import { SearchBar } from "~/components/search-bar";
import { FaGithub } from "react-icons/fa";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Header } from "~/components/header";

export default async function HomePage() {
  const { userId } = await auth();

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-6">
      <Header userId={userId} />
      <div className="z-10 w-full max-w-3xl space-y-6 text-center">
        <div className="flex items-center justify-center space-x-4">
          <FaGithub className="h-12 w-12" />
          <h1 className="font-mono text-5xl font-bold">RepoFlow</h1>
        </div>
        <p className="text-md font-mono md:text-xl dark:text-white/80">
          Actually understand open source GitHub repos
        </p>
        <SearchBar userId={userId} />
      </div>

      <div className="absolute bottom-4 right-4 z-10 font-mono text-sm dark:text-white/80">
        built by{" "}
        <Link
          href="https://github.com/anmhrk"
          className="underline transition-colors duration-200 hover:underline-offset-4 dark:hover:text-white"
        >
          @anmhrk
        </Link>
        {" | "}
        <Link
          href="https://github.com/anmhrk/repoflow"
          className="underline transition-colors duration-200 hover:underline-offset-4 dark:hover:text-white"
        >
          source code
        </Link>
      </div>
    </main>
  );
}
