"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ModelSelector } from "@/components/model-selector";
import { ModelResponseCard } from "@/components/model-response-card";
import { ChatHistorySidebar } from "@/components/chat-history-sidebar";
import { Send, Loader2, Paperclip, X, History as HistoryIcon, PlusCircle, Bot } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// --- 2026 Flagship Lineup ---
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

interface ChatTurn {
  id: string;
  userPrompt: string;
  attachment?: string | null;
  fileName?: string;
  modelResponses: Record<string, {
    text: string;
    isLoading: boolean;
    isComplete: boolean;
    error?: string;
  }>;
}

export default function Home() {
  const [input, setInput] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null); 
  const fileInputRef = React.useRef<HTMLInputElement>(null); 
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const [chatTurns, setChatTurns] = React.useState<ChatTurn[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false);
  const [models, setModels] = React.useState<Model[]>([]);
  const [selectedModels, setSelectedModels] = React.useState<string[]>(defaultModels);
  const [isGenerating, setIsGenerating] = React.useState(false);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatTurns]);

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

  // --- HELPER: Build Message History ---
  const buildHistoryForModel = (modelId: string, turns: ChatTurn[], currentPrompt: string, currentImage: string | null) => {
    const messages = [];

    // Add previous turns
    for (const turn of turns) {
      let userContent: any;
      // Smart Formatting: Only send object if image exists
      if (turn.attachment) {
        userContent = [
          { type: "text", text: turn.userPrompt },
          { type: "image_url", image_url: { url: turn.attachment } }
        ];
      } else {
        userContent = turn.userPrompt;
      }
      
      messages.push({ role: "user", content: userContent });

      if (turn.modelResponses[modelId]?.text) {
        messages.push({ role: "assistant", content: turn.modelResponses[modelId].text });
      }
    }

    // Add the NEW Prompt
    let currentContent: any;
    if (currentImage) {
      currentContent = [
        { type: "text", text: currentPrompt },
        { type: "image_url", image_url: { url: currentImage } }
      ];
    } else {
      currentContent = currentPrompt;
    }
    messages.push({ role: "user", content: currentContent });

    return messages;
  };

  const handleSubmit = async () => {
    if (!input.trim() || selectedModels.length === 0) return;

    setIsGenerating(true);
    const currentPrompt = input;
    const currentFile = file;
    setInput("");
    setFile(null);

    let base64File: string | null = null;
    if (currentFile) {
      const reader = new FileReader();
      base64File = await new Promise((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(currentFile);
      });
    }

    const newTurnId = Date.now().toString();
    const initialResponses: Record<string, any> = {};
    selectedModels.forEach(id => {
      initialResponses[id] = { text: "", isLoading: true, isComplete: false };
    });

    setChatTurns(prev => [...prev, {
      id: newTurnId,
      userPrompt: currentPrompt,
      attachment: base64File,
      fileName: currentFile?.name,
      modelResponses: initialResponses
    }]);

    const promises = selectedModels.map(async (modelId) => {
      try {
        const messages = buildHistoryForModel(modelId, chatTurns, currentPrompt, base64File);
        const formData = new FormData();
        formData.append("messages", JSON.stringify(messages));
        formData.append("model", modelId);

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
                setChatTurns(prev => prev.map(turn => {
                  if (turn.id !== newTurnId) return turn;
                  return {
                    ...turn,
                    modelResponses: {
                      ...turn.modelResponses,
                      [modelId]: {
                        ...turn.modelResponses[modelId],
                        text: (turn.modelResponses[modelId]?.text || "") + (data.content || ""),
                        isLoading: true,
                        isComplete: false
                      }
                    }
                  };
                }));
              } catch (e) { console.error(e); }
            }
          }
        }

        setChatTurns(prev => prev.map(turn => {
          if (turn.id !== newTurnId) return turn;
          return {
            ...turn,
            modelResponses: {
              ...turn.modelResponses,
              [modelId]: { ...turn.modelResponses[modelId], isLoading: false, isComplete: true }
            }
          };
        }));

      } catch (error: any) {
        setChatTurns(prev => prev.map(turn => {
          if (turn.id !== newTurnId) return turn;
          return {
            ...turn,
            modelResponses: {
              ...turn.modelResponses,
              [modelId]: {
                ...turn.modelResponses[modelId],
                isLoading: false,
                isComplete: true,
                error: error.message || "Error"
              }
            }
          };
        }));
      }
    });

    await Promise.all(promises);
    setIsGenerating(false);
  };

  const handleHistorySelect = (item: any) => {
    setChatTurns([]); 
    setInput(item.prompt);
  };

  const handleModelToggle = (modelId: string) => {
    setSelectedModels((prev) =>
      prev.includes(modelId) ? prev.filter((id) => id !== modelId) : [...prev, modelId]
    );
  };

  const handleClearChat = () => {
    if(confirm("Start a new conversation?")) {
      setChatTurns([]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const getModelName = (id: string) => {
    const model = models.find(m => m.id === id);
    if (model) return model.name;
    const parts = id.split('/');
    return parts[1] || id;
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <ChatHistorySidebar 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)}
        onSelectChat={handleHistorySelect}
        currentPrompt={input}
      />

      {/* --- HEADER --- */}
      <header className="flex flex-col md:flex-row items-center justify-between p-4 border-b bg-background/95 backdrop-blur sticky top-0 z-10 gap-4">
        <div className="flex items-center gap-2 w-full md:w-auto overflow-hidden">
           <Button variant="ghost" size="icon" onClick={() => setIsHistoryOpen(true)} className="shrink-0">
             <HistoryIcon className="h-5 w-5" />
           </Button>
           <h1 className="text-xl font-bold hidden md:block mr-2 shrink-0">AI Comparison</h1>
           
           {/* SELECTED MODELS DISPLAY (Scrollable) */}
           <div className="flex gap-2 overflow-x-auto no-scrollbar mask-gradient flex-1 items-center">
             {selectedModels.map(id => (
               <Badge key={id} variant="secondary" className="whitespace-nowrap flex gap-1 items-center px-2 py-1 h-7">
                 <Bot className="h-3 w-3" />
                 {getModelName(id)}
                 <button 
                   onClick={() => handleModelToggle(id)}
                   className="ml-1 hover:text-destructive rounded-full p-0.5"
                 >
                   <X className="h-3 w-3" />
                 </button>
               </Badge>
             ))}
             {selectedModels.length === 0 && (
               <span className="text-sm text-muted-foreground italic whitespace-nowrap">No models selected</span>
             )}
           </div>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto justify-end shrink-0">
          <Button variant="outline" size="sm" onClick={handleClearChat} disabled={chatTurns.length === 0}>
             <PlusCircle className="mr-2 h-4 w-4" /> New Chat
          </Button>
          <ModelSelector
            models={models}
            selectedModels={selectedModels}
            onModelToggle={handleModelToggle}
          />
        </div>
      </header>

      {/* --- CHAT AREA --- */}
      <div className="flex-1 overflow-y-auto p-4 space-y-8">
        {chatTurns.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
             <div className="max-w-md space-y-4">
               <h2 className="text-2xl font-semibold text-foreground">Compare AI Models</h2>
               <p>Select your models, type a prompt, and see how they answer side-by-side.</p>
             </div>
          </div>
        ) : (
          chatTurns.map((turn) => (
            <div key={turn.id} className="max-w-7xl mx-auto space-y-6">
              <div className="flex justify-end">
                <div className="bg-primary text-primary-foreground px-4 py-3 rounded-2xl rounded-tr-sm max-w-[85%] md:max-w-[70%] text-sm md:text-base shadow-sm">
                   {turn.attachment && (
                     <div className="mb-2 rounded overflow-hidden border border-white/20">
                       <img src={turn.attachment} alt="User attachment" className="max-h-40 object-cover" />
                     </div>
                   )}
                   <p className="whitespace-pre-wrap">{turn.userPrompt}</p>
                </div>
              </div>

              <div className={`grid gap-4 grid-cols-1 md:grid-cols-${Math.min(selectedModels.length, 2)} lg:grid-cols-${Math.min(selectedModels.length, 3)}`}>
                 {selectedModels.map(modelId => {
                   const response = turn.modelResponses[modelId];
                   if (!response) return null;
                   return (
                     <div key={modelId} className="min-h-[200px]">
                       <ModelResponseCard 
                          modelName={getModelName(modelId)}
                          response={response.text}
                          isLoading={response.isLoading}
                          isComplete={response.isComplete}
                          error={response.error}
                       />
                     </div>
                   );
                 })}
              </div>
              <div className="h-px bg-border w-full my-8 opacity-50" />
            </div>
          ))
        )}
        <div ref={scrollRef} />
      </div>

      {/* --- INPUT AREA --- */}
      <div className="p-4 border-t bg-background">
        <div className="max-w-4xl mx-auto relative">
           <Textarea
              placeholder="Type in a prompt..."
              className="min-h-[60px] pr-24 resize-none rounded-xl p-4 shadow-sm text-base"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />

            {file && (
              <div className="absolute left-4 bottom-16 flex items-center gap-2 bg-muted px-2 py-1 rounded-md text-xs shadow-sm border">
                <span className="truncate max-w-[150px]">{file.name}</span>
                <button onClick={() => setFile(null)} className="hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            <div className="absolute bottom-3 right-3 flex gap-2">
               <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
               <Button size="icon" variant="ghost" onClick={() => fileInputRef.current?.click()} className={file ? "text-primary" : "text-muted-foreground"}>
                 <Paperclip className="h-5 w-5" />
               </Button>
               <Button onClick={handleSubmit} disabled={isGenerating || !input.trim()} size="icon">
                 {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
               </Button>
            </div>
        </div>
      </div>
    </div>
  );
}