"use client";

import * as React from "react";
import {
  LayoutDashboard,
  MessageSquare,
  Map,
  Bell,
  Settings,
  Users,
  Code,
  CreditCard,
  Plug,
  Building2,
  LogOut,
  Plus,
  ChevronsUpDown,
  BarChart3,
  Sparkles,
  Command,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function DashboardSidebar({
  workspaces = [],
  currentWorkspace,
  onSwitchWorkspace,
  user,
  onSignOut,
  ...props
}) {
  const pathname = usePathname();

  const navigation = [
    { name: "Overview", href: "", icon: LayoutDashboard },
    { name: "Feedback", href: "/feedback", icon: MessageSquare },
    { name: "Roadmap", href: "/roadmap", icon: Map },
    { name: "Changelog", href: "/changelog", icon: Bell },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Team", href: "/team", icon: Users },
  ];

  const settingsNavigation = [
    { name: "General", href: "/settings", icon: Settings },
    { name: "Widget", href: "/settings/widget", icon: Code },
    { name: "Billing", href: "/settings/billing", icon: CreditCard },
    { name: "Integrations", href: "/settings/integrations", icon: Plug },
    { name: "Workspace", href: "/settings/workspace", icon: Building2 },
  ];

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-950/50"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
                    <Command className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-bold text-zinc-900 dark:text-zinc-100">
                      {currentWorkspace?.name || "Select Workspace"}
                    </span>
                    <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {currentWorkspace?.role || "Free Plan"}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto text-zinc-400" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl"
                align="start"
                side="bottom"
                sideOffset={4}
              >
                <DropdownMenuLabel className="text-xs font-medium text-zinc-500 dark:text-zinc-400 px-2 py-1.5">
                  Workspaces
                </DropdownMenuLabel>
                {workspaces.map((workspace) => (
                  <DropdownMenuItem
                    key={workspace.id}
                    onClick={() => onSwitchWorkspace(workspace)}
                    className="gap-2 p-2 focus:bg-zinc-100 dark:focus:bg-zinc-800 rounded-lg cursor-pointer"
                  >
                    <div className="flex size-6 items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
                      <Building2 className="size-3 text-zinc-500" />
                    </div>
                    <span className="font-medium text-zinc-700 dark:text-zinc-200">
                      {workspace.name}
                    </span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
                <DropdownMenuItem className="gap-2 p-2 focus:bg-zinc-100 dark:focus:bg-zinc-800 rounded-lg cursor-pointer">
                  <div className="flex size-6 items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
                    <Plus className="size-3 text-zinc-500" />
                  </div>
                  <div className="font-medium text-zinc-500 dark:text-zinc-400">
                    Create Workspace
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-zinc-400 px-2">
            Platform
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const href = currentWorkspace
                  ? `/${currentWorkspace.slug}${item.href}`
                  : "#";
                const isActive =
                  pathname === href ||
                  (item.href === "" &&
                    pathname === `/${currentWorkspace?.slug}`);

                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.name}
                      className={
                        isActive
                          ? "bg-zinc-100 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 font-medium shadow-sm transition-all"
                          : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 transition-all"
                      }
                    >
                      <Link href={href}>
                        <item.icon
                          className={
                            isActive
                              ? "text-indigo-600 dark:text-indigo-400"
                              : "text-zinc-400"
                          }
                        />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-zinc-400 px-2">
            Configuration
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsNavigation.map((item) => {
                const href = currentWorkspace
                  ? `/${currentWorkspace.slug}${item.href}`
                  : "#";
                const isActive =
                  item.href === "/settings"
                    ? pathname === href
                    : pathname === href || pathname.startsWith(href + "/");

                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.name}
                      className={
                        isActive
                          ? "bg-zinc-100 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 font-medium shadow-sm transition-all"
                          : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 transition-all"
                      }
                    >
                      <Link href={href}>
                        <item.icon
                          className={
                            isActive
                              ? "text-indigo-600 dark:text-indigo-400"
                              : "text-zinc-400"
                          }
                        />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <Avatar className="h-8 w-8 rounded-lg border border-zinc-200 dark:border-zinc-700">
                    <AvatarFallback className="rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold">
                      {user?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-bold text-zinc-900 dark:text-zinc-100">
                      {user?.name || "User"}
                    </span>
                    <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {user?.email || ""}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 text-zinc-400" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg border border-zinc-200 dark:border-zinc-700">
                      <AvatarFallback className="rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold">
                        {user?.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-bold text-zinc-900 dark:text-zinc-100">
                        {user?.name || "User"}
                      </span>
                      <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                        {user?.email || ""}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
                <DropdownMenuItem
                  asChild
                  className="gap-2 p-2 focus:bg-zinc-100 dark:focus:bg-zinc-800 rounded-lg cursor-pointer"
                >
                  <Link href={`/${currentWorkspace?.slug}/settings/billing`}>
                    <Sparkles className="size-4 text-indigo-500" />
                    Upgrade to Pro
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
                <DropdownMenuItem
                  onClick={onSignOut}
                  className="gap-2 p-2 focus:bg-red-50 dark:focus:bg-red-900/10 text-red-600 dark:text-red-400 rounded-lg cursor-pointer"
                >
                  <LogOut className="size-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
