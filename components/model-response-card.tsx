"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

interface ModelResponseCardProps {
  modelName: string;
  response: string;
  isLoading: boolean;
  isComplete: boolean;
  error?: string;
}

export function ModelResponseCard({
  modelName,
  response,
  isLoading,
  isComplete,
  error,
}: ModelResponseCardProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{modelName}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        {error ? (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
            <p className="text-sm font-medium text-destructive mb-2">Error</p>
            <p className="text-sm text-destructive/80">{error}</p>
          </div>
        ) : isLoading && !response ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {response ? (
              <ReactMarkdown
                components={{
                  p: ({ children }) => (
                    <p className="mb-4 last:mb-0">{children}</p>
                  ),
                  code: ({ children, className }) => {
                    const isInline = !className;
                    return isInline ? (
                      <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
                        {children}
                      </code>
                    ) : (
                      <code className="block bg-muted p-4 rounded-lg overflow-x-auto">
                        {children}
                      </code>
                    );
                  },
                  pre: ({ children }) => (
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4">
                      {children}
                    </pre>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside mb-4 space-y-1">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside mb-4 space-y-1">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => <li className="ml-4">{children}</li>,
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
                    <blockquote className="border-l-4 border-muted-foreground/50 pl-4 italic my-4">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {response}
              </ReactMarkdown>
            ) : (
              <p className="text-muted-foreground">Waiting for response...</p>
            )}
            {isLoading && response && (
              <div className="flex items-center gap-2 mt-4 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Streaming...</span>
              </div>
            )}
            {isComplete && response && (
              <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                Response complete
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

