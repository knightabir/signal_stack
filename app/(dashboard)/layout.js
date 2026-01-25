'use client';
import React from 'react';
import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { ModeToggle } from "@/components/mode-toggle"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export default function DashboardLayout({ children }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);

  // Extract workspace slug from pathname
  const workspaceSlug = pathname.split('/')[1];

  // Fetch workspaces
  useEffect(() => {
    if (status === 'authenticated') {
      fetchWorkspaces();
    }
  }, [status]);

  // Set current workspace when workspaces are loaded
  useEffect(() => {
    if (workspaces.length > 0 && workspaceSlug) {
      const workspace = workspaces.find((w) => w.slug === workspaceSlug);
      if (workspace) {
        setCurrentWorkspace(workspace);
      }
    }
  }, [workspaces, workspaceSlug]);

  const fetchWorkspaces = async () => {
    try {
      const res = await fetch('/api/workspaces');
      const data = await res.json();
      if (data.workspaces) {
        setWorkspaces(data.workspaces);
      }
    } catch (error) {
      console.error('Failed to fetch workspaces:', error);
    }
  };

  const handleWorkspaceSwitch = (workspace) => {
    setCurrentWorkspace(workspace);
    router.push(`/${workspace.slug}`);
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/sign-in' });
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500" />
      </div>
    );
  }

  // Breadcrumbs generation
  const generateBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean);
    const breadcrumbs = [];
    if (paths.length > 1) {
        let currentPath = `/${paths[0]}`;
        // Skip the workspace slug for the first breadcrumb label if desired, 
        // or keep it to show hierarchy: Workspace > Section
        
        // Add "Dashboard" or Workspace Name as root?
        // Let's rely on the path structure.
        
        for (let i = 1; i < paths.length; i++) {
            currentPath += `/${paths[i]}`;
            const label = paths[i].charAt(0).toUpperCase() + paths[i].slice(1).replace(/-/g, ' ');
            breadcrumbs.push({
                label: label,
                href: i === paths.length - 1 ? null : currentPath
            });
        }
    } else {
         breadcrumbs.push({ label: 'Overview', href: null });
    }
    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-zinc-50/50 dark:bg-zinc-950/50">
        <DashboardSidebar 
          workspaces={workspaces}
          currentWorkspace={currentWorkspace}
          onSwitchWorkspace={handleWorkspaceSwitch}
          user={session?.user}
          onSignOut={handleSignOut}
        />
        <SidebarInset className="flex w-full flex-col bg-zinc-50/50 dark:bg-zinc-950/50">
          <header className="flex h-14 items-center gap-2 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-900/50 px-4 backdrop-blur-sm sticky top-0 z-10 transition-all">
              <div className="flex items-center gap-2">
                  <SidebarTrigger className="-ml-1" />
                  <Separator orientation="vertical" className="mr-2 h-4 bg-zinc-200 dark:bg-zinc-800" />
                  <Breadcrumb>
                      <BreadcrumbList>
                          <BreadcrumbItem className="hidden md:block">
                              <span className="text-zinc-500 dark:text-zinc-400 font-medium">
                                {currentWorkspace?.name || 'Loading...'}
                              </span>
                          </BreadcrumbItem>
                          {breadcrumbs.length > 0 && <BreadcrumbSeparator className="hidden md:block" />}
                          {breadcrumbs.map((crumb, index) => (
                          <React.Fragment key={index}>
                              <BreadcrumbItem className="hidden md:block">
                              {crumb.href ? (
                                  <BreadcrumbLink href={crumb.href} className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors">
                                    {crumb.label}
                                  </BreadcrumbLink>
                              ) : (
                                  <BreadcrumbPage className="font-semibold text-zinc-900 dark:text-zinc-100">
                                    {crumb.label}
                                  </BreadcrumbPage>
                              )}
                              </BreadcrumbItem>
                              {index < breadcrumbs.length - 1 && (
                              <BreadcrumbSeparator className="hidden md:block" />
                              )}
                          </React.Fragment>
                          ))}
                      </BreadcrumbList>
                  </Breadcrumb>
              </div>
              <div className="ml-auto flex items-center gap-2">
                  <ModeToggle />
              </div>
          </header>
          
          <main className="flex-1 p-6">
            <div className="mx-auto w-full max-w-[1600px] animate-in fade-in slide-in-from-bottom-2 duration-500">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
