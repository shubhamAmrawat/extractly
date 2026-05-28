"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { TOOLS, CATEGORIES, Tool, getIcon } from "@/data/tools";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { UploadZone } from "@/components/ui/UploadZone";
import { 
  Search, 
  Sparkles, 
  Flame, 
  ArrowRight, 
  Grid,
  Zap,
  ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const router = useRouter();
  const { recentTools, searchQuery, setSearchQuery, addRecentTool, pendingUploadFile, setPendingUploadFile } = useApp();
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const getMatchingToolsForFile = (fileName: string): string[] => {
    const extension = fileName.split(".").pop()?.toLowerCase() || "";
    if (extension === "pdf") {
      return ["pdf-merge", "pdf-split", "pdf-to-text"];
    }
    if (["png", "jpg", "jpeg", "webp", "gif"].includes(extension)) {
      return ["image-converter", "image-resizer"];
    }
    if (["mp4", "mov", "avi", "mkv", "webm"].includes(extension)) {
      return ["video-compressor", "audio-extractor"];
    }
    if (["mp3", "wav", "m4a", "ogg"].includes(extension)) {
      return ["audio-extractor"];
    }
    if (["json"].includes(extension)) {
      return ["json-formatter"];
    }
    if (["md"].includes(extension)) {
      return ["markdown-previewer"];
    }
    if (["svg"].includes(extension)) {
      return ["svg-optimizer"];
    }
    return [];
  };

  // Filter tools based on search, selected category, and pending file type
  const filteredTools = TOOLS.filter((tool) => {
    const matchesSearch = 
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = 
      activeCategory === "All" || tool.category === activeCategory;

    let matchesPendingFile = true;
    if (pendingUploadFile) {
      const allowedIds = getMatchingToolsForFile(pendingUploadFile.name);
      matchesPendingFile = allowedIds.includes(tool.id);
    }

    return matchesSearch && matchesCategory && matchesPendingFile;
  });

  const trendingTools = TOOLS.filter((t) => t.trending);

  const handleToolClick = (tool: Tool) => {
    addRecentTool(tool.id);
    router.push(tool.path);
  };

  // Smart Universal Drop Handler
  const handleUniversalFileSelect = (files: File[]) => {
    if (files.length === 0) return;
    setPendingUploadFile(files[0]);
  };

  return (
    <DashboardShell>
      <div className="space-y-12">
        {/* Hero Section */}
        <section className="text-center max-w-2xl mx-auto space-y-4 pt-4">
          {/* <div className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/80 px-3 py-1 text-[10px] font-bold text-neutral-600 dark:text-neutral-300">
            <Sparkles className="h-3 w-3 text-violet-500" />
            <span>AI-Powered & Local browser utility suite</span>
          </div> */}

          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-neutral-950 dark:text-white leading-[1.15]">
            One modern platform for all digital utility needs.
          </h1>

          <p className="text-xs text-neutral-600 dark:text-neutral-300 max-w-lg mx-auto leading-relaxed">
            Privacy first. Your files never leave your computer—all tools run instantly in your browser with optimized WASM & client scripts.
          </p>
        </section>

        {/* Universal Smart Dropzone */}
        <section className="max-w-2xl mx-auto">
          <UploadZone
            onFilesSelected={handleUniversalFileSelect}
            maxSizeMB={100}
            multiple={true}
            descriptionText="Drop any PDF, Image, Video, or JSON file here to launch matching tool"
            hasSnakeBorder={true}
          />
        </section>

        {/* Pending File Ingestion Focus Banner */}
        {pendingUploadFile && (
          <section className="max-w-2xl mx-auto rounded-[5px] bg-violet-500/10 border border-violet-500/20 px-4 py-3 flex items-center justify-between animate-fade-in shadow-sm">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-violet-500 animate-pulse" />
              <p className="text-[11px] font-medium text-neutral-800 dark:text-neutral-200">
                Active File: <span className="font-bold text-violet-600 dark:text-violet-300">{pendingUploadFile.name}</span>. Click on a matching utility below to load this file automatically.
              </p>
            </div>
            <button
              onClick={() => setPendingUploadFile(null)}
              className="text-[10px] font-bold text-neutral-500 hover:text-neutral-800 dark:text-neutral-450 dark:hover:text-neutral-200 transition-colors cursor-pointer"
            >
              Clear File
            </button>
          </section>
        )}

        {/* Feature Highlights Grid */}
        {!pendingUploadFile && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <div className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-white/50 dark:bg-neutral-900/20 dark:border-neutral-900/60 p-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                <ShieldCheck className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">100% Secure & Private</h3>
                <p className="text-[10px] text-neutral-600 dark:text-neutral-300 mt-1 leading-normal">
                  Files are processed strictly in-browser. Zero servers, zero uploads, zero data logs.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-white/50 dark:bg-neutral-900/20 dark:border-neutral-900/60 p-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-650 dark:bg-indigo-500/20 dark:text-indigo-400">
                <Zap className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">Sub-second Execution</h3>
                <p className="text-[10px] text-neutral-600 dark:text-neutral-300 mt-1 leading-normal">
                  Skip file upload and download lag. Convert, resize, and split instantly.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-white/50 dark:bg-neutral-900/20 dark:border-neutral-900/60 p-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-650 dark:bg-violet-500/20 dark:text-violet-400">
                <Sparkles className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">Creator Ready</h3>
                <p className="text-[10px] text-neutral-600 dark:text-neutral-300 mt-1 leading-normal">
                  Subtitles generators, screen and voice recorders, metadata checkers at your service.
                </p>
              </div>
            </div>
          </section>
        )}        {/* Dynamic Recents Section */}
        {recentTools.length > 0 && !pendingUploadFile && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-neutral-800 dark:text-neutral-200">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider">Recently Used Utilities</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {recentTools.map((tool) => {
                const IconComponent = getIcon(tool.iconName);
                return (
                  <div
                    key={tool.id}
                    onClick={() => handleToolClick(tool)}
                    className="group cursor-pointer rounded-[5px] border border-neutral-200/80 bg-white p-4 hover:border-neutral-350 dark:border-neutral-850 dark:bg-neutral-900/40 dark:hover:border-neutral-750 transition-all flex flex-col items-start text-left"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-[5px] border border-neutral-100 bg-neutral-50 text-neutral-500 group-hover:bg-neutral-900 group-hover:text-white dark:border-neutral-800 dark:bg-neutral-800/40 dark:text-neutral-400 dark:group-hover:bg-neutral-800 dark:group-hover:text-neutral-100 dark:group-hover:border-neutral-700 transition-colors">
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <h3 className="mt-3 text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                      {tool.name}
                    </h3>
                    <p className="mt-1 text-[10px] text-neutral-550 dark:text-neutral-350 line-clamp-2 leading-relaxed font-medium">
                      {tool.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Trending row */}
        {!pendingUploadFile && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-neutral-800 dark:text-neutral-200">
                <Flame className="h-4 w-4 text-orange-500" />
                <h2 className="text-xs font-bold uppercase tracking-wider">Trending Utilities</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {trendingTools.slice(0, 3).map((tool) => {
                const IconComponent = getIcon(tool.iconName);
                return (
                  <div
                    key={tool.id}
                    onClick={() => handleToolClick(tool)}
                    className="group cursor-pointer rounded-[5px] border border-neutral-200/80 bg-white p-5 hover:border-neutral-350 dark:border-neutral-850 dark:bg-neutral-900/40 dark:hover:border-neutral-750 transition-all flex items-start gap-4 text-left"
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[5px] border border-neutral-100 bg-neutral-50 text-neutral-500 group-hover:bg-neutral-900 group-hover:text-white dark:border-neutral-800 dark:bg-neutral-800/40 dark:text-neutral-400 dark:group-hover:bg-neutral-800 dark:group-hover:text-neutral-100 dark:group-hover:border-neutral-700 transition-colors">
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                          {tool.name}
                        </h3>
                        <span className="text-[7px] font-bold text-orange-500 bg-orange-500/10 px-1 py-0.2 rounded uppercase">
                          HOT
                        </span>
                      </div>
                      <p className="mt-1 text-[10px] text-neutral-500 dark:text-neutral-350 leading-normal font-medium">
                        {tool.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Directory Explorer */}
        <section className="space-y-6 pt-4 border-t border-neutral-200/80 dark:border-neutral-900">
          {/* Filtering bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Grid className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                Explore All Utilities
              </h2>
            </div>

            {/* Inline search filter */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-555 dark:text-neutral-400" />
              <input
                type="text"
                placeholder="Filter tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-[5px] border border-neutral-200 bg-white pl-9 pr-4 py-1.5 text-[11px] text-neutral-800 placeholder-neutral-500 focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder-neutral-400 dark:focus:border-neutral-700 transition-colors"
              />
            </div>
          </div>

          {/* Category Quick Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-neutral-100 dark:border-neutral-900/60">
            {["All", ...CATEGORIES].map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`rounded-full px-3.5 py-1 text-[10px] font-bold transition-all ${
                  activeCategory === category
                    ? "bg-neutral-950 text-white dark:bg-neutral-800 dark:text-neutral-50"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-850 dark:text-neutral-350 dark:hover:bg-neutral-800/60 dark:hover:text-neutral-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredTools.length > 0 ? (
                filteredTools.map((tool) => {
                  const IconComponent = getIcon(tool.iconName);
                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      key={tool.id}
                      onClick={() => handleToolClick(tool)}
                      className="group cursor-pointer rounded-[5px] border border-neutral-200/80 bg-white p-5 hover:border-neutral-350 dark:border-neutral-855 dark:bg-neutral-900/40 dark:hover:border-neutral-750 transition-all flex flex-col justify-between text-left"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex h-9 w-9 items-center justify-center rounded-[5px] border border-neutral-100 bg-neutral-50 text-neutral-500 group-hover:bg-neutral-900 group-hover:text-white dark:border-neutral-800 dark:bg-neutral-800/40 dark:text-neutral-400 dark:group-hover:bg-neutral-800 dark:group-hover:text-neutral-100 dark:group-hover:border-neutral-700 transition-all">
                            <IconComponent className="h-4.5 w-4.5" />
                          </div>
                          
                          {/* Tool Status Badge */}
                          <div className="flex gap-1 items-center">
                            {tool.status === "beta" && (
                              <span className="text-[7px] font-bold text-amber-600 bg-amber-500/10 px-1 py-0.2 rounded uppercase">
                                Beta
                              </span>
                            )}
                            {tool.status === "new" && (
                              <span className="text-[7px] font-bold text-violet-500 bg-violet-500/10 px-1 py-0.2 rounded uppercase">
                                New
                              </span>
                            )}
                          </div>
                        </div>

                        <h3 className="mt-4 text-xs font-bold text-neutral-900 dark:text-neutral-50">
                          {tool.name}
                        </h3>
                        <p className="mt-1 text-[10px] text-neutral-550 dark:text-neutral-350 leading-relaxed font-medium">
                          {tool.description}
                        </p>
                      </div>

                      <div className="mt-5 pt-3 border-t border-neutral-100/50 dark:border-neutral-800/50 flex items-center justify-between text-[8px] font-bold text-neutral-500 dark:text-neutral-400">
                        <span className="uppercase tracking-wider">
                          {tool.category}
                        </span>
                        <div className="flex items-center gap-0.5 text-neutral-600 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-neutral-200 transition-colors">
                          <span>Open</span>
                          <ArrowRight className="h-2.5 w-2.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="col-span-full py-16 text-center">
                  <Search className="h-10 w-10 text-neutral-350 dark:text-neutral-600 mx-auto stroke-[1.5] mb-2" />
                  <p className="text-xs font-bold text-neutral-550 dark:text-neutral-300 font-sans">No utilities match &ldquo;{searchQuery}&rdquo;</p>
                  <p className="text-[10px] text-neutral-450 dark:text-neutral-500 mt-1 font-medium">Try clearing your filters or search keywords.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
