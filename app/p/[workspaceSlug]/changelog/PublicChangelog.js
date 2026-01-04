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
} from 'lucide-react';

export default function PublicChangelog({ workspace }) {
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-800/95 backdrop-blur-xl border-b border-slate-700/50">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/p/${workspace.slug}`} className="text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">{workspace.name} Changelog</h1>
              <p className="text-sm text-slate-400">Product updates and announcements</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-20">
            <Megaphone className="w-12 h-12 mx-auto text-slate-600 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No announcements yet</h3>
            <p className="text-slate-400">Check back later for updates!</p>
          </div>
        ) : (
          <div className="space-y-8">
            {announcements.map((announcement, index) => (
              <article
                key={announcement.id}
                className="relative pl-8 pb-8 border-l-2 border-slate-700 last:pb-0"
              >
                {/* Timeline dot */}
                <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600" />

                {/* Date */}
                <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
                  <Calendar className="w-4 h-4" />
                  <time dateTime={announcement.publishedAt}>
                    {formatDate(announcement.publishedAt || announcement.createdAt)}
                  </time>
                </div>

                {/* Content */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                  <h2 className="text-xl font-bold text-white mb-4">{announcement.title}</h2>
                  
                  {announcement.content && (
                    <div 
                      className="prose prose-invert prose-slate max-w-none mb-4"
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
                    <div className="mt-4 pt-4 border-t border-slate-700/50">
                      <p className="text-sm text-slate-400 mb-2">Related items:</p>
                      <div className="flex flex-wrap gap-2">
                        {announcement.linkedFeedback?.map((f) => (
                          <Link
                            key={f.id}
                            href={`/p/${workspace.slug}/feedback/${f.id}`}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 rounded-full text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                          >
                            <ChevronUp className="w-3 h-3" />
                            <span>{f.title}</span>
                            <span className="text-slate-500">{f.voteCount}</span>
                          </Link>
                        ))}
                        {announcement.linkedRoadmap?.map((r) => (
                          <Link
                            key={r.id}
                            href={`/p/${workspace.slug}/roadmap`}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/20 rounded-full text-sm text-green-400 hover:bg-green-500/30 transition-colors"
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
