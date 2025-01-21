import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar";
import AppSidebar from "~/components/core/sidebar";
import { cookies } from "next/headers";
import { currentUser } from "@clerk/nextjs/server";
import type { UserInfo } from "~/lib/types";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar:state")?.value === "true";
  const user = await currentUser();
  const userInfo: UserInfo = {
    id: user?.id ?? null,
    fullName: user?.fullName ?? null,
    username: user?.username ?? null,
    imageUrl: user?.imageUrl ?? null,
    email: user?.primaryEmailAddress?.emailAddress ?? null,
  };

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar userInfo={userInfo} />
      <SidebarInset>
        {/* TODO: Style mobile trigger later */}
        <SidebarTrigger className="md:hidden" />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
