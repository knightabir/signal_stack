"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeedbackTab } from "@/components/widget/feedback-tab";
import { RoadmapTab } from "@/components/widget/roadmap-tab";
import { ChangelogTab } from "@/components/widget/changelog-tab";
import {
  MessageSquare,
  Map as MapIcon,
  Bell,
  Loader2,
  AlertTriangle,
  X,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function WidgetContainer({ token }) {
  const searchParams = useSearchParams();
  const themeParam = searchParams.get("theme");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("feedback");
  const [isDark, setIsDark] = useState(false);

  // Handle Theme
  useEffect(() => {
    const checkTheme = () => {
      if (themeParam === "dark") return true;
      if (themeParam === "light") return false;
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    };

    const darkMode = checkTheme();
    setIsDark(darkMode);
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [themeParam]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/widget/${token}`,
          { cache: "no-store" },
        );
        if (!res.ok) throw new Error("Failed to load widget data");
        const json = await res.json();
        if (json.error) throw new Error(json.error);
        setData(json);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [token]);

  const handleClose = () => {
    window.parent.postMessage({ type: "signalstack-close" }, "*");
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6 text-center transition-colors duration-300">
        <div className="w-16 h-16 bg-red-500/10 dark:bg-red-500/20 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-red-500/20">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="font-bold text-xl text-zinc-900 dark:text-zinc-50 mb-2">
          Widget Unavailable
        </h3>
        <p className="text-zinc-500 dark:text-zinc-400 max-w-[280px]">
          {error || "Could not load widget data."}
        </p>
      </div>
    );
  }

  const { workspace } = data;
  const primaryColor = workspace.settings.primaryColor || "#6366f1";

  // Navigation Items
  const navItems = [
    { id: "feedback", label: "Feedback", icon: MessageSquare },
    { id: "roadmap", label: "Roadmap", icon: MapIcon },
    { id: "updates", label: "Updates", icon: Bell },
  ];

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans selection:bg-indigo-500/30">
      {/* Floating Header */}
      <div className="shrink-0 px-6 pt-6 pb-2 z-20">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-indigo-500 fill-indigo-500/20" />
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
                Feedback
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              {workspace.name}
            </h1>
          </div>
          <button
            onClick={handleClose}
            className="group p-2 rounded-full bg-zinc-200/50 dark:bg-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-all duration-200"
            aria-label="Close widget"
          >
            <X className="w-5 h-5 transition-transform group-hover:rotate-90" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <div className="flex-1 overflow-hidden relative">
          {/* Subtle gradient background for depth */}
          <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-zinc-50 dark:from-zinc-950 to-transparent z-10 pointer-events-none" />

          <div className="h-full px-6 pb-24 overflow-y-auto custom-scrollbar">
            <TabsContent value="feedback" className="mt-0 h-full">
              <FeedbackTab data={data} token={token} isDark={isDark} />
            </TabsContent>
            <TabsContent value="roadmap" className="mt-0 h-full">
              <RoadmapTab data={data} isDark={isDark} />
            </TabsContent>
            <TabsContent value="updates" className="mt-0 h-full">
              <ChangelogTab data={data} isDark={isDark} />
            </TabsContent>
          </div>

          {/* Bottom Fade */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-zinc-50 via-zinc-50/90 to-transparent dark:from-zinc-950 dark:via-zinc-950/90 pointer-events-none z-10" />
        </div>

        {/* Floating Bottom Navigation */}
        <div className="absolute bottom-6 left-6 right-6 z-30">
          <TabsList className="w-full h-14 p-1.5 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 rounded-full shadow-2xl shadow-zinc-950/10 dark:shadow-black/40">
            {navItems.map((item) => (
              <TabsTrigger
                key={item.id}
                value={item.id}
                className="flex-1 h-full rounded-full data-[state=active]:bg-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-500/25 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-all duration-300"
              >
                <div className="flex flex-col items-center gap-0.5">
                  <item.icon className="w-5 h-5" />
                </div>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Branding Footer */}
          <div className="text-center mt-3">
            <a
              href="https://signalstack.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-semibold text-zinc-400 hover:text-indigo-500 dark:text-zinc-600 dark:hover:text-indigo-400 transition-colors"
            >
              <span>Powered by Signalstack</span>
            </a>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
