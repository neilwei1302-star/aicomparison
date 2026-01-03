"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ModelSelector } from "@/components/model-selector";
import { ModelResponseCard } from "@/components/model-response-card";
import { Send, Loader2, Paperclip, X } from "lucide-react";

const defaultModels = [
  "anthropic/claude-3.5-sonnet",
  "openai/gpt-4o",
  "google/gemini-flash-1.5",
  "meta-llama/llama-3.1-70b-instruct"
];
interface Model {
  id: string;
  name: string;
}

export default function Home() {
  const [prompt, setPrompt] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null); // New: File state
  const fileInputRef = React.useRef<HTMLInputElement>(null); // New: Ref for hidden input

  const [models, setModels] = React.useState<Model[]>([]);
  const [selectedModels, setSelectedModels] =
    React.useState<string[]>(defaultModels);
  const [responses, setResponses] = React.useState<
    Record<string, { text: string; isLoading: boolean; isComplete: boolean; error?: string }>
  >({});
  const [isLoading, setIsLoading] = React.useState(false);
  const [isLoadingModels, setIsLoadingModels] = React.useState(true);

  // Fetch available models
  React.useEffect(() => {
    async function fetchModels() {
      try {
        const response = await fetch("/api/models");
        const data = await response.json();
        if (data.data && Array.isArray(data.data)) {
          const modelList = data.data.map((model: any) => ({
            id: model.id,
            name: model.name || model.id,
          }));
          
          // Ensure default models are included even if not in API response
          const defaultModelEntries = defaultModels.map((id) => ({
            id,
            name: modelList.find((m: Model) => m.id === id)?.name || id,
          }));
          
          // Merge and deduplicate
          const allModels = [
            ...defaultModelEntries,
            ...modelList.filter((m: Model) => !defaultModels.includes(m.id)),
          ];
          
          setModels(allModels);
        }
      } catch (error) {
        console.error("Failed to fetch models:", error);
        // Fallback: use default models with their IDs as names
        setModels(
          defaultModels.map((id) => ({
            id,
            name: id,
          }))
        );
      } finally {
        setIsLoadingModels(false);
      }
    }
    fetchModels();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || selectedModels.length === 0) return;

    setIsLoading(true);
    
    // Initialize responses
    const initialResponses: Record<
      string,
      { text: string; isLoading: boolean; isComplete: boolean; error?: string }
    > = {};
    selectedModels.forEach((modelId) => {
      initialResponses[modelId] = {
        text: "",
        isLoading: true,
        isComplete: false,
      };
    });
    setResponses(initialResponses);

    try {
      // Process file if exists (Convert to Base64)
      let attachmentData = null;
      if (file) {
        const reader = new FileReader();
        attachmentData = await new Promise((resolve) => {
          reader.onload = (e) => resolve(e.target?.result);
          reader.readAsDataURL(file);
        });
      }

      const response = await fetch("/api/compare", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          models: selectedModels,
          attachment: attachmentData, // New: Sending the file data
          fileName: file?.name // New: Sending the filename
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === "update" && data.updates) {
                setResponses((prev) => {
                  const updated = { ...prev };
                  Object.entries(data.updates).forEach(([modelId, text]) => {
                    if (updated[modelId]) {
                      updated[modelId] = {
                        ...updated[modelId],
                        text: text as string,
                      };
                    }
                  });
                  return updated;
                });
              } else if (data.type === "error") {
                setResponses((prev) => {
                  const updated = { ...prev };
                  if (data.model && updated[data.model]) {
                    updated[data.model] = {
                      ...updated[data.model],
                      isLoading: false,
                      isComplete: true,
                      error: data.error || "An error occurred",
                    };
                  } else if (data.error && !data.model) {
                    // Global error - mark all as failed
                    Object.keys(updated).forEach((modelId) => {
                      updated[modelId] = {
                        ...updated[modelId],
                        isLoading: false,
                        isComplete: true,
                        error: data.error,
                      };
                    });
                  }
                  return updated;
                });
                setIsLoading(false);
              } else if (data.type === "complete") {
                setResponses((prev) => {
                  const updated = { ...prev };
                  data.models.forEach((modelId: string) => {
                    if (updated[modelId]) {
                      updated[modelId] = {
                        ...updated[modelId],
                        isLoading: false,
                        isComplete: true,
                      };
                    }
                  });
                  return updated;
                });
                setIsLoading(false);
              }
            } catch (e) {
              // Ignore JSON parse errors for incomplete chunks
            }
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setIsLoading(false);
      setResponses((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((modelId) => {
          updated[modelId] = {
            ...updated[modelId],
            isLoading: false,
            isComplete: true,
          };
        });
        return updated;
      });
    }
  };

  const getModelName = (modelId: string) => {
    const model = models.find((m) => m.id === modelId);
    return model?.name || modelId;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            AI Model Comparison
          </h1>
          <p className="text-muted-foreground">
            Compare responses from multiple AI models in real-time
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mb-8">
          <div className="space-y-2">
            <label htmlFor="prompt" className="text-sm font-medium">
              Your Prompt
            </label>
            <Textarea
              id="prompt"
              placeholder="Enter your prompt here..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[120px] resize-none"
              disabled={isLoading}
            />
            
            {/* New: File Upload Section */}
            <div className="flex items-center gap-2 mt-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,.pdf,.txt,.doc,.docx"
              />
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="text-xs"
              >
                <Paperclip className="mr-2 h-3.5 w-3.5" />
                {file ? "Change File" : "Attach Image/Doc"}
              </Button>

              {file && (
                <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-xs">
                  <span className="truncate max-w-[150px]">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="ml-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="models" className="text-sm font-medium">
              Select Models
            </label>
            <ModelSelector
              models={models}
              selectedModels={selectedModels}
              onSelectionChange={setSelectedModels}
              isLoading={isLoadingModels}
            />
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={isLoading || !prompt.trim() || selectedModels.length === 0}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Comparing...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send
              </>
            )}
          </Button>
        </form>

        {selectedModels.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {selectedModels.map((modelId) => (
              <ModelResponseCard
                key={modelId}
                modelName={getModelName(modelId)}
                response={responses[modelId]?.text || ""}
                isLoading={responses[modelId]?.isLoading || false}
                isComplete={responses[modelId]?.isComplete || false}
                error={responses[modelId]?.error}
              />
            ))}
          </div>
        )}

        {selectedModels.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Select at least one model to compare
          </div>
        )}
      </div>
    </main>
  );
}