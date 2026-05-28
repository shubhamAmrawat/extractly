"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { TOOLS, Tool, getIcon } from "@/data/tools";
import { useApp } from "@/context/AppContext";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { UploadZone } from "@/components/ui/UploadZone";
import { ProcessingState } from "@/components/ui/ProcessingState";
import { DownloadState } from "@/components/ui/DownloadState";
import { 
  ArrowLeft, 
  Settings2, 
  Play, 
  Trash2, 
  Plus, 
  Video, 
  Volume2, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Unlock, 
  Lock,
  Download,
  AlertCircle
} from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { motion } from "framer-motion";

export default function ToolPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addRecentTool } = useApp();
  
  const toolId = params.id as string;
  const tool = TOOLS.find((t) => t.id === toolId);

  // Core Flow State: idle | configuring | processing | done
  const [flowState, setFlowState] = useState<"idle" | "configuring" | "processing" | "done">("idle");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [resultFileName, setResultFileName] = useState("");
  const [resultFileSize, setResultFileSize] = useState("");
  const [originalFileSize, setOriginalFileSize] = useState("");
  const [resultDownloadUrl, setResultDownloadUrl] = useState("");

  // Specific Tool Settings
  const [imageFormat, setImageFormat] = useState("webp");
  const [imageQuality, setImageQuality] = useState(80);
  const [imageWidth, setImageWidth] = useState<number>(0);
  const [imageHeight, setImageHeight] = useState<number>(0);
  const [maintainAspect, setMaintainAspect] = useState(true);
  const [aspectRatioValue, setAspectRatioValue] = useState(1);

  // PDF Split Settings
  const [pdfSplitRange, setPdfSplitRange] = useState("1");

  // Recorder states
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [recorderBlob, setRecorderBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Text tools states
  const [textInput, setTextInput] = useState("");
  const [jsonIndentation, setJsonIndentation] = useState("2");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [markdownView, setMarkdownView] = useState<"edit" | "preview" | "split">("split");

  // Creator tools states
  const [paletteColors, setPaletteColors] = useState<{ hex: string; locked: boolean }[]>([]);
  const [downloaderUrl, setDownloaderUrl] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiStyle, setAiStyle] = useState("isometric 3D");

  // Auto-fill trigger from query parameter
  useEffect(() => {
    if (searchParams.get("auto") === "true") {
      // Auto-triggered behaviors could go here
    }
  }, [searchParams]);

  // Track page view and history
  useEffect(() => {
    if (toolId) {
      addRecentTool(toolId);
    }
  }, [toolId, addRecentTool]);

  // Screen/Voice Recording timer effect
  useEffect(() => {
    if (isRecording) {
      recordIntervalRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    }
    return () => {
      if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    };
  }, [isRecording]);

  if (!tool) {
    return (
      <DashboardShell>
        <div className="text-center py-20">
          <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-50">Utility Not Found</h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-350 mt-1">The specified tool path could not be resolved.</p>
          <button onClick={() => router.push("/")} className="mt-4 text-xs font-bold text-neutral-950 dark:text-white underline">
            Return to Dashboard
          </button>
        </div>
      </DashboardShell>
    );
  }

  const IconComponent = getIcon(tool.iconName);

  // Handle files ingestion
  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files);
    
    // Auto-detect image dimensions if it's an image tool
    if (["image-resizer", "image-converter", "image-compressor"].includes(toolId) && files[0]) {
      const img = new Image();
      img.src = URL.createObjectURL(files[0]);
      img.onload = () => {
        setImageWidth(img.width);
        setImageHeight(img.height);
        setAspectRatioValue(img.width / img.height);
      };
      setOriginalFileSize(formatBytes(files[0].size));
    } else if (files[0]) {
      setOriginalFileSize(formatBytes(files[0].size));
    }
    
    setFlowState("configuring");
  };

  const handleWidthChange = (val: number) => {
    setImageWidth(val);
    if (maintainAspect && aspectRatioValue) {
      setImageHeight(Math.round(val / aspectRatioValue));
    }
  };

  const handleHeightChange = (val: number) => {
    setImageHeight(val);
    if (maintainAspect && aspectRatioValue) {
      setImageWidth(Math.round(val * aspectRatioValue));
    }
  };

  // Helper size formatter
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  // RESET
  const handleReset = () => {
    setSelectedFiles([]);
    setProcessingProgress(0);
    setFlowState("idle");
    setResultDownloadUrl("");
    setRecorderBlob(null);
    setRecordDuration(0);
    setJsonError(null);
  };

  // START RECORDING (Mic / Screen)
  const startRecording = async () => {
    setRecordDuration(0);
    setRecorderBlob(null);
    try {
      let stream: MediaStream;
      if (toolId === "screen-recorder") {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
      } else {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const type = toolId === "screen-recorder" ? "video/webm" : "audio/webm";
        const blob = new Blob(chunks, { type });
        setRecorderBlob(blob);
        
        // Stop all tracks to release camera/mic
        stream.getTracks().forEach((track) => track.stop());
        
        // Set values for download card
        setResultFileName(`${toolId}-${Date.now()}.${toolId === "screen-recorder" ? "webm" : "webm"}`);
        setResultFileSize(formatBytes(blob.size));
        setResultDownloadUrl(URL.createObjectURL(blob));
        setFlowState("done");
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (e) {
      alert("Permission denied or capture interface unavailable.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // EXECUTE PROCESSING MAPPING
  const executeProcess = async () => {
    setFlowState("processing");
    setProcessingProgress(10);

    const incrementProgress = (target: number, delay: number): Promise<void> => {
      return new Promise((res) => {
        let current = processingProgress;
        const interval = setInterval(() => {
          current += Math.ceil(Math.random() * 8) + 2;
          if (current >= target) {
            setProcessingProgress(target);
            clearInterval(interval);
            res();
          } else {
            setProcessingProgress(current);
          }
        }, delay);
      });
    };

    try {
      // 1. PDF MERGE
      if (toolId === "pdf-merge") {
        await incrementProgress(40, 60);
        const mergedPdf = await PDFDocument.create();
        for (const file of selectedFiles) {
          const fileBytes = await file.arrayBuffer();
          const pdf = await PDFDocument.load(fileBytes);
          const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
          pages.forEach((p) => mergedPdf.addPage(p));
        }
        setProcessingProgress(80);
        const mergedBytes = await mergedPdf.save();
        const blob = new Blob([mergedBytes as any], { type: "application/pdf" });
        
        setResultFileName(`Merged_Document_${Date.now()}.pdf`);
        setResultFileSize(formatBytes(blob.size));
        setResultDownloadUrl(URL.createObjectURL(blob));

      // 2. PDF SPLIT
      } else if (toolId === "pdf-split") {
        await incrementProgress(40, 60);
        const file = selectedFiles[0];
        const fileBytes = await file.arrayBuffer();
        const pdf = await PDFDocument.load(fileBytes);
        const splitPdf = await PDFDocument.create();
        
        // Parse range: e.g. "1-2" or single pages
        const pagesCount = pdf.getPageCount();
        const pagesToCopy: number[] = [];
        
        if (pdfSplitRange.includes("-")) {
          const [start, end] = pdfSplitRange.split("-").map(n => parseInt(n.trim()) - 1);
          for (let i = Math.max(0, start); i <= Math.min(pagesCount - 1, end); i++) {
            pagesToCopy.push(i);
          }
        } else {
          const single = parseInt(pdfSplitRange.trim()) - 1;
          if (single >= 0 && single < pagesCount) {
            pagesToCopy.push(single);
          }
        }

        if (pagesToCopy.length === 0) {
          throw new Error("Invalid page range specified");
        }

        const copiedPages = await splitPdf.copyPages(pdf, pagesToCopy);
        copiedPages.forEach((p) => splitPdf.addPage(p));
        
        setProcessingProgress(80);
        const splitBytes = await splitPdf.save();
        const blob = new Blob([splitBytes as any], { type: "application/pdf" });
        
        setResultFileName(`Split_${file.name}`);
        setResultFileSize(formatBytes(blob.size));
        setResultDownloadUrl(URL.createObjectURL(blob));

      // 3. IMAGE CONVERTER / RESIZER / COMPRESSOR
      } else if (["image-converter", "image-resizer", "image-compressor"].includes(toolId)) {
        await incrementProgress(50, 40);
        const file = selectedFiles[0];
        
        // Format mapping
        const format = toolId === "image-converter" ? imageFormat : "png";
        const quality = toolId === "image-compressor" ? imageQuality : 90;
        
        const blob = await new Promise<Blob>((resolve, reject) => {
          const img = new Image();
          img.src = URL.createObjectURL(file);
          img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx) return reject("Canvas failed");

            const w = imageWidth || img.width;
            const h = imageHeight || img.height;
            canvas.width = w;
            canvas.height = h;
            
            ctx.drawImage(img, 0, 0, w, h);
            
            const mime = `image/${format === "jpg" ? "jpeg" : format}`;
            canvas.toBlob((b) => {
              if (b) resolve(b);
              else reject("Blob conversion failed");
            }, mime, quality / 100);
          };
          img.onerror = () => reject("Image load error");
        });

        const extension = format;
        const baseName = file.name.substring(0, file.name.lastIndexOf("."));
        setResultFileName(`${baseName}_processed.${extension}`);
        setResultFileSize(formatBytes(blob.size));
        setResultDownloadUrl(URL.createObjectURL(blob));

      // 4. MOCK / SIMULATED HIGH-FIDELITY UTILITIES
      } else {
        await incrementProgress(70, 70);
        // Create a dummy text file / placeholder download blob
        const mockContent = `Processed asset output by Extractly utility suite on ${new Date().toISOString()}`;
        const blob = new Blob([mockContent], { type: "text/plain" });
        
        let outName = "processed_output.txt";
        let outSize = "1.2 MB";
        
        if (toolId === "video-downloader") {
          outName = "media_download_1080p.mp4";
          outSize = "24.5 MB";
        } else if (toolId === "video-compressor") {
          outName = `compressed_${selectedFiles[0]?.name || "video.mp4"}`;
          outSize = formatBytes((selectedFiles[0]?.size || 50000000) * 0.45);
        } else if (toolId === "ai-generator") {
          outName = `${aiPrompt.replace(/\s+/g, "_").slice(0, 15)}_ai.png`;
          outSize = "890 KB";
        } else if (toolId === "audio-extractor") {
          const baseName = selectedFiles[0]?.name.substring(0, selectedFiles[0]?.name.lastIndexOf(".")) || "audio";
          outName = `${baseName}.mp3`;
          outSize = formatBytes((selectedFiles[0]?.size || 10000000) * 0.15);
        } else if (toolId === "pdf-to-text") {
          outName = `${selectedFiles[0]?.name.replace(".pdf", "")}_extracted.txt`;
          outSize = "14 KB";
        }

        setResultFileName(outName);
        setResultFileSize(outSize);
        setResultDownloadUrl(URL.createObjectURL(blob));
      }

      setProcessingProgress(100);
      setTimeout(() => setFlowState("done"), 200);
    } catch (e) {
      alert("An error occurred during file processing. Please verify file syntax or dimensions.");
      setFlowState("configuring");
    }
  };

  // ----------------------------------------------------
  // INDIVIDUAL TEXT AND CODE RENDERERS (Instantly interactive without uploading)
  // ----------------------------------------------------
  
  // A. JSON FORMATTER
  const handleJSONProcess = (action: "format" | "minify") => {
    setJsonError(null);
    try {
      const parsed = JSON.parse(textInput);
      if (action === "format") {
        const spaces = jsonIndentation === "tab" ? "\t" : parseInt(jsonIndentation);
        setTextInput(JSON.stringify(parsed, null, spaces));
      } else {
        setTextInput(JSON.stringify(parsed));
      }
    } catch (e: any) {
      setJsonError(e.message || "Invalid JSON structure");
    }
  };

  // B. COLOR PALETTE GENERATOR
  const generatePalette = () => {
    const hexChars = "0123456789ABCDEF";
    const colors = Array.from({ length: 5 }).map((_, idx) => {
      const existing = paletteColors[idx];
      if (existing && existing.locked) return existing;
      
      let hex = "#";
      for (let i = 0; i < 6; i++) {
        hex += hexChars[Math.floor(Math.random() * 16)];
      }
      return { hex, locked: false };
    });
    setPaletteColors(colors);
  };

  useEffect(() => {
    if (toolId === "color-palette" && paletteColors.length === 0) {
      generatePalette();
    }
  }, [toolId]);

  const toggleLockColor = (idx: number) => {
    setPaletteColors(prev => prev.map((c, i) => i === idx ? { ...c, locked: !c.locked } : c));
  };

  // Render settings panels dynamically
  const renderSettingsPanel = () => {
    switch (toolId) {
      case "image-converter":
        return (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Output Format</label>
              <div className="flex gap-2 mt-1.5">
                {["webp", "png", "jpg", "gif"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setImageFormat(f)}
                    className={`flex-1 rounded-[5px] border py-2 text-xs font-bold uppercase transition-colors ${
                      imageFormat === f
                        ? "border-neutral-900 bg-neutral-950 text-white dark:border-neutral-200 dark:bg-white dark:text-black"
                        : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800/50"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                <span>Quality settings</span>
                <span>{imageQuality}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={imageQuality}
                onChange={(e) => setImageQuality(parseInt(e.target.value))}
                className="w-full mt-2 h-1 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-neutral-950 dark:accent-white"
              />
            </div>
          </div>
        );

      case "image-resizer":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Width (px)</label>
                <input
                  type="number"
                  value={imageWidth || ""}
                  onChange={(e) => handleWidthChange(parseInt(e.target.value) || 0)}
                  className="w-full mt-1.5 rounded-[5px] border border-neutral-200 bg-white px-3 py-2 text-xs outline-none focus:border-neutral-450 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-neutral-750"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Height (px)</label>
                <input
                  type="number"
                  value={imageHeight || ""}
                  onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0)}
                  className="w-full mt-1.5 rounded-[5px] border border-neutral-200 bg-white px-3 py-2 text-xs outline-none focus:border-neutral-450 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-neutral-750"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer mt-2">
              <input
                type="checkbox"
                checked={maintainAspect}
                onChange={(e) => setMaintainAspect(e.target.checked)}
                className="rounded-[5px] border-neutral-300 dark:border-neutral-800 text-neutral-950 focus:ring-0"
              />
              <span className="text-[10px] text-neutral-600 dark:text-neutral-300 font-bold uppercase tracking-wider">Maintain Aspect Ratio</span>
            </label>
          </div>
        );

      case "image-compressor":
        return (
          <div>
            <div className="flex justify-between items-center text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              <span>Compression strength</span>
              <span>{imageQuality}% Quality</span>
            </div>
            <input
              type="range"
              min="5"
              max="95"
              value={imageQuality}
              onChange={(e) => setImageQuality(parseInt(e.target.value))}
              className="w-full mt-2 h-1 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-neutral-950 dark:accent-white"
            />
            <p className="text-[9px] text-neutral-500 dark:text-neutral-400 mt-2 font-medium">Lower quality values yield significantly smaller file sizes.</p>
          </div>
        );

      case "pdf-split":
        return (
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Pages to extract</label>
            <input
              type="text"
              placeholder="e.g. 1-3, 5 or 2"
              value={pdfSplitRange}
              onChange={(e) => setPdfSplitRange(e.target.value)}
              className="w-full mt-1.5 rounded-[5px] border border-neutral-200 bg-white px-3 py-2 text-xs outline-none focus:border-neutral-450 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-neutral-750"
            />
            <p className="text-[9px] text-neutral-500 dark:text-neutral-400 font-medium">Provide page numbers separated by dashes for ranges, or single digits.</p>
          </div>
        );

      case "video-compressor":
        return (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Target Reduction</label>
              <div className="grid grid-cols-3 gap-2 mt-1.5">
                {["50% (Fast)", "70% (Standard)", "90% (Smallest)"].map((s, i) => (
                  <button
                    key={s}
                    className={`rounded-[5px] border py-2 text-[10px] font-bold transition-all ${
                      i === 1 ? "border-neutral-900 bg-neutral-950 text-white dark:border-white dark:bg-white dark:text-black" : "border-neutral-250 bg-white text-neutral-600 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
                    }`}
                    onClick={() => {}}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case "pdf-merge":
        return (
          <div className="space-y-3">
            <div className="flex justify-between items-center text-[10px] font-bold text-neutral-550 dark:text-neutral-400 uppercase tracking-wider">
              <span>Files to merge</span>
              <span>{selectedFiles.length} uploaded</span>
            </div>
            <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between px-3 py-2 rounded-[5px] border border-neutral-150 bg-neutral-50/50 dark:border-neutral-800/60 dark:bg-neutral-900/30 text-[10px]">
                  <span className="font-bold text-neutral-700 dark:text-neutral-350 truncate max-w-[180px]">{file.name}</span>
                  <span className="text-neutral-500 dark:text-neutral-400 font-medium">{formatBytes(file.size)}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".pdf";
                input.multiple = true;
                input.onchange = (e: any) => {
                  if (e.target.files) {
                    setSelectedFiles((prev) => [...prev, ...Array.from(e.target.files as FileList)]);
                  }
                };
                input.click();
              }}
              className="flex items-center justify-center gap-1.5 w-full rounded-[5px] border border-dashed border-neutral-300 py-2.5 text-[10px] font-bold hover:bg-neutral-105 dark:border-neutral-800 dark:hover:bg-neutral-900/60 transition-colors dark:text-neutral-300"
            >
              <Plus className="h-3 w-3" />
              <span>Add more PDF files</span>
            </button>
          </div>
        );

      default:
        return (
          <div className="py-4 text-center">
            <Settings2 className="h-5 w-5 text-neutral-400 dark:text-neutral-500 mx-auto stroke-[1.5] mb-1.5" />
            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium">Standard conversion settings will be applied automatically.</p>
          </div>
        );
    }
  };

  return (
    <DashboardShell>
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Tool Header */}
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[5px] border border-neutral-200/80 bg-white text-neutral-800 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 shadow-sm">
            <IconComponent className="h-5.5 w-5.5 stroke-[1.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">{tool.name}</h1>
              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-neutral-150 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 tracking-wider animate-pulse">
                LOCAL
              </span>
            </div>
            <p className="text-[11px] text-neutral-600 dark:text-neutral-300 mt-1 leading-normal font-medium">
              {tool.description}
            </p>
          </div>
        </div>

        {/* ----------------------------------------------------
            A. RENDERING NON-FILE TOOLS (JSON, Markdown, Palette)
            ---------------------------------------------------- */}
        
        {/* 1. JSON FORMATTER */}
        {toolId === "json-formatter" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Indentation</span>
                <select
                  value={jsonIndentation}
                  onChange={(e) => setJsonIndentation(e.target.value)}
                  className="rounded-[5px] border border-neutral-200 bg-white px-2 py-1 text-[10px] font-bold outline-none dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
                >
                  <option value="2">2 Spaces</option>
                  <option value="4">4 Spaces</option>
                  <option value="tab">Tab</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleJSONProcess("format")}
                  className="rounded-[5px] bg-neutral-955 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-neutral-900 dark:bg-white dark:text-black dark:hover:bg-neutral-100"
                >
                  Format
                </button>
                <button
                  onClick={() => handleJSONProcess("minify")}
                  className="rounded-[5px] border border-neutral-200 bg-white px-3 py-1.5 text-[10px] font-bold hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-350 dark:hover:bg-neutral-800"
                >
                  Minify
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(textInput);
                    alert("JSON copied to clipboard!");
                  }}
                  className="rounded-[5px] border border-neutral-200 bg-white px-2.5 py-1.5 text-[10px] font-bold hover:bg-neutral-50 dark:border-neutral-805 dark:bg-neutral-900 dark:text-neutral-300"
                  title="Copy to Clipboard"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder='Paste raw JSON here... e.g. {"name":"extractly","version":1}'
              className="w-full min-h-[300px] font-mono text-[11px] p-4 rounded-[5px] border border-neutral-200 bg-white dark:border-neutral-850 dark:bg-neutral-900/30 outline-none focus:border-neutral-400 dark:text-neutral-100 dark:focus:border-neutral-700 leading-normal"
            />

            {jsonError && (
              <div className="flex items-center gap-2 rounded-[5px] bg-red-500/5 border border-red-500/10 px-3 py-2 text-[10px] text-red-650 dark:bg-red-500/10">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="font-bold truncate">{jsonError}</span>
              </div>
            )}
          </div>
        )}

        {/* 2. MARKDOWN EDITOR */}
        {toolId === "markdown-previewer" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex rounded-[5px] border border-neutral-200 p-0.5 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900">
                {["edit", "preview", "split"].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMarkdownView(m as any)}
                    className={`rounded px-3 py-1 text-[9px] font-bold uppercase transition-all ${
                      markdownView === m
                        ? "bg-neutral-950 text-white dark:bg-white dark:text-black"
                        : "text-neutral-500 hover:text-neutral-850 dark:text-neutral-400"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(textInput);
                  alert("Markdown copied!");
                }}
                className="rounded-[5px] border border-neutral-200 bg-white px-2.5 py-1 text-[10px] font-bold hover:bg-neutral-50 dark:border-neutral-850 dark:bg-neutral-900 dark:text-neutral-350"
              >
                Copy Code
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(markdownView === "edit" || markdownView === "split") && (
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="# Hello Extractly&#10;&#10;Write markdown code here and see immediate premium rendered HTML preview.&#10;&#10;- Fast client-side renderer&#10;- Sleek layouts"
                  className="w-full min-h-[300px] font-mono text-[11px] p-4 rounded-[5px] border border-neutral-200 bg-white dark:border-neutral-850 dark:bg-neutral-900/30 outline-none focus:border-neutral-400 dark:text-neutral-100 dark:focus:border-neutral-750 leading-relaxed"
                />
              )}
              {(markdownView === "preview" || markdownView === "split") && (
                <div className="w-full min-h-[300px] p-4 rounded-[5px] border border-neutral-200 bg-white dark:border-neutral-855 dark:bg-neutral-900/20 overflow-y-auto text-left prose prose-sm dark:prose-invert max-w-none text-xs dark:text-neutral-150">
                  {textInput ? (
                    <div className="space-y-3">
                      {textInput.split("\n").map((line, idx) => {
                        if (line.startsWith("# ")) return <h1 key={idx} className="text-lg font-bold border-b pb-1 mt-3">{line.replace("# ", "")}</h1>;
                        if (line.startsWith("## ")) return <h2 key={idx} className="text-sm font-bold mt-3">{line.replace("## ", "")}</h2>;
                        if (line.startsWith("- ")) return <li key={idx} className="ml-4 list-disc">{line.replace("- ", "")}</li>;
                        if (line.trim() === "") return <div key={idx} className="h-2" />;
                        return <p key={idx} className="leading-relaxed text-neutral-800 dark:text-neutral-200 font-medium">{line}</p>;
                      })}
                    </div>
                  ) : (
                    <span className="text-neutral-500 dark:text-neutral-400 italic">Rendered HTML output will appear here...</span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. WORD COUNTER */}
        {toolId === "word-counter" && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "WORDS", val: textInput.trim() === "" ? 0 : textInput.trim().split(/\s+/).length },
                { label: "CHARACTERS", val: textInput.length },
                { label: "PARAGRAPHS", val: textInput.trim() === "" ? 0 : textInput.split(/\n\s*\n/).length },
                { label: "READ TIME", val: `${Math.ceil((textInput.trim() === "" ? 0 : textInput.trim().split(/\s+/).length) / 200)}m` }
              ].map((stat, idx) => (
                <div key={idx} className="rounded-[5px] border border-neutral-150 bg-neutral-50/50 p-3 text-center dark:border-neutral-850 dark:bg-neutral-900/40">
                  <div className="text-[9px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">{stat.label}</div>
                  <div className="mt-1 text-base font-extrabold text-neutral-900 dark:text-white">{stat.val}</div>
                </div>
              ))}
            </div>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Paste or write text to analyze metrics..."
              className="w-full min-h-[220px] text-[11px] p-4 rounded-[5px] border border-neutral-200 bg-white dark:border-neutral-850 dark:bg-neutral-900/30 outline-none focus:border-neutral-400 dark:text-neutral-100 dark:focus:border-neutral-750 leading-relaxed"
            />
          </div>
        )}

        {/* 4. PALETTE GENERATOR */}
        {toolId === "color-palette" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Press Spacebar to randomize colors, click locks to pin them.
              </span>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={generatePalette}
                  className="flex-1 sm:flex-initial rounded-[5px] bg-neutral-950 px-4 py-2 text-xs font-bold text-white hover:bg-neutral-900 dark:bg-white dark:text-black dark:hover:bg-neutral-100"
                >
                  Generate Palette
                </button>
                <button
                  onClick={() => {
                    const css = paletteColors.map(c => c.hex).join(", ");
                    navigator.clipboard.writeText(css);
                    alert(`Colors copied: ${css}`);
                  }}
                  className="rounded-[5px] border border-neutral-200 bg-white px-3 py-2 text-xs font-bold hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
                >
                  Copy HEXs
                </button>
              </div>
            </div>

            {/* Colors stack */}
            <div className="grid grid-cols-5 h-[240px] rounded-[5px] overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-sm">
              {paletteColors.map((color, idx) => (
                <div
                  key={idx}
                  style={{ backgroundColor: color.hex }}
                  className="relative group flex flex-col items-center justify-end pb-6 transition-all duration-300"
                >
                  {/* Floating lock/unlock button */}
                  <button
                    onClick={() => toggleLockColor(idx)}
                    className="absolute top-4 opacity-0 group-hover:opacity-100 focus:opacity-100 p-2 rounded-lg bg-white/70 backdrop-blur text-neutral-800 shadow transition-opacity hover:scale-105"
                  >
                    {color.locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                  </button>

                  <span className="px-2 py-1 rounded bg-black/60 text-white font-mono text-[10px] font-bold shadow-sm select-all">
                    {color.hex}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. MEDIA DOWNLOADER */}
        {toolId === "video-downloader" && flowState === "idle" && (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Video URL</label>
              <input
                type="text"
                placeholder="https://www.youtube.com/watch?v=... or TikTok link"
                value={downloaderUrl}
                onChange={(e) => setDownloaderUrl(e.target.value)}
                className="w-full mt-1.5 rounded-[5px] border border-neutral-200 bg-white px-3 py-2.5 text-xs outline-none focus:border-neutral-450 dark:border-neutral-805 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-neutral-750"
              />
            </div>
            
            <button
              onClick={() => {
                if (!downloaderUrl) return alert("Please specify a video URL");
                executeProcess();
              }}
              className="flex items-center justify-center gap-2 w-full rounded-[5px] bg-neutral-950 py-2.5 text-xs font-bold text-white dark:bg-white dark:text-black hover:opacity-90 transition-opacity"
            >
              <Download className="h-4 w-4" />
              <span>Fetch Video Info & Download</span>
            </button>
          </div>
        )}

        {/* 6. AI IMAGE GENERATOR */}
        {toolId === "ai-generator" && flowState === "idle" && (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-neutral-550 dark:text-neutral-400 uppercase tracking-wider">Describe the image</label>
              <textarea
                placeholder="e.g. minimalist logo of an eagle, abstract line art, dark grey palette"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="w-full mt-1.5 min-h-[90px] rounded-[5px] border border-neutral-200 bg-white px-3 py-2 text-xs outline-none focus:border-neutral-450 dark:border-neutral-805 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-neutral-750 leading-relaxed"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-neutral-555 dark:text-neutral-400 uppercase tracking-wider">Visual Rendering Style</label>
              <select
                value={aiStyle}
                onChange={(e) => setAiStyle(e.target.value)}
                className="w-full mt-1.5 rounded-[5px] border border-neutral-200 bg-white px-3 py-2.5 text-xs outline-none dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
              >
                <option value="isometric 3D">Isometric 3D Minimal</option>
                <option value="claymation">Claymation Matte</option>
                <option value="vector stroke">Vector Stroke Graphic</option>
                <option value="photorealistic">Photorealistic Studio Lighting</option>
              </select>
            </div>
            
            <button
              onClick={() => {
                if (!aiPrompt) return alert("Describe the image first");
                executeProcess();
              }}
              className="flex items-center justify-center gap-2 w-full rounded-[5px] bg-neutral-955 py-2.5 text-xs font-bold text-white dark:bg-white dark:text-black hover:opacity-90 transition-opacity animate-pulse"
            >
              <Sparkles className="h-4 w-4 text-violet-500 fill-violet-500" />
              <span>Generate AI Asset</span>
            </button>
          </div>
        )}

        {/* 7. RECORDERS (Mic & Screen Capture) */}
        {(toolId === "screen-recorder" || toolId === "audio-recorder") && flowState === "idle" && (
          <div className="flex flex-col items-center justify-center border border-dashed border-neutral-200 rounded-[5px] p-10 bg-white dark:border-neutral-800 dark:bg-neutral-900/30 min-h-[220px]">
            <div className={`flex h-12 w-12 items-center justify-center rounded-[5px] border mb-4 border-neutral-100 bg-neutral-50 text-neutral-550 dark:border-neutral-800 dark:bg-neutral-800/40 dark:text-neutral-350`}>
              {toolId === "screen-recorder" ? <Video className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
            </div>

            {isRecording ? (
              <div className="space-y-4 text-center w-full max-w-xs">
                <div className="flex items-center justify-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-bold tracking-wider font-mono text-neutral-800 dark:text-neutral-200">
                    RECORDING: {Math.floor(recordDuration / 60)}:{(recordDuration % 60).toString().padStart(2, "0")}
                  </span>
                </div>
                
                {/* Simulated Waveform Visualizer */}
                <div className="flex items-center justify-center gap-1.5 h-8">
                  {Array.from({ length: 15 }).map((_, i) => (
                    <span
                      key={i}
                      style={{ height: `${Math.max(6, Math.sin(recordDuration + i) * 28)}px` }}
                      className="w-1 bg-neutral-950 dark:bg-white rounded-full transition-all duration-300"
                    />
                  ))}
                </div>

                <button
                  onClick={stopRecording}
                  className="rounded-[5px] bg-red-600 hover:bg-red-700 px-6 py-2 text-xs font-bold text-white shadow-sm transition-colors w-full"
                >
                  Stop Recording
                </button>
              </div>
            ) : (
              <div className="text-center">
                <span className="text-xs font-bold text-neutral-850 dark:text-neutral-100">
                  {toolId === "screen-recorder" ? "Ready to record desktop video stream" : "Ready to record voice microphone input"}
                </span>
                <p className="text-[10px] text-neutral-550 dark:text-neutral-350 mt-1 max-w-[280px] font-medium leading-relaxed">
                  All processing occurs local client-side. Make sure to allow system permissions when prompted.
                </p>
                <button
                  onClick={startRecording}
                  className="mt-5 rounded-[5px] bg-neutral-950 px-6 py-2.5 text-xs font-bold text-white hover:bg-neutral-900 dark:bg-white dark:text-black dark:hover:bg-neutral-100 shadow transition-all"
                >
                  Start Recording
                </button>
              </div>
            )}
          </div>
        )}

        {/* ----------------------------------------------------
            B. RENDERING STANDARD FILE-UPLOAD UTILITIES (Idle State)
            ---------------------------------------------------- */}
        
        {flowState === "idle" && 
         !["json-formatter", "markdown-previewer", "word-counter", "color-palette", "video-downloader", "ai-generator", "screen-recorder", "audio-recorder"].includes(toolId) && (
          <UploadZone
            onFilesSelected={handleFilesSelected}
            accept={
              toolId.startsWith("pdf-")
                ? ".pdf"
                : toolId === "audio-extractor" || toolId === "video-compressor"
                ? "video/*"
                : "image/*"
            }
            multiple={toolId === "pdf-merge"}
            descriptionText={`Drag & drop your ${
              toolId.startsWith("pdf-") ? "PDF" : toolId === "audio-extractor" || toolId === "video-compressor" ? "Video" : "Image"
            } files here`}
          />
        )}

        {/* ----------------------------------------------------
            C. RENDERING FILE OPTIONS/CONFIGURING STATE
            ---------------------------------------------------- */}
        
        {flowState === "configuring" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left Options settings Column */}
            <div className="md:col-span-2 space-y-4">
              <div className="rounded-[5px] border border-neutral-200 bg-white p-5 dark:border-neutral-850 dark:bg-neutral-900/30">
                {renderSettingsPanel()}
              </div>
              
              <button
                onClick={executeProcess}
                className="flex items-center justify-center gap-1.5 w-full rounded-[5px] bg-neutral-950 py-3 text-xs font-bold text-white hover:bg-neutral-900 dark:bg-white dark:text-black dark:hover:bg-neutral-100 transition-colors shadow-sm"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Run Process</span>
              </button>
            </div>

            {/* Right Side File Preview Details Column */}
            <div className="space-y-4">
              <div className="rounded-[5px] border border-neutral-200 bg-white p-4 text-left dark:border-neutral-850 dark:bg-neutral-900/40">
                <div className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">Selected Assets</div>
                
                <div className="mt-3 space-y-3">
                  {selectedFiles.slice(0, 3).map((file, idx) => {
                    const PreviewIcon = getIcon(tool.iconName);
                    return (
                      <div key={idx} className="flex items-start gap-2.5 text-[10px]">
                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[5px] bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                          <PreviewIcon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-neutral-800 dark:text-neutral-200 truncate">{file.name}</div>
                          <div className="text-neutral-500 dark:text-neutral-400 mt-0.5 font-semibold">{formatBytes(file.size)}</div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {selectedFiles.length > 3 && (
                    <div className="text-[9px] font-bold text-neutral-500 dark:text-neutral-400 pl-1">
                      + {selectedFiles.length - 3} more files
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-between">
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1 text-[9px] font-bold text-red-500 uppercase tracking-wider hover:opacity-85"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Clear File</span>
                  </button>
                </div>
              </div>
            </div>
            
          </div>
        )}

        {/* ----------------------------------------------------
            D. PROCESSING LOADING ANIMATION STATE
            ---------------------------------------------------- */}
        
        {flowState === "processing" && (
          <ProcessingState
            progress={processingProgress}
            statusText={`Executing ${tool.name}...`}
            subText="Your details are processed locally client-side"
          />
        )}

        {/* ----------------------------------------------------
            E. COMPLETED READY FOR DOWNLOAD STATE
            ---------------------------------------------------- */}
        
        {flowState === "done" && (
          <DownloadState
            fileName={resultFileName}
            fileSize={resultFileSize}
            originalSize={originalFileSize || undefined}
            downloadUrl={resultDownloadUrl}
            onReset={handleReset}
          />
        )}

      </div>
    </DashboardShell>
  );
}
