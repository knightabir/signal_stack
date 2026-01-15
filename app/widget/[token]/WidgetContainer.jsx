"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeedbackTab } from "@/components/widget/feedback-tab";
import { RoadmapTab } from "@/components/widget/roadmap-tab";
import { ChangelogTab } from "@/components/widget/changelog-tab";
import {
  MessageSquare,
  Map,
  Bell,
  Loader2,
  AlertTriangle,
  X,
} from "lucide-react";

export default function WidgetContainer({ token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/widget/${token}`,
          {
            cache: "no-store",
          }
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
      <div className="h-screen w-full flex items-center justify-center bg-white text-black font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white text-black p-6 text-center font-sans">
        <AlertTriangle className="w-10 h-10 text-amber-500 mb-4" />
        <h3 className="font-bold text-lg text-black">Widget Unavailable</h3>
        <p className="text-sm text-slate-700 mt-2">
          {error || "Could not load widget data."}
        </p>
      </div>
    );
  }

  const { workspace } = data;

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden text-black bg-white font-sans">
      {/* Header */}
      <div className="shrink-0 p-4 border-b border-slate-200 flex items-center justify-between bg-white z-20">
        <h1 className="font-bold text-lg tracking-tight text-black">
          {workspace.name}
        </h1>
        <button
          onClick={handleClose}
          className="p-1 hover:bg-slate-100 rounded-md transition-colors text-slate-700 hover:text-black"
          aria-label="Close widget"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Tabs */}
      <Tabs
        defaultValue="feedback"
        className="flex-1 flex flex-col overflow-hidden"
      >
        <TabsList className="w-full justify-start text-black rounded-none">
          <TabsTrigger value="feedback" className="text-black">
            <MessageSquare className="w-4 h-4 mr-2" />
            Feedback
          </TabsTrigger>
          <TabsTrigger value="roadmap" className="text-black">
            <Map className="w-4 h-4 mr-2" />
            Roadmap
          </TabsTrigger>
          <TabsTrigger value="updates" className="text-black">
            <Bell className="w-4 h-4 mr-2" />
            Updates
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden p-2">
          <TabsContent
            value="feedback"
            className="h-full m-0 data-[state=active]:flex flex-col"
          >
            <FeedbackTab data={data} token={token} />
          </TabsContent>

          <TabsContent
            value="roadmap"
            className="h-full m-0 data-[state=active]:flex flex-col"
          >
            <RoadmapTab data={data} />
          </TabsContent>

          <TabsContent
            value="updates"
            className="h-full m-0 data-[state=active]:flex flex-col"
          >
            <ChangelogTab data={data} />
          </TabsContent>
        </div>
      </Tabs>

      {/* Footer */}
      <div className="shrink-0 py-3 text-center border-t border-slate-200 bg-white">
        <a
          href="https://signalstack.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          Powered by Signalstack
        </a>
      </div>
    </div>
  );
}
