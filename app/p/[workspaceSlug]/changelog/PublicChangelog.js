'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  Calendar,
  ChevronUp,
  MessageSquare,
  Megaphone,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PublicChangelog({ workspace }) {
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
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
    fetchAnnouncements();
  }, [workspace.id]);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/changelog`);
      const data = await res.json();
      if (data.announcements) {
        setAnnouncements(data.announcements);
      }
    } catch (error) {
      console.error('Failed to fetch changelog:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

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
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Public Changelog</p>
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
              <Link href={`/p/${workspace.slug}/roadmap`} className="px-5 py-2 rounded-full text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">
                Roadmap
              </Link>
               <Link href={`/p/${workspace.slug}/changelog`} className="px-5 py-2 rounded-full bg-white dark:bg-zinc-800 shadow-sm text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Changelog
              </Link>
           </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
             <p className="text-sm text-zinc-500">Loading updates...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-zinc-50/50 dark:bg-zinc-900/50 max-w-3xl mx-auto">
            <div className="w-16 h-16 mx-auto bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4 text-zinc-400">
                <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">No announcements yet</h3>
            <p className="text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
                Product updates will live here.
            </p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-12">
            {announcements.map((announcement, index) => (
              <article
                key={announcement.id}
                className="relative pl-12 sm:pl-0 sm:grid sm:grid-cols-[1fr_3px_3fr] gap-8"
              >
                {/* Mobile Line */}
                 <div className="absolute left-[7px] top-3 bottom-0 w-[2px] bg-zinc-200 dark:bg-zinc-800 sm:hidden" />

                {/* Left Side: Date */}
                <div className="hidden sm:block text-right pt-2 relative">
                   <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {new Date(announcement.publishedAt || announcement.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric'})}
                   </div>
                   <div className="text-xs text-zinc-500 dark:text-zinc-500 font-medium mt-1">
                      {new Date(announcement.publishedAt || announcement.createdAt).toLocaleDateString('en-US', { year: 'numeric'})}
                   </div>
                </div>

                {/* Timeline Line & Dot */}
                <div className="relative hidden sm:flex justify-center">
                    <div className="h-full w-[2px] bg-zinc-200 dark:bg-zinc-800 relative"></div>
                    <div className="absolute top-2.5 w-4 h-4 rounded-full border-[3px] border-white dark:border-zinc-950 bg-indigo-500 shadow-sm z-10" />
                </div>

                {/* Mobile Dot */}
                <div className="absolute left-0 top-2.5 w-4 h-4 rounded-full border-[3px] border-zinc-50 dark:border-zinc-950 bg-indigo-500 shadow-sm z-10 sm:hidden" />


                {/* Content */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300">
                   
                   {/* Mobile Date */}
                   <div className="sm:hidden flex items-center gap-2 text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-3 uppercase tracking-wider">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(announcement.publishedAt || announcement.createdAt)}
                   </div>

                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6 leading-tight">
                      {announcement.title}
                  </h2>
                  
                  {announcement.content && (
                    <div 
                      className="prose prose-zinc dark:prose-invert max-w-none prose-p:leading-relaxed prose-a:text-indigo-600 dark:prose-a:text-indigo-400"
                      dangerouslySetInnerHTML={{ 
                        __html: announcement.content
                          .replace(/\n/g, '<br>')
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.*?)\*/g, '<em>$1</em>')
                          .replace(/`(.*?)`/g, '<code>$1</code>')
                      }}
                    />
                  )}

                  {/* Linked Items */}
                  {(announcement.linkedFeedback?.length > 0 || announcement.linkedRoadmap?.length > 0) && (
                    <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                      <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-3">Included in this update</p>
                      <div className="flex flex-wrap gap-2">
                        {announcement.linkedFeedback?.map((f) => (
                          <Link
                            key={f.id}
                            href={`/p/${workspace.slug}/feedback/${f.id}`}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
                          >
                            <ChevronUp className="w-3 h-3" />
                            <span>{f.title}</span>
                          </Link>
                        ))}
                        {announcement.linkedRoadmap?.map((r) => (
                          <Link
                            key={r.id}
                            href={`/p/${workspace.slug}/roadmap`}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg text-xs font-medium text-green-700 dark:text-green-400 hover:bg-green-500/20 transition-all"
                          >
                            <span>{r.title}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
