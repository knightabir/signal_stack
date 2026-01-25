'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  ChevronUp,
  MessageSquare,
  Circle,
  Clock,
  CheckCircle2,
  Sparkles,
  Sun,
  Moon,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export default function PublicRoadmap({ workspace }) {
  const [roadmap, setRoadmap] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState("planned");
  const [isDark, setIsDark] = useState(false);

  // Handle Theme
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  useEffect(() => {
    fetchRoadmap();
  }, [workspace.id]);

  const fetchRoadmap = async () => {
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/roadmap`);
      const data = await res.json();
      if (data.roadmap) {
        setRoadmap(data.roadmap);
      }
    } catch (error) {
      console.error('Failed to fetch roadmap:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statusConfig = {
    planned: {
      label: "Planned",
      icon: Circle,
      color: "text-amber-500 dark:text-amber-400",
      bg: "bg-amber-500/10 dark:bg-amber-500/20",
      borderColor: "border-amber-200 dark:border-amber-500/20",
      activeBorder: "border-amber-500 dark:border-amber-400",
    },
    "in_progress": { // API returns 'in_progress', widget uses 'in-progress'. Check data.
      label: "In Progress",
      icon: Clock,
      color: "text-blue-500 dark:text-blue-400",
      bg: "bg-blue-500/10 dark:bg-blue-500/20",
      borderColor: "border-blue-200 dark:border-blue-500/20",
      activeBorder: "border-blue-500 dark:border-blue-400",
    },
    shipped: { // API returns 'shipped'
      label: "Completed",
      icon: CheckCircle2,
      color: "text-emerald-500 dark:text-emerald-400",
      bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
      borderColor: "border-emerald-200 dark:border-emerald-500/20",
      activeBorder: "border-emerald-500 dark:border-emerald-400",
    },
  };

  // Safe access
  const roadmapItems = roadmap ? {
    planned: roadmap.planned || [],
    "in_progress": roadmap.in_progress || [],
    shipped: roadmap.shipped || [],
  } : { planned: [], in_progress: [], shipped: [] };

  const currentItems = roadmapItems[activeStatus] || [];
  const currentConfig = statusConfig[activeStatus];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300 font-sans text-zinc-900 dark:text-zinc-50 selection:bg-indigo-500/30">
      
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
        <div className="w-full max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {workspace.logo ? (
                 <img src={workspace.logo} alt={workspace.name} className="w-10 h-10 rounded-xl" />
              ) : (
                <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/20">
                  {workspace.name.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="font-bold text-lg leading-tight tracking-tight text-zinc-900 dark:text-zinc-50">{workspace.name}</h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Public Roadmap</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
               <button 
                  onClick={toggleTheme}
                  className="p-2 rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
               </button>
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-[1600px] mx-auto px-6 py-8 pb-32">
        
        {/* Navigation Tabs */}
        <div className="flex justify-center mb-12">
           <div className="inline-flex p-1 bg-zinc-100 dark:bg-zinc-900 rounded-full">
              <Link href={`/p/${workspace.slug}`} className="px-5 py-2 rounded-full text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">
                Feedback
              </Link>
              <Link href={`/p/${workspace.slug}/roadmap`} className="px-5 py-2 rounded-full bg-white dark:bg-zinc-800 shadow-sm text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Roadmap
              </Link>
               <Link href={`/p/${workspace.slug}/changelog`} className="px-5 py-2 rounded-full text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">
                Changelog
              </Link>
           </div>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto mb-12">
          {Object.entries(roadmapItems).map(([status, items]) => {
            const config = statusConfig[status];
            const Icon = config.icon;
            const isActive = activeStatus === status;
            
            return (
              <button
                key={status}
                onClick={() => setActiveStatus(status)}
                className={cn(
                  "flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-300 relative border",
                  isActive 
                    ? `bg-white dark:bg-zinc-900 ${config.activeBorder} shadow-lg shadow-zinc-200/50 dark:shadow-zinc-950/50` 
                    : "bg-zinc-50 dark:bg-zinc-900/30 border-transparent hover:bg-white dark:hover:bg-zinc-800/50 hover:border-zinc-200 dark:hover:border-zinc-800"
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                   <div className={cn("p-1.5 rounded-lg", config.bg)}>
                     <Icon className={cn("w-4 h-4", config.color)} />
                   </div>
                   <span className={cn(
                     "text-sm font-bold uppercase tracking-wider",
                     isActive ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-500 dark:text-zinc-500"
                   )}>
                     {config.label}
                   </span>
                </div>
                <span className={cn(
                  "text-3xl font-bold leading-none tracking-tight",
                  isActive ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400 dark:text-zinc-600"
                )}>
                  {items.length}
                </span>
                {isActive && (
                   <div className={cn("absolute -bottom-px left-1/2 -translate-x-1/2 w-12 h-1 rounded-t-full bg-gradient-to-r from-transparent via-current to-transparent opacity-50", config.color)} />
                )}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="max-w-4xl mx-auto min-h-[400px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <p className="text-sm text-zinc-500">Loading roadmap...</p>
            </div>
          ) : currentItems.length > 0 ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex items-center gap-2 mb-4 px-1 opacity-60">
                   <div className={cn("h-px flex-1 bg-gradient-to-r from-transparent", currentConfig.bg.replace("bg-", "to-").split('/')[0])} />
                   <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      {currentConfig.label}
                   </span>
                   <div className={cn("h-px flex-1 bg-gradient-to-l from-transparent", currentConfig.bg.replace("bg-", "to-").split('/')[0])} />
               </div>

              {currentItems.map((item) => (
                <RoadmapCard 
                    key={item.id} 
                    item={item} 
                    workspaceSlug={workspace.slug} 
                    config={currentConfig}
                />
              ))}
            </div>
          ) : (
             <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-zinc-50/50 dark:bg-zinc-900/50">
                <div className="w-16 h-16 mx-auto bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4 text-zinc-400">
                    <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">No {currentConfig.label.toLowerCase()} items</h3>
                <p className="text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
                    Check back later for updates!
                </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function RoadmapCard({ item, workspaceSlug, config }) {
  return (
    <div className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 hover:border-indigo-500/30 dark:hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300 relative overflow-hidden">
      
       <div className={cn("absolute left-0 top-0 bottom-0 w-1.5 opacity-0 group-hover:opacity-100 transition-opacity", config.bg.replace('/10', '').replace('/20', ''))} />

      <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
        {item.title}
      </h3>
      
      {item.description && (
        <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-6 max-w-2xl">
            {item.description}
        </p>
      )}

      {item.feedback && (
        <div className="inline-flex">
          <Link
            href={`/p/${workspaceSlug}/feedback/${item.feedback.id}`}
            className="flex items-center gap-4 px-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-800 hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:shadow-sm transition-all group/link"
          >
            <div className="flex items-center gap-1.5 text-sm font-semibold text-zinc-500 dark:text-zinc-400 group-hover/link:text-indigo-600 dark:group-hover/link:text-indigo-400">
              <ChevronUp className="w-4 h-4 text-zinc-400 group-hover/link:text-indigo-500" />
              {item.feedback.voteCount}
            </div>
            
            <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700" />

            <div className="flex items-center gap-1.5 text-sm font-medium text-zinc-500 dark:text-zinc-400">
              <MessageSquare className="w-4 h-4 text-zinc-400" />
              {item.feedback.commentCount}
            </div>

            <div className="flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400 ml-2 opacity-50 group-hover/link:opacity-100 transition-opacity">
                Feedback
                <ArrowLeft className="w-3 h-3 rotate-180" />
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
