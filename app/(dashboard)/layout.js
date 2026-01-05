'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  MessageSquare,
  Map,
  Bell,
  Settings,
  Users,
  ChevronDown,
  LogOut,
  Plus,
  Building2,
  Menu,
  X,
  BarChart3,
  CreditCard,
  Code,
  Plug,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const navigation = [
  { name: 'Dashboard', href: '', icon: LayoutDashboard },
  { name: 'Feedback', href: '/feedback', icon: MessageSquare },
  { name: 'Roadmap', href: '/roadmap', icon: Map },
  { name: 'Changelog', href: '/changelog', icon: Bell },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Team', href: '/team', icon: Users },
];

const settingsNavigation = [
  { name: 'General', href: '/settings', icon: Settings },
  { name: 'Widget', href: '/settings/widget', icon: Code },
  { name: 'Billing', href: '/settings/billing', icon: CreditCard },
  { name: 'Integrations', href: '/settings/integrations', icon: Plug },
  { name: 'Workspace', href: '/settings/workspace', icon: Building2 },
];

export default function DashboardLayout({ children }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    setShowWorkspaceMenu(false);
    router.push(`/${workspace.slug}`);
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/sign-in' });
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-800/95 backdrop-blur-xl border-r border-slate-700/50 transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Workspace Switcher */}
          <div className="p-4 border-b border-slate-700/50">
            <button
              onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-white truncate max-w-[120px]">
                    {currentWorkspace?.name || 'Select Workspace'}
                  </p>
                  <p className="text-xs text-slate-400 capitalize">
                    {currentWorkspace?.role || 'Loading...'}
                  </p>
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform ${
                  showWorkspaceMenu ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Workspace Dropdown */}
            {showWorkspaceMenu && (
              <div className="absolute left-4 right-4 mt-2 bg-slate-700 rounded-lg border border-slate-600 shadow-xl z-50 overflow-hidden">
                <div className="max-h-48 overflow-y-auto">
                  {workspaces.map((workspace) => (
                    <button
                      key={workspace.id}
                      onClick={() => handleWorkspaceSwitch(workspace)}
                      className={`w-full flex items-center gap-3 p-3 hover:bg-slate-600 transition-colors ${
                        currentWorkspace?.id === workspace.id ? 'bg-slate-600' : ''
                      }`}
                    >
                      <div className="w-6 h-6 rounded bg-indigo-500/20 flex items-center justify-center">
                        <Building2 className="w-3 h-3 text-indigo-400" />
                      </div>
                      <span className="text-sm text-white truncate">{workspace.name}</span>
                    </button>
                  ))}
                </div>
                <div className="border-t border-slate-600">
                  <Link
                    href="/onboarding"
                    className="flex items-center gap-3 p-3 hover:bg-slate-600 transition-colors text-indigo-400"
                    onClick={() => setShowWorkspaceMenu(false)}
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm">Create Workspace</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const href = currentWorkspace ? `/${currentWorkspace.slug}${item.href}` : '#';
              const isActive = pathname === href || (item.href === '' && pathname === `/${currentWorkspace?.slug}`);
              
              return (
                <Link
                  key={item.name}
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? 'bg-indigo-500/20 text-indigo-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              );
            })}

            {/* Settings Section */}
            <div className="pt-4 mt-4 border-t border-slate-700/50">
              <p className="px-3 mb-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
                Settings
              </p>
              {settingsNavigation.map((item) => {
                const href = currentWorkspace ? `/${currentWorkspace.slug}${item.href}` : '#';
                // For General (/settings), only active if exactly matches
                // For others, active if pathname starts with the href
                const isActive = item.href === '/settings' 
                  ? pathname === href 
                  : pathname === href || pathname.startsWith(href + '/');
                
                return (
                  <Link
                    key={item.name}
                    href={href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                      isActive
                        ? 'bg-indigo-500/20 text-indigo-400'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* User Menu */}
          <div className="p-4 border-t border-slate-700/50">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-700/50 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-white truncate">
                  {session?.user?.name || 'User'}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {session?.user?.email || ''}
                </p>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform ${
                  showUserMenu ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* User Dropdown */}
            {showUserMenu && (
              <div className="absolute left-4 right-4 bottom-20 bg-slate-700 rounded-lg border border-slate-600 shadow-xl z-50 overflow-hidden">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 p-3 hover:bg-slate-600 transition-colors text-red-400"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 lg:hidden bg-slate-800/95 backdrop-blur-xl border-b border-slate-700/50">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <span className="font-semibold text-white">Signalstack</span>
            </div>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
