"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
} from "../ui/sidebar";
import { ChevronsUpDown, PlusIcon } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger } from "../ui/dropdown-menu";
import Image from "next/image";
import type { UserInfo } from "~/lib/types";
import { UserDropdown } from "../user-dropdown";
import { FaReact } from "react-icons/fa";
import Link from "next/link";

export default function AppSidebar({ userInfo }: { userInfo: UserInfo }) {
  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarHeader className="flex flex-row items-center justify-between">
          <Link href="/" className="flex flex-row items-center gap-2 p-1">
            <FaReact className="mr-2 h-6 w-6 text-[#58C4DC]" />
            <span className="select-none text-lg font-bold tracking-tight text-primary/80 dark:text-primary/90">
              ReactChat
            </span>
          </Link>
          <SidebarTrigger />
        </SidebarHeader>

        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                variant="outline"
                className="relative flex h-9 w-full items-center justify-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-[14px] font-medium hover:bg-accent hover:text-accent-foreground"
              >
                <PlusIcon className="ml-2 !h-5 !w-5 text-primary/80" />
                <span>New Repo</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="p-1 text-[13px] font-normal">
            Recents
          </SidebarGroupLabel>
          {/* Todo: Map over recent repos once backend is implemented */}
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground focus-visible:ring-0"
                >
                  <Image
                    src={userInfo.imageUrl ?? ""}
                    alt="User avatar"
                    width={32}
                    height={32}
                    className="rounded-full object-cover"
                  />
                  <span className="truncate">{userInfo.fullName}</span>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <UserDropdown userInfo={userInfo} />
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
