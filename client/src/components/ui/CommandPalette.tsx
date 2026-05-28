"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { TOOLS, Tool, getIcon } from "@/data/tools";
import { Search, Sparkles, Command } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const CommandPalette: React.FC = () => {
  const router = useRouter();
  const { isCommandPaletteOpen, setCommandPaletteOpen, addRecentTool } = useApp();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset indices on query change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (isCommandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
    }
  }, [isCommandPaletteOpen]);

  // Filter tools
  const filteredTools = TOOLS.filter((tool) =>
    tool.name.toLowerCase().includes(query.toLowerCase()) ||
    tool.description.toLowerCase().includes(query.toLowerCase()) ||
    tool.category.toLowerCase().includes(query.toLowerCase())
  );

  // Navigate to selected tool
  const handleSelect = (tool: Tool) => {
    addRecentTool(tool.id);
    setCommandPaletteOpen(false);
    router.push(tool.path);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isCommandPaletteOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < filteredTools.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev > 0 ? prev - 1 : filteredTools.length - 1
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredTools[selectedIndex]) {
          handleSelect(filteredTools[selectedIndex]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCommandPaletteOpen, filteredTools, selectedIndex]);

  // Sync scroll height of selected item
  useEffect(() => {
    const selectedElement = scrollRef.current?.children[selectedIndex] as HTMLElement;
    if (selectedElement && scrollRef.current) {
      const container = scrollRef.current;
      const elemTop = selectedElement.offsetTop;
      const elemBottom = elemTop + selectedElement.offsetHeight;
      const containerTop = container.scrollTop;
      const containerBottom = containerTop + container.offsetHeight;

      if (elemTop < containerTop) {
        container.scrollTop = elemTop;
      } else if (elemBottom > containerBottom) {
        container.scrollTop = elemBottom - container.offsetHeight;
      }
    }
  }, [selectedIndex]);

  if (!isCommandPaletteOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setCommandPaletteOpen(false)}
          className="fixed inset-0 bg-neutral-950/40 backdrop-blur-sm dark:bg-black/60"
        />

        {/* Palette Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -8 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="relative w-full max-w-xl overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-2xl dark:border-neutral-800/80 dark:bg-neutral-900/95 dark:shadow-neutral-950/80"
        >
          {/* Header Search Field */}
          <div className="flex items-center border-b border-neutral-200/80 px-4 py-3 dark:border-neutral-800/80">
            <Search className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search tools, formats, categories..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="ml-3 flex-1 bg-transparent text-sm text-neutral-900 placeholder-neutral-400 outline-none dark:text-neutral-50 dark:placeholder-neutral-500"
            />
            <div className="flex items-center gap-1 rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500">
              <Command className="h-2.5 w-2.5" />
              <span>K</span>
            </div>
          </div>

          {/* Results List */}
          <div 
            ref={scrollRef}
            className="max-h-[350px] overflow-y-auto p-2"
          >
            {filteredTools.length > 0 ? (
              filteredTools.map((tool, idx) => {
                const IconComponent = getIcon(tool.iconName);
                const isSelected = idx === selectedIndex;
                return (
                  <div
                    key={tool.id}
                    onClick={() => handleSelect(tool)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 transition-colors ${
                      isSelected
                        ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800/80 dark:text-neutral-50"
                        : "text-neutral-600 dark:text-neutral-400"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-md border transition-all ${
                        isSelected 
                          ? "border-neutral-300 bg-white text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100" 
                          : "border-neutral-100 bg-neutral-50 text-neutral-500 dark:border-neutral-800 dark:bg-neutral-800/40 dark:text-neutral-500"
                      }`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold">{tool.name}</div>
                        <div className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5 line-clamp-1">{tool.description}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-semibold tracking-wider text-neutral-400 uppercase bg-neutral-200/50 dark:bg-neutral-800/50 dark:text-neutral-500 px-1.5 py-0.5 rounded">
                        {tool.category.replace(" Tools", "")}
                      </span>
                      {tool.status === "new" && (
                        <span className="flex items-center gap-0.5 text-[9px] font-bold text-violet-500 bg-violet-500/10 px-1.5 py-0.5 rounded">
                          <Sparkles className="h-2 w-2" />
                          NEW
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="h-8 w-8 text-neutral-300 dark:text-neutral-700 stroke-[1.5]" />
                <p className="mt-2 text-xs font-medium text-neutral-400 dark:text-neutral-500">No results found for &ldquo;{query}&rdquo;</p>
              </div>
            )}
          </div>

          {/* Footer Shortcuts */}
          <div className="flex items-center justify-between border-t border-neutral-200/80 bg-neutral-50/50 px-4 py-2 text-[10px] text-neutral-400 dark:border-neutral-800/80 dark:bg-neutral-900/30 dark:text-neutral-500">
            <div className="flex items-center gap-3">
              <span>Use <kbd className="font-sans font-bold">↑↓</kbd> keys to navigate</span>
              <span><kbd className="font-sans font-bold">Enter</kbd> to select</span>
            </div>
            <span>Press <kbd className="font-sans font-bold">Esc</kbd> to close</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
