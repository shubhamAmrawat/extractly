"use client";

import React, { useEffect } from "react";
import { Check, Download, RefreshCw, FileText } from "lucide-react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";

interface DownloadStateProps {
  fileName: string;
  fileSize: string;
  originalSize?: string;
  downloadUrl: string;
  onReset: () => void;
  actionText?: string;
}

export const DownloadState: React.FC<DownloadStateProps> = ({
  fileName,
  fileSize,
  originalSize,
  downloadUrl,
  onReset,
  actionText = "Download file"
}) => {
  // Trigger confetti burst on success
  useEffect(() => {
    const duration = 1.5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#6366f1", "#a855f7", "#3b82f6"]
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#6366f1", "#a855f7", "#3b82f6"]
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    
    frame();
  }, []);

  // Compute compression savings if original size is provided
  const getSavings = () => {
    if (!originalSize) return null;
    
    // Simple helper to parse size string into bytes
    const parseSize = (sizeStr: string): number => {
      const num = parseFloat(sizeStr);
      if (sizeStr.toUpperCase().includes("GB")) return num * 1024 * 1024 * 1024;
      if (sizeStr.toUpperCase().includes("MB")) return num * 1024 * 1024;
      if (sizeStr.toUpperCase().includes("KB")) return num * 1024;
      return num;
    };

    try {
      const origBytes = parseSize(originalSize);
      const newBytes = parseSize(fileSize);
      
      if (origBytes <= newBytes) return null;
      
      const ratio = ((origBytes - newBytes) / origBytes) * 100;
      const diffMB = (origBytes - newBytes) / (1024 * 1024);
      
      return {
        percentage: Math.round(ratio),
        savedMB: diffMB < 0.1 ? `${Math.round(diffMB * 1024)} KB` : `${diffMB.toFixed(2)} MB`
      };
    } catch (e) {
      return null;
    }
  };

  const savings = getSavings();

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white border border-neutral-200/80 rounded-xl dark:bg-neutral-900/30 dark:border-neutral-800/80 min-h-[220px]">
      {/* Success Check Badge */}
      <motion.div 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20 mb-5"
      >
        <Check className="h-6 w-6 stroke-[2.5]" />
      </motion.div>

      <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-50 text-center">
        Processing Complete!
      </h3>
      <p className="mt-1 text-[10px] text-neutral-400 dark:text-neutral-500 font-medium text-center">
        Your processed asset is ready for download
      </p>

      {/* File Stats card */}
      <div className="w-full max-w-sm mt-5 rounded-lg border border-neutral-100 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-900/40">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-500 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-400">
            <FileText className="h-4.5 w-4.5" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="text-[11px] font-semibold text-neutral-800 dark:text-neutral-200 truncate" title={fileName}>
              {fileName}
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-[9px] text-neutral-400 dark:text-neutral-500 font-medium">
              <span>{fileSize}</span>
              {originalSize && (
                <>
                  <span>•</span>
                  <span className="line-through">was {originalSize}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {savings && (
          <div className="mt-3 pt-3 border-t border-neutral-200/40 dark:border-neutral-800/40 flex items-center justify-between text-[9px] font-semibold">
            <span className="text-neutral-400 dark:text-neutral-500">OPTIMIZATION SAVINGS</span>
            <span className="text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
              Saved {savings.savedMB} (-{savings.percentage}%)
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full max-w-sm mt-6">
        <a
          href={downloadUrl}
          download={fileName}
          className="flex items-center justify-center gap-2 w-full rounded-lg bg-neutral-950 px-4 py-2.5 text-xs font-semibold text-white hover:bg-neutral-900 focus:outline-none dark:bg-white dark:text-black dark:hover:bg-neutral-100 transition-colors shadow-sm"
        >
          <Download className="h-3.5 w-3.5" />
          <span>{actionText}</span>
        </a>

        <button
          onClick={onReset}
          className="flex items-center justify-center gap-2 w-full rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Convert another</span>
        </button>
      </div>
    </div>
  );
};
