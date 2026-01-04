"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ModelSelector } from "@/components/model-selector";
import { ModelResponseCard } from "@/components/model-response-card";
import { ChatHistorySidebar } from "@/components/chat-history-sidebar"; // Import the new sidebar
import { Send, Loader2, Paperclip, X, History as HistoryIcon } from "lucide-react";

const defaultModels = [
  "openai/gpt-5.2",
  "google/gemini-3-flash-preview",
  "anthropic/claude-3.5-sonnet",
  "meta-llama/llama-3.3-70b-instruct"
];

interface Model {
  id: string;
  name: string;
}

export default function Home() {
  const [prompt, setPrompt] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null); 
  const fileInputRef = React.useRef<HTMLInputElement>(null); 
  
  // History State
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false);

  const [models, setModels] = React.useState<Model[]>([]);
  const [selectedModels, setSelectedModels] = React.useState<string[]>(defaultModels);
  
  const [responses, setResponses] = React.useState<
    Record<string, { text: string; isLoading: boolean; isComplete: boolean; error?: string }>
  >({});

  const [isLoading, setIsLoading] = React.useState(false);

  // --- AUTO-SAVE LOGIC ---
  // This effect runs whenever responses update. 
  // If all active models are finished, we save to local storage.
  React.useEffect(() => {
    const activeModels = Object.keys(responses);
    if (activeModels.length === 0) return;

    // Check if everything is finished (not loading)
    const allFinished = activeModels.every(id => responses[id].isComplete || responses[id].error);
    
    if (allFinished && prompt) {
      saveToHistory();
    }
  }, [responses]); // Run this check every time a response updates

  const saveToHistory = () => {
    try {
      // 1. Get existing history
      const saved = localStorage.getItem("ai-comparison-history");
      const history = saved ? JSON.parse(saved) : [];

      // 2. Check if we already saved this exact prompt recently (prevent duplicates)
      const lastItem = history[0];
      if (lastItem && lastItem.prompt === prompt && JSON.stringify(lastItem.responses) === JSON.stringify(responses)) {
        return; // Already saved
      }

      // 3. Create new item
      const newItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        prompt: prompt,
        responses: responses
      };

      // 4. Add to top of list and limit to 50 items
      const newHistory = [newItem, ...history].slice(0, 50);
      localStorage.setItem("ai-comparison-history", JSON.stringify(newHistory));
    } catch (e) {
      console.error("Save failed", e);
    }
  };

  const handleHistorySelect = (item: any) => {
    setPrompt(item.prompt);
    setResponses(item.responses);
    // We also need to make sure the models used in that history are selected
    const modelsUsed = Object.keys(item.responses);
    // Optional: Update selected models to match the history
    // setSelectedModels(modelsUsed); 
  };

  React.useEffect(() => {
    async function fetchModels() {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/models");
        const data = await response.json();
        setModels(data.data);
      } catch (error) {
        console.error("Failed to load models", error);
      }
    }
    fetchModels();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleModelToggle = (modelId: string) => {
    setSelectedModels((prev) =>
      prev.includes(modelId)
        ? prev.filter((id) => id !== modelId)
        : [...prev, modelId]
    );
  };

  const handleSubmit = async () => {
    if (!prompt.trim() || selectedModels.length === 0) return;

    setIsLoading(true);
    setResponses({}); // Clear old responses
    
    // Initialize loading states
    const initialResponses: Record<string, any> = {};
    selectedModels.forEach(modelId => {
      initialResponses[modelId] = { text: "", isLoading: true, isComplete: false };
    });
    setResponses(initialResponses);

    // Create an array of fetch promises
    const promises = selectedModels.map(async (modelId) => {
      try {
        const formData = new FormData();
        formData.append("prompt", prompt);
        formData.append("model", modelId);
        if (file) {
           formData.append("file", file);
        }

        const response = await fetch("/api/compare", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("Failed to fetch");
        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");
          
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                
                setResponses(prev => ({
                  ...prev,
                  [modelId]: {
                    text: (prev[modelId]?.text || "") + (data.content || ""),
                    isLoading: true,
                    isComplete: false
                  }
                }));
              } catch (e) {
                console.error("Parse error", e);
              }
            }
          }
        }

        // Mark as complete
        setResponses(prev => ({
          ...prev,
          [modelId]: {
            ...prev[modelId],
            isLoading: false,
            isComplete: true
          }
        }));

      } catch (error: any) {
        setResponses(prev => ({
          ...prev,
          [modelId]: {
            text: "",
            isLoading: false,
            isComplete: true,
            error: error.message || "Failed to generate response"
          }
        }));
      }
    });

    await Promise.all(promises);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      {/* HISTORY SIDEBAR */}
      <ChatHistorySidebar 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)}
        onSelectChat={handleHistorySelect}
        currentPrompt={prompt}
      />

      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">AI Model Comparison</h1>
            <p className="text-muted-foreground">Compare responses from top LLMs side-by-side</p>
          </div>
          <div className="flex gap-2">
             <Button 
                variant="outline" 
                onClick={() => setIsHistoryOpen(true)}
                className="gap-2"
              >
                <HistoryIcon className="h-4 w-4" />
                History
             </Button>
             <ModelSelector
              models={models}
              selectedModels={selectedModels}
              onModelToggle={handleModelToggle}
            />
          </div>
        </div>

        {/* INPUT SECTION */}
        <div className="space-y-4 max-w-3xl mx-auto">
          <div className="relative">
            <Textarea
              placeholder="Enter your prompt here..."
              className="min-h-[100px] pr-24 resize-none text-lg p-4"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            
            {/* FILE UPLOAD BADGE */}
            {file && (
              <div className="absolute left-4 bottom-4 flex items-center gap-2 bg-muted px-2 py-1 rounded-md text-xs">
                <span className="truncate max-w-[150px]">{file.name}</span>
                <button 
                  onClick={() => setFile(null)}
                  className="hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            <div className="absolute bottom-4 right-4 flex gap-2">
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                onChange={handleFileSelect}
              />
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => fileInputRef.current?.click()}
                className={file ? "text-primary bg-primary/10" : "text-muted-foreground"}
              >
                <Paperclip className="h-5 w-5" />
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isLoading || !prompt.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* RESULTS GRID */}
        {Object.keys(responses).length > 0 && (
          <div className={`grid gap-6 grid-cols-1 md:grid-cols-${Math.min(selectedModels.length, 3)}`}>
            {selectedModels.map((modelId) => {
              const response = responses[modelId];
              if (!response) return null;
              
              return (
                <div key={modelId} className="min-h-[400px]">
                  <ModelResponseCard
                    modelName={models.find(m => m.id === modelId)?.name || modelId}
                    response={response.text}
                    isLoading={response.isLoading}
                    isComplete={response.isComplete}
                    error={response.error}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}