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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  // Breadcrumbs generation
  const generateBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean);
    // paths[0] is workspace slug, remove it for breadcrumb labeling? 
    // Usually we want: Workspace / Section / SubSection
    // But since workspace is in sidebar, maybe just Section / SubSection
    // Let's assume paths[1+] are the sections.
    
    // Example: /workspace-slug/settings/billing
    // -> Settings / Billing
    
    const breadcrumbs = [];
    if (paths.length > 1) {
        let currentPath = `/${paths[0]}`;
        for (let i = 1; i < paths.length; i++) {
            currentPath += `/${paths[i]}`;
            const label = paths[i].charAt(0).toUpperCase() + paths[i].slice(1);
            breadcrumbs.push({
                label: label,
                href: i === paths.length - 1 ? null : currentPath
            });
        }
    } else {
         breadcrumbs.push({ label: 'Dashboard', href: null });
    }
    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <SidebarProvider>
      <DashboardSidebar 
        workspaces={workspaces}
        currentWorkspace={currentWorkspace}
        onSwitchWorkspace={handleWorkspaceSwitch}
        user={session?.user}
        onSignOut={handleSignOut}
      />
      <SidebarInset>
        <header className="flex sticky top-0 z-10 bg-background h-16 shrink-0 items-center justify-between gap-2 border-b px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
                <Breadcrumb>
                    <BreadcrumbList>
                        {breadcrumbs.map((crumb, index) => (
                        <React.Fragment key={index}>
                            <BreadcrumbItem className="hidden md:block">
                            {crumb.href ? (
                                <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                            ) : (
                                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
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
            <div className="flex items-center gap-2">
                <ModeToggle />
            </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <main className="flex-1 py-4">
            {children}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
