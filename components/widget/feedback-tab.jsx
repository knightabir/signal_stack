"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ChevronUp,
  Loader2,
  MessageSquare,
  ThumbsUp,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export function FeedbackTab({ data, token }) {
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
      })
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
      <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-300">
        <div className="flex items-center gap-2 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCreating(false)}
            className="hover:bg-slate-100 dark:hover:bg-slate-800 -ml-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h3 className="font-semibold">Submit Feedback</h3>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 flex-1 overflow-y-auto pr-1"
        >
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="What's your feedback?"
              required
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Tell us a little more..."
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email (optional)</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="you@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name (optional)</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Your name"
              />
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Submit Feedback
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between shrink-0">
        <h3 className="font-medium text-slate-500 text-sm">
          {feedbackList.length} Posts
        </h3>
        <Button
          size="sm"
          onClick={() => setIsCreating(true)}
          className="text-white shadow-sm"
        >
          + Create New
        </Button>
      </div>

      <ScrollArea className="flex-1 -mx-4 px-4">
        <div className="space-y-3 pb-4">
          {feedbackList.map((item) => (
            <Card key={item.id} className="group border-slate-200">
              <CardContent className="p-4 flex gap-3">
                <button
                  className={cn(
                    "h-12 w-10 shrink-0 flex flex-col items-center justify-center gap-0.5 rounded-lg border transition-all duration-200",
                    "hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0",
                    item.hasVoted
                      ? "border-indigo-600 bg-indigo-600 text-white shadow-indigo-200 dark:shadow-none"
                      : "border-slate-200 bg-white dark:bg-slate-950 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-indigo-400 hover:text-indigo-600 dark:hover:border-indigo-500 dark:hover:text-indigo-400"
                  )}
                  onClick={() => handleVote(item.id)}
                  disabled={item.hasVoted && false}
                >
                  <ChevronUp
                    className={cn(
                      "h-3 w-3 stroke-[3px]",
                      item.hasVoted ? "text-white" : "text-current"
                    )}
                  />
                  <span className="text-[12px] font-bold leading-none font-sans">
                    {item.voteCount}
                  </span>
                </button>

                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-[15px] text-slate-900 dark:text-slate-100 leading-snug mb-1 font-sans">
                    {item.title}
                  </h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-sans mb-2">
                    {item.description}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide",
                        item.status === "planned"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          : item.status === "in-progress"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : item.status === "done"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      )}
                    >
                      {item.status.replace("-", " ")}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                      {formatDistanceToNow(new Date(item.createdAt))} ago
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {feedbackList.length === 0 && (
            <div className="text-center py-10 text-slate-400">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p>No feedback yet. Be the first!</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
