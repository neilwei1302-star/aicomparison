"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, Trash2, X, History } from "lucide-react";
import { cn } from "@/lib/utils";

interface HistoryItem {
  id: string;
  timestamp: number;
  prompt: string;
  responses: any; // We store the full response object
}

interface ChatHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectChat: (item: HistoryItem) => void;
  currentPrompt: string;
}

export function ChatHistorySidebar({
  isOpen,
  onClose,
  onSelectChat,
}: ChatHistorySidebarProps) {
  const [history, setHistory] = React.useState<HistoryItem[]>([]);

  // Load history from local storage when the component mounts
  React.useEffect(() => {
    const saved = localStorage.getItem("ai-comparison-history");
    if (saved) {
      try {
        setHistory(JSON.parse(saved).sort((a: any, b: any) => b.timestamp - a.timestamp));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, [isOpen]); // Reload whenever the sidebar opens

  const deleteItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Stop the click from triggering "Select Chat"
    const newHistory = history.filter((item) => item.id !== id);
    setHistory(newHistory);
    localStorage.setItem("ai-comparison-history", JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    if (confirm("Are you sure you want to delete all history?")) {
      setHistory([]);
      localStorage.removeItem("ai-comparison-history");
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Dark overlay background */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      {/* Sidebar Panel */}
      <div className="fixed left-0 top-0 bottom-0 w-80 bg-card border-r z-50 flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <History className="h-5 w-5" />
            History
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {history.length === 0 ? (
            <div className="text-center text-muted-foreground p-8 text-sm">
              No history yet. <br/> Start a comparison to save one!
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectChat(item);
                  onClose();
                }}
                className="group flex flex-col gap-1 p-3 rounded-lg hover:bg-muted cursor-pointer border border-transparent hover:border-border transition-all"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground font-medium">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => deleteItem(e, item.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-sm font-medium line-clamp-2 leading-tight">
                  {item.prompt}
                </p>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t bg-muted/20">
          <Button 
            variant="outline" 
            className="w-full text-destructive hover:text-destructive"
            onClick={clearHistory}
            disabled={history.length === 0}
          >
            Clear All History
          </Button>
        </div>
      </div>
    </>
  );
}