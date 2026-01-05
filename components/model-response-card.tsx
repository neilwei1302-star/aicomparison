"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";

import "katex/dist/katex.min.css";

interface ModelResponseCardProps {
  modelName: string;
  response: string;
  isLoading: boolean;
  isComplete: boolean;
  error?: string;
  onReply?: () => void;
}

export function ModelResponseCard({
  modelName,
  response,
  isLoading,
  isComplete,
  error,
  onReply,
}: ModelResponseCardProps) {
  
  const formatMath = (text: string) => {
    return text
      .replace(/\\\[/g, '$$$$') 
      .replace(/\\\]/g, '$$$$') 
      .replace(/\\\(/g, '$$')   
      .replace(/\\\)/g, '$$');  
  };

  return (
    <Card className="h-full flex flex-col group">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3 px-4">
        <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{modelName}</CardTitle>
        
        {/* REPLY BUTTON: Only shows when response is done */}
        {isComplete && !error && onReply && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" 
            onClick={onReply}
            title={`Reply to ${modelName}`}
          >
            <MessageSquarePlus className="h-4 w-4 text-primary" />
          </Button>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 overflow-auto p-4 pt-0">
        {error ? (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
            <p className="text-sm font-medium text-destructive mb-2">Error</p>
            <p className="text-sm text-destructive/80">{error}</p>
          </div>
        ) : isLoading && !response ? (
          <div className="space-y-2 pt-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {response ? (
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  p: ({ children }) => (
                    <p className="mb-4 last:mb-0 leading-relaxed">{children}</p>
                  ),
                  code: ({ children, className }) => {
                    const isInline = !className;
                    return isInline ? (
                      <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground">
                        {children}
                      </code>
                    ) : (
                      <code className="block bg-muted p-4 rounded-lg overflow-x-auto text-xs sm:text-sm my-4 border">
                        {children}
                      </code>
                    );
                  },
                  pre: ({ children }) => (
                    <pre className="bg-muted/50 p-0 rounded-lg overflow-hidden mb-4 border">
                      {children}
                    </pre>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-outside ml-4 mb-4 space-y-1">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-outside ml-4 mb-4 space-y-1">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => <li className="pl-1">{children}</li>,
                  h1: ({ children }) => (
                    <h1 className="text-2xl font-bold mb-4 mt-6 first:mt-0">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-xl font-bold mb-3 mt-5 first:mt-0">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-lg font-semibold mb-2 mt-4 first:mt-0">
                      {children}
                    </h3>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-primary/20 pl-4 italic my-4 text-muted-foreground">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {formatMath(response)}
              </ReactMarkdown>
            ) : (
              <p className="text-muted-foreground italic">Waiting for response...</p>
            )}
            {isLoading && response && (
              <div className="flex items-center gap-2 mt-4 text-muted-foreground animate-pulse">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="text-xs uppercase tracking-wider font-medium">Generating...</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}