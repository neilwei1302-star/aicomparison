"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Model {
  id: string;
  name: string;
}

interface ModelSelectorProps {
  models: Model[];
  selectedModels: string[];
  onSelectionChange: (models: string[]) => void;
  isLoading?: boolean;
}

export function ModelSelector({
  models,
  selectedModels,
  onSelectionChange,
  isLoading = false,
}: ModelSelectorProps) {
  const [open, setOpen] = React.useState(false);

  const toggleModel = (modelId: string) => {
    if (selectedModels.includes(modelId)) {
      onSelectionChange(selectedModels.filter((id) => id !== modelId));
    } else {
      onSelectionChange([...selectedModels, modelId]);
    }
  };

  const selectedModelsData = models.filter((m) =>
    selectedModels.includes(m.id)
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between min-h-[3rem] h-auto py-2"
          disabled={isLoading}
        >
          <div className="flex flex-wrap gap-1 flex-1 text-left">
            {selectedModels.length === 0 ? (
              <span className="text-muted-foreground">Select models...</span>
            ) : (
              selectedModelsData.map((model) => (
                <Badge key={model.id} variant="secondary" className="mr-1">
                  {model.name}
                </Badge>
              ))
            )}
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <div className="max-h-[300px] overflow-y-auto p-2">
          {models.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {isLoading ? "Loading models..." : "No models available"}
            </div>
          ) : (
            models.map((model) => {
              const isSelected = selectedModels.includes(model.id);
              return (
                <div
                  key={model.id}
                  className={cn(
                    "relative flex items-center space-x-2 rounded-sm px-2 py-1.5 hover:bg-accent cursor-pointer",
                    isSelected && "bg-accent"
                  )}
                  onClick={() => toggleModel(model.id)}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleModel(model.id)}
                  />
                  <label
                    className="flex-1 text-sm font-medium leading-none cursor-pointer"
                    onClick={(e) => e.preventDefault()}
                  >
                    {model.name}
                  </label>
                  {isSelected && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

