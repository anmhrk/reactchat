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
    <div className="flex min-h-screen flex-col">
      <Header userInfo={userInfo} />

      <main className={cn("flex flex-1 flex-col px-6", className)}>
        {children}
      </main>

      <footer className="mt-auto py-4">
        <div className="mx-auto flex items-center justify-end px-4">
          <div className="flex items-center gap-1 text-sm">
            built by{" "}
            <Link
              href="https://github.com/anmhrk/reactchat"
              className="underline transition-colors duration-200 hover:underline-offset-4 dark:hover:text-white"
            >
              @anmhrk
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
