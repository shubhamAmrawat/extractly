"use client";

import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface ProcessingStateProps {
  progress: number;
  statusText?: string;
  subText?: string;
  stages?: string[];
}

export const ProcessingState: React.FC<ProcessingStateProps> = ({
  progress,
  statusText = "Processing file...",
  subText = "Please do not close this browser tab",
  stages = ["Reading file data...", "Parsing content structure...", "Executing algorithms...", "Finalizing operations..."]
}) => {
  const [activeStage, setActiveStage] = useState(stages[0]);

  // Rotate through stages based on progress value
  useEffect(() => {
    if (stages.length === 0) return;
    const stageIndex = Math.min(
      Math.floor((progress / 100) * stages.length),
      stages.length - 1
    );
    setActiveStage(stages[stageIndex]);
  }, [progress, stages]);

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white border border-neutral-200/80 rounded-xl dark:bg-neutral-900/30 dark:border-neutral-800/80 min-h-[220px]">
      {/* Premium Loader Ring */}
      <div className="relative flex items-center justify-center mb-6">
        <Loader2 className="h-8 w-8 text-neutral-800 dark:text-neutral-200 animate-spin stroke-[1.5]" />
        <span className="absolute text-[8px] font-bold text-neutral-500 dark:text-neutral-400">
          {Math.round(progress)}%
        </span>
      </div>

      <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-50">
        {statusText}
      </h3>
      
      <p className="mt-1.5 text-[10px] text-neutral-400 dark:text-neutral-500 font-medium">
        {activeStage}
      </p>

      {/* Spacing and progress bar container */}
      <div className="w-full max-w-xs mt-6">
        <div className="h-1 w-full bg-neutral-100 rounded-full overflow-hidden dark:bg-neutral-800">
          <div 
            className="h-full bg-neutral-900 dark:bg-neutral-50 transition-all duration-300 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <p className="mt-3 text-[9px] text-neutral-400/80 dark:text-neutral-500/80 uppercase tracking-widest font-bold">
          {subText}
        </p>
      </div>
    </div>
  );
};
