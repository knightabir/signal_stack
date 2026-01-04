'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  ChevronUp,
  MessageSquare,
  CircleDot,
  PlayCircle,
  CheckCircle2,
} from 'lucide-react';

const STAGES = [
  { key: 'planned', label: 'Planned', icon: CircleDot, color: 'text-purple-400', bgColor: 'bg-purple-500/20', borderColor: 'border-purple-500/50' },
  { key: 'in_progress', label: 'In Progress', icon: PlayCircle, color: 'text-orange-400', bgColor: 'bg-orange-500/20', borderColor: 'border-orange-500/50' },
  { key: 'shipped', label: 'Shipped', icon: CheckCircle2, color: 'text-green-400', bgColor: 'bg-green-500/20', borderColor: 'border-green-500/50' },
];

export default function PublicRoadmap({ workspace }) {
  const [roadmap, setRoadmap] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-800/95 backdrop-blur-xl border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/p/${workspace.slug}`} className="text-slate-400 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white">{workspace.name} Roadmap</h1>
                <p className="text-sm text-slate-400">See what's coming next</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Roadmap Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STAGES.map((stage) => (
              <div key={stage.key} className="space-y-4">
                {/* Column Header */}
                <div className={`flex items-center gap-2 p-3 rounded-lg ${stage.bgColor} border ${stage.borderColor}`}>
                  <stage.icon className={`w-5 h-5 ${stage.color}`} />
                  <h2 className={`font-semibold ${stage.color}`}>{stage.label}</h2>
                  <span className="ml-auto text-sm text-slate-400">
                    {roadmap?.[stage.key]?.length || 0}
                  </span>
                </div>

                {/* Items */}
                <div className="space-y-3">
                  {roadmap?.[stage.key]?.length === 0 ? (
                    <p className="text-center text-slate-500 py-8 text-sm">
                      No items yet
                    </p>
                  ) : (
                    roadmap?.[stage.key]?.map((item) => (
                      <RoadmapCard key={item.id} item={item} workspaceSlug={workspace.slug} />
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function RoadmapCard({ item, workspaceSlug }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600 transition-colors">
      <h3 className="font-medium text-white">{item.title}</h3>
      
      {item.description && (
        <p className="text-sm text-slate-400 mt-1 line-clamp-2">{item.description}</p>
      )}

      {item.feedback && (
        <div className="mt-3 pt-3 border-t border-slate-700/50">
          <Link
            href={`/p/${workspaceSlug}/feedback/${item.feedback.id}`}
            className="flex items-center gap-4 text-sm text-slate-400 hover:text-indigo-400 transition-colors"
          >
            <span className="flex items-center gap-1">
              <ChevronUp className="w-4 h-4" />
              {item.feedback.voteCount}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              {item.feedback.commentCount}
            </span>
            <span className="text-indigo-400 ml-auto">View feedback →</span>
          </Link>
        </div>
      )}
    </div>
  );
}
