import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { Header } from "~/components/header";
import type { UserInfo } from "~/lib/types";
import { cn } from "~/lib/utils";

export default async function PageWrapper({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const user = await currentUser();
  const userInfo: UserInfo = {
    id: user?.id ?? null,
    fullName: user?.fullName ?? null,
    imageUrl: user?.imageUrl ?? null,
    email: user?.primaryEmailAddress?.emailAddress ?? null,
  };

  return (
    <main className={cn("relative flex min-h-screen flex-col p-6", className)}>
      <Header userInfo={userInfo} />

      {children}

      <div className="absolute bottom-2 right-3 z-10 text-sm dark:text-white/80">
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
