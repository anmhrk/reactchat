import { SearchBar } from "~/components/search-bar";
import { FaReact } from "react-icons/fa";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { Header } from "~/components/header";
import type { UserInfo } from "~/lib/types";

export default async function HomePage() {
  const user = await currentUser();
  const userInfo: UserInfo = {
    id: user?.id ?? null,
    fullName: user?.fullName ?? null,
    username: user?.username ?? null,
    imageUrl: user?.imageUrl ?? null,
    email: user?.primaryEmailAddress?.emailAddress ?? null,
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-6">
      <Header userInfo={userInfo} />
      <div className="z-10 w-full max-w-3xl space-y-6 text-center">
        <div className="flex items-center justify-center space-x-4">
          <FaReact className="h-12 w-12 text-[#58C4DC]" />
          <h1 className="font-mono text-5xl font-bold">ReactChat</h1>
        </div>
        <p className="text-md font-mono dark:text-white/80 md:text-xl">
          Easily chat with open source React apps
        </p>
        <SearchBar userId={userInfo.id} />
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
          href="https://github.com/anmhrk/reactchat"
          className="underline transition-colors duration-200 hover:underline-offset-4 dark:hover:text-white"
        >
          source code
        </Link>
      </div>
    </main>
  );
}
