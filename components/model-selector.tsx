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
import { ChevronDown } from "lucide-react";

interface Model {
  id: string;
  name: string;
}

interface ModelSelectorProps {
  models: Model[];
  selectedModels: string[];
  // We are explicitly naming this prop 'onModelToggle'
  onModelToggle: (modelId: string) => void;
}

export function ModelSelector({
  models,
  selectedModels,
  onModelToggle,
}: ModelSelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="ml-auto">
          Models <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuLabel>Select Models</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {models.map((model) => (
          <DropdownMenuCheckboxItem
            key={model.id}
            checked={selectedModels.includes(model.id)}
            onCheckedChange={() => onModelToggle(model.id)}
          >
            {model.name}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}