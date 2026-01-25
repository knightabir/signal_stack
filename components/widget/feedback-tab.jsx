"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  ChevronUp,
  Loader2,
  MessageSquare,
  Send,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export function FeedbackTab({ data, token, isDark }) {
  const [feedbackList, setFeedbackList] = useState(data.feedback || []);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    email: "",
    name: "",
  });

  const handleVote = async (id) => {
    // Optimistic update
    setFeedbackList((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newVotedState = !item.hasVoted;
          return {
            ...item,
            voteCount: item.voteCount + (newVotedState ? 1 : -1),
            hasVoted: newVotedState,
          };
        }
        return item;
      }),
    );

    try {
      await fetch(`/api/widget/${token}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedbackId: id }),
      });
    } catch (error) {
      console.error("Failed to vote", error);
      // Revert on error would go here
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/widget/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          authorEmail: formData.email,
          authorName: formData.name,
        }),
      });

      if (res.ok) {
        const { feedback } = await res.json();
        setFeedbackList([
          {
            ...feedback,
            voteCount: 0,
            commentCount: 0,
            createdAt: new Date().toISOString(),
            status: "new",
            author: formData.name || "Anonymous",
          },
          ...feedbackList,
        ]);
        setIsCreating(false);
        setFormData({ title: "", description: "", email: "", name: "" });
      }
    } catch (error) {
      console.error("Failed to submit:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCreating) {
    return (
      <div className="flex flex-col h-full animate-in slide-in-from-right-8 duration-300">
        <div className="flex items-center gap-2 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCreating(false)}
            className="group -ml-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800"
          >
            <ArrowLeft className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-1" />
            Back
          </Button>
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            Suggestion
          </span>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="title"
                className="text-zinc-700 dark:text-zinc-300"
              >
                Title
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Briefly describe your idea..."
                required
                className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/20"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-zinc-700 dark:text-zinc-300"
              >
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="How would this help you? What problem does it solve?"
                rows={4}
                className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 resize-none focus:ring-indigo-500/20 dark:focus:ring-indigo-500/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-zinc-700 dark:text-zinc-300"
                >
                  Email{" "}
                  <span className="text-zinc-400 font-normal">(optional)</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="you@company.com"
                  className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="text-zinc-700 dark:text-zinc-300"
                >
                  Name{" "}
                  <span className="text-zinc-400 font-normal">(optional)</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Your name"
                  className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/20"
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Submit Feedback
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between shrink-0 mb-2">
        <h3 className="font-semibold text-sm text-zinc-500 dark:text-zinc-400 tracking-wide uppercase">
          Latest Posts
        </h3>
        <Button
          size="sm"
          onClick={() => setIsCreating(true)}
          className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white shadow-md shadow-indigo-500/25 rounded-full px-4"
        >
          + Suggest Feature
        </Button>
      </div>

      <div className="space-y-4 pb-4">
        {feedbackList.map((item) => (
          <Card
            key={item.id}
            className="group border-0 bg-white dark:bg-zinc-900 shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 hover:ring-indigo-500/30 dark:hover:ring-indigo-400/30 transition-all duration-300 hover:shadow-md"
          >
            <CardContent className="p-4 flex gap-4">
              <button
                className={cn(
                  "h-14 w-11 shrink-0 flex flex-col items-center justify-center gap-0.5 rounded-xl border transition-all duration-300",
                  "hover:-translate-y-0.5 active:translate-y-0",
                  item.hasVoted
                    ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 dark:bg-indigo-500/20 shadow-inner"
                    : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-400 dark:text-zinc-500 hover:border-indigo-500/30 hover:text-indigo-500",
                )}
                onClick={() => handleVote(item.id)}
                disabled={item.hasVoted && false}
              >
                <ChevronUp
                  className={cn(
                    "w-5 h-5 transition-colors",
                    item.hasVoted ? "stroke-[3px]" : "stroke-[2px]",
                  )}
                />
                <span className="text-xs font-bold leading-none">
                  {item.voteCount}
                </span>
              </button>

              <div className="flex-1 min-w-0 pt-0.5">
                <h4 className="font-bold text-[15px] leading-snug mb-1 text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {item.title}
                </h4>
                <p className="text-sm line-clamp-2 leading-relaxed text-zinc-600 dark:text-zinc-400 mb-3">
                  {item.description}
                </p>
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border",
                      item.status === "planned"
                        ? "bg-amber-100 dark:bg-amber-500/10 text-amber-900 dark:text-amber-400 border-amber-200 dark:border-amber-500/20"
                        : item.status === "in-progress"
                          ? "bg-blue-100 dark:bg-blue-500/10 text-blue-900 dark:text-blue-400 border-blue-200 dark:border-blue-500/20"
                          : item.status === "done"
                            ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-900 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
                    )}
                  >
                    {item.status.replace("-", " ")}
                  </span>
                  <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-600">
                    {formatDistanceToNow(new Date(item.createdAt))} ago
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {feedbackList.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/50">
            <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-3">
              <MessageSquare className="w-6 h-6 text-zinc-400 dark:text-zinc-500" />
            </div>
            <p className="text-zinc-900 dark:text-zinc-100 font-medium">
              No feedback yet
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 mb-4">
              Be the first to share your ideas!
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreating(true)}
              className="border-zinc-200 dark:border-zinc-700"
            >
              Submit Feedback
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
