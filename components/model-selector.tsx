"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Search } from "lucide-react";

interface Model {
  id: string;
  name: string;
}

interface ModelSelectorProps {
  models: Model[];
  selectedModels: string[];
  onModelToggle: (modelId: string) => void;
}

export function ModelSelector({
  models,
  selectedModels,
  onModelToggle,
}: ModelSelectorProps) {
  const [searchQuery, setSearchQuery] = React.useState("");

  // Filter the models based on what the user types
  const filteredModels = models.filter((model) =>
    model.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="ml-auto">
          Models <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      
      {/* Increased width to 280px to fit the search bar comfortably */}
      <DropdownMenuContent align="end" className="w-[280px]">
        <DropdownMenuLabel>Select Models</DropdownMenuLabel>
        
        {/* --- SEARCH BAR SECTION --- */}
        <div className="px-2 pb-2">
          <div className="flex items-center border rounded-md px-2">
            <Search className="h-4 w-4 text-muted-foreground mr-2 opacity-50" />
            <input
              className="flex h-9 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Search models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              // This stops the menu from trying to "navigate" while you type
              onKeyDown={(e) => e.stopPropagation()} 
            />
          </div>
        </div>
        
        <DropdownMenuSeparator />

        {/* --- SCROLLABLE LIST SECTION --- */}
        {/* max-h-[300px] makes it scroll if the list is too long */}
        <div className="max-h-[300px] overflow-y-auto">
          {filteredModels.length === 0 && (
            <div className="p-4 text-sm text-center text-muted-foreground">
              No models found
            </div>
          )}

          {filteredModels.map((model) => (
            <DropdownMenuCheckboxItem
              key={model.id}
              checked={selectedModels.includes(model.id)}
              onCheckedChange={() => onModelToggle(model.id)}
            >
              {model.name}
            </DropdownMenuCheckboxItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}