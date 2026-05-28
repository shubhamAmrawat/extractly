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
  AlertCircle,
  ChevronUp,
  ChevronDown,
  FileText
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
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");
  const [estimatedFileSize, setEstimatedFileSize] = useState<string>("");
  const [estimatedSizeBytes, setEstimatedSizeBytes] = useState<number>(0);

  // PDF Split Settings
  const [pdfSplitRange, setPdfSplitRange] = useState("1");
  const [pdfMergeItems, setPdfMergeItems] = useState<{ id: string; file: File; pageCount: number; selectedPages: number[] }[]>([]);
  const [pdfSplitPages, setPdfSplitPages] = useState<number[]>([]);
  const [pdfSplitTotalPages, setPdfSplitTotalPages] = useState<number>(0);
  const [pdfPagePreviews, setPdfPagePreviews] = useState<Record<string, string>>({});
  const [pdfjsLoaded, setPdfjsLoaded] = useState(false);

  // Video Compressor Settings
  const [videoWidth, setVideoWidth] = useState<number>(0);
  const [videoHeight, setVideoHeight] = useState<number>(0);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [videoPreset, setVideoPreset] = useState<"low" | "medium" | "high">("medium");
  const [videoResolution, setVideoResolution] = useState<"original" | "1080p" | "720p" | "480p">("original");
  const [videoFormat, setVideoFormat] = useState<"mp4" | "webm">("mp4");

  // Recorder states
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [recorderBlob, setRecorderBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const cleanupAudioVisualizer = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioSourceRef.current) {
      audioSourceRef.current.disconnect();
      audioSourceRef.current = null;
    }
    if (audioContextRef.current) {
      if (audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch((err) => console.error("Error closing AudioContext", err));
      }
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  };

  // Load PDF.js dynamically from CDN for client-side rendering of visual page thumbnails
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Only load for PDF merge/split tools to avoid overhead on other pages
      if (!["pdf-merge", "pdf-split"].includes(toolId)) return;

      if ((window as any).pdfjsLib) {
        setPdfjsLoaded(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      script.async = true;
      script.onload = () => {
        const pdfjsLib = (window as any).pdfjsLib;
        if (pdfjsLib) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
          setPdfjsLoaded(true);
        }
      };
      document.body.appendChild(script);
      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    }
  }, [toolId]);

  // Async page thumbnail rendering helper using PDF.js
  const generatePreviewsForFile = async (file: File, fileId: string) => {
    // Retry if script isn't loaded yet
    const pdfjsLib = (window as any).pdfjsLib;
    if (!pdfjsLib) {
      setTimeout(() => generatePreviewsForFile(file, fileId), 300);
      return;
    }

    try {
      const fileUrl = URL.createObjectURL(file);
      const loadingTask = pdfjsLib.getDocument(fileUrl);
      const pdf = await loadingTask.promise;
      const pagesCount = pdf.numPages;

      for (let pageIdx = 0; pageIdx < pagesCount; pageIdx++) {
        const page = await pdf.getPage(pageIdx + 1);
        
        // Thumbnail width target 180px
        const unscaledViewport = page.getViewport({ scale: 1 });
        const scale = 180 / unscaledViewport.width;
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: ctx, viewport }).promise;
        const dataUrl = canvas.toDataURL("image/jpeg", 0.45);

        const key = `${fileId}_${pageIdx}`;
        setPdfPagePreviews((prev) => ({ ...prev, [key]: dataUrl }));
      }
      
      URL.revokeObjectURL(fileUrl);
    } catch (e) {
      console.error("Failed to generate page preview thumbnail", e);
    }
  };

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
      // Reset format & quality defaults per tool
      if (toolId === "image-converter") {
        setImageFormat("webp");
      } else {
        setImageFormat("original");
      }
      setImageQuality(80);
      setEstimatedFileSize("");
      setEstimatedSizeBytes(0);
      // Reset Video defaults
      setVideoWidth(0);
      setVideoHeight(0);
      setVideoDuration(0);
      setVideoPreset("medium");
      setVideoResolution("original");
      setVideoFormat("mp4");
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

  // Audio Visualizer unmount cleanup
  useEffect(() => {
    return () => {
      cleanupAudioVisualizer();
    };
  }, []);

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
    if (["image-resizer", "image-converter"].includes(toolId) && files[0]) {
      const img = new Image();
      const objectUrl = URL.createObjectURL(files[0]);
      img.src = objectUrl;
      img.onload = () => {
        setImageWidth(img.width);
        setImageHeight(img.height);
        setAspectRatioValue(img.width / img.height);
      };
      setImagePreviewUrl(objectUrl);
      setOriginalFileSize(formatBytes(files[0].size));
    } else if (toolId === "video-compressor" && files[0]) {
      const video = document.createElement("video");
      const objectUrl = URL.createObjectURL(files[0]);
      video.src = objectUrl;
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        setVideoWidth(video.videoWidth);
        setVideoHeight(video.videoHeight);
        setVideoDuration(video.duration);
      };
      setImagePreviewUrl(objectUrl);
      setOriginalFileSize(formatBytes(files[0].size));
    } else if (toolId === "pdf-merge") {
      const processMergeFiles = async () => {
        const items = [];
        for (const file of files) {
          try {
            const fileBytes = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(fileBytes);
            const pageCount = pdfDoc.getPageCount();
            const itemId = Math.random().toString(36).substr(2, 9);
            items.push({
              id: itemId,
              file,
              pageCount,
              selectedPages: Array.from({ length: pageCount }, (_, i) => i)
            });
            generatePreviewsForFile(file, itemId);
          } catch (e) {
            console.error("Failed to load PDF metadata for merge", e);
          }
        }
        setPdfMergeItems(items);
      };
      processMergeFiles();
      if (files[0]) setOriginalFileSize(formatBytes(files[0].size));
    } else if (toolId === "pdf-split" && files[0]) {
      const processSplitFile = async () => {
        try {
          const fileBytes = await files[0].arrayBuffer();
          const pdfDoc = await PDFDocument.load(fileBytes);
          const pageCount = pdfDoc.getPageCount();
          setPdfSplitTotalPages(pageCount);
          setPdfSplitPages([0]); // Default to first page
          setPdfSplitRange("1");
          generatePreviewsForFile(files[0], "split");
        } catch (e) {
          console.error("Failed to load PDF metadata for split", e);
        }
      };
      processSplitFile();
      setOriginalFileSize(formatBytes(files[0].size));
    } else if (files[0]) {
      setOriginalFileSize(formatBytes(files[0].size));
    }
    
    setFlowState("configuring");
  };

  // Add more files to PDF merge
  const handleAddMergeFiles = async (files: File[]) => {
    setSelectedFiles((prev) => [...prev, ...files]);
    
    const newItems: { id: string; file: File; pageCount: number; selectedPages: number[] }[] = [];
    for (const file of files) {
      try {
        const fileBytes = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(fileBytes);
        const pageCount = pdfDoc.getPageCount();
        const itemId = Math.random().toString(36).substr(2, 9);
        newItems.push({
          id: itemId,
          file,
          pageCount,
          selectedPages: Array.from({ length: pageCount }, (_, i) => i)
        });
        generatePreviewsForFile(file, itemId);
      } catch (e) {
        console.error("Failed to load PDF metadata for merge", e);
      }
    }
    setPdfMergeItems((prev) => [...prev, ...newItems]);
  };

  // PDF Merge Workspace Handlers
  const moveMergeItem = (index: number, direction: number) => {
    const nextItems = [...pdfMergeItems];
    const targetIndex = index + direction;
    if (targetIndex >= 0 && targetIndex < nextItems.length) {
      const [moved] = nextItems.splice(index, 1);
      nextItems.splice(targetIndex, 0, moved);
      setPdfMergeItems(nextItems);
      // Keep selectedFiles array synced to match the processing loop
      setSelectedFiles(nextItems.map(item => item.file));
    }
  };

  const removeMergeItem = (id: string) => {
    const nextItems = pdfMergeItems.filter(item => item.id !== id);
    setPdfMergeItems(nextItems);
    setSelectedFiles(nextItems.map(item => item.file));
    if (nextItems.length === 0) {
      handleReset();
    }
  };

  const toggleMergePageSelection = (itemId: string, pageIdx: number) => {
    setPdfMergeItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const pages = item.selectedPages.includes(pageIdx)
        ? item.selectedPages.filter(p => p !== pageIdx)
        : [...item.selectedPages, pageIdx].sort((a, b) => a - b);
      return { ...item, selectedPages: pages };
    }));
  };

  const selectAllPagesForItem = (itemId: string, selectAll: boolean) => {
    setPdfMergeItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      return {
        ...item,
        selectedPages: selectAll ? Array.from({ length: item.pageCount }, (_, i) => i) : []
      };
    }));
  };

  // PDF Split Workspace Handlers
  const toggleSplitPageSelection = (pageIdx: number) => {
    let nextPages: number[];
    if (pdfSplitPages.includes(pageIdx)) {
      nextPages = pdfSplitPages.filter(p => p !== pageIdx);
    } else {
      nextPages = [...pdfSplitPages, pageIdx].sort((a, b) => a - b);
    }
    setPdfSplitPages(nextPages);
    setPdfSplitRange(stringifyRangeArray(nextPages));
  };

  const selectAllSplitPages = (type: "all" | "even" | "odd" | "none") => {
    let nextPages: number[] = [];
    if (type === "all") {
      nextPages = Array.from({ length: pdfSplitTotalPages }, (_, i) => i);
    } else if (type === "even") {
      nextPages = Array.from({ length: pdfSplitTotalPages }, (_, i) => i).filter(i => i % 2 !== 0);
    } else if (type === "odd") {
      nextPages = Array.from({ length: pdfSplitTotalPages }, (_, i) => i).filter(i => i % 2 === 0);
    }
    setPdfSplitPages(nextPages);
    setPdfSplitRange(stringifyRangeArray(nextPages));
  };

  const handleSplitRangeInputChange = (val: string) => {
    setPdfSplitRange(val);
    const parsed = parseRangeString(val, pdfSplitTotalPages);
    setPdfSplitPages(parsed);
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

  // Helper to parse PDF page range string (e.g. "1-3, 5") to list of 0-indexed page numbers
  const parseRangeString = (str: string, maxPages: number): number[] => {
    const pages = new Set<number>();
    const parts = str.split(",");
    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      if (trimmed.includes("-")) {
        const [startStr, endStr] = trimmed.split("-");
        const start = parseInt(startStr.trim());
        const end = parseInt(endStr.trim());
        if (!isNaN(start) && !isNaN(end)) {
          const s = Math.max(1, Math.min(start, end));
          const e = Math.min(maxPages, Math.max(start, end));
          for (let i = s; i <= e; i++) {
            pages.add(i - 1);
          }
        }
      } else {
        const page = parseInt(trimmed);
        if (!isNaN(page) && page >= 1 && page <= maxPages) {
          pages.add(page - 1);
        }
      }
    }
    return Array.from(pages).sort((a, b) => a - b);
  };

  // Helper to stringify list of 0-indexed page numbers to standard range format (e.g. "1-3, 5")
  const stringifyRangeArray = (pages: number[]): string => {
    if (pages.length === 0) return "";
    const sorted = [...pages].sort((a, b) => a - b).map(p => p + 1);
    const ranges: string[] = [];
    let start = sorted[0];
    let prev = sorted[0];
    
    for (let i = 1; i <= sorted.length; i++) {
      const curr = sorted[i];
      if (curr === prev + 1) {
        prev = curr;
      } else {
        if (start === prev) {
          ranges.push(`${start}`);
        } else {
          ranges.push(`${start}-${prev}`);
        }
        start = curr;
        prev = curr;
      }
    }
    return ranges.join(", ");
  };

  // RESET
  const handleReset = () => {
    cleanupAudioVisualizer();
    setSelectedFiles([]);
    setProcessingProgress(0);
    setFlowState("idle");
    setResultDownloadUrl("");
    setRecorderBlob(null);
    setRecordDuration(0);
    setJsonError(null);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl("");
    }
    setEstimatedFileSize("");
    setEstimatedSizeBytes(0);
    setVideoWidth(0);
    setVideoHeight(0);
    setVideoDuration(0);
    setVideoPreset("medium");
    setVideoResolution("original");
    setVideoFormat("mp4");
    setPdfSplitRange("1");
    setPdfMergeItems([]);
    setPdfSplitPages([]);
    setPdfSplitTotalPages(0);
  };

  // Real-time canvas estimation of resized image file size
  useEffect(() => {
    if (!["image-resizer", "image-converter"].includes(toolId) || selectedFiles.length === 0 || !selectedFiles[0]) {
      setEstimatedFileSize("");
      return;
    }

    const file = selectedFiles[0];
    const width = imageWidth;
    const height = imageHeight;
    const quality = imageQuality;
    
    // Find original format (jpeg/png/webp)
    const getOriginalFormat = (f: File) => {
      const t = f.type.toLowerCase();
      if (t.includes("jpeg") || t.includes("jpg")) return "jpeg";
      if (t.includes("png")) return "png";
      if (t.includes("webp")) return "webp";
      if (t.includes("gif")) return "gif";
      return "png";
    };
    const origFormat = getOriginalFormat(file);
    const targetFormat = imageFormat === "original" ? origFormat : imageFormat;
    const format = targetFormat === "jpeg" || targetFormat === "jpg" ? "jpeg" : targetFormat;

    if (!width || !height) return;

    const timer = setTimeout(() => {
      const img = new Image();
      img.src = imagePreviewUrl || URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const mime = `image/${format === "jpg" || format === "jpeg" ? "jpeg" : format}`;
        canvas.toBlob((b) => {
          if (b) {
            setEstimatedFileSize(formatBytes(b.size));
            setEstimatedSizeBytes(b.size);
          }
        }, mime, format === "png" ? 1 : quality / 100);
      };
    }, 250); // 250ms debounce to avoid CPU throttling on keyboard typing

    return () => clearTimeout(timer);
  }, [imageWidth, imageHeight, imageQuality, imageFormat, selectedFiles, toolId, imagePreviewUrl]);

  // Real-time video compression estimation of file size
  useEffect(() => {
    if (toolId !== "video-compressor" || selectedFiles.length === 0 || !selectedFiles[0]) {
      return;
    }

    const file = selectedFiles[0];
    let presetFactor = 0.6; // medium
    if (videoPreset === "low") presetFactor = 0.35;
    if (videoPreset === "high") presetFactor = 0.8;

    let resFactor = 1.0;
    if (videoResolution === "720p") resFactor = 0.6;
    if (videoResolution === "480p") resFactor = 0.35;

    const estimatedBytes = Math.round(file.size * presetFactor * resFactor);
    setEstimatedSizeBytes(estimatedBytes);
    setEstimatedFileSize(formatBytes(estimatedBytes));
  }, [videoPreset, videoResolution, selectedFiles, toolId]);

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
        
        cleanupAudioVisualizer();

        // Set values for download card
        setResultFileName(`extractly_${toolId}-${Date.now()}.${toolId === "screen-recorder" ? "webm" : "webm"}`);
        setResultFileSize(formatBytes(blob.size));
        setResultDownloadUrl(URL.createObjectURL(blob));
        setFlowState("done");
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Start the reactive Web Audio API visualizer if audio tracks exist
      if (stream.getAudioTracks().length > 0) {
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          const audioCtx = new AudioContextClass();
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          
          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);
          
          audioContextRef.current = audioCtx;
          analyserRef.current = analyser;
          audioSourceRef.current = source;
          
          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          
          const draw = () => {
            if (!analyserRef.current) return;
            animationFrameRef.current = requestAnimationFrame(draw);
            
            analyserRef.current.getByteFrequencyData(dataArray);
            const bars = document.querySelectorAll(".audio-visualizer-bar");
            if (bars.length > 0) {
              for (let i = 0; i < bars.length; i++) {
                const idx = Math.min(Math.floor(i * 1.5), bufferLength - 1);
                const val = dataArray[idx] || 0;
                // Scale value nicely from 6px to 32px height
                const height = Math.max(6, 6 + (val / 255) * 26);
                (bars[i] as HTMLElement).style.height = `${height}px`;
              }
            }
          };
          
          draw();
        } catch (err) {
          console.error("Audio visualizer setup failed", err);
        }
      }
    } catch (e) {
      alert("Permission denied or capture interface unavailable.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    cleanupAudioVisualizer();
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
        for (const item of pdfMergeItems) {
          if (item.selectedPages.length === 0) continue;
          const fileBytes = await item.file.arrayBuffer();
          const pdf = await PDFDocument.load(fileBytes);
          const pages = await mergedPdf.copyPages(pdf, item.selectedPages);
          pages.forEach((p) => mergedPdf.addPage(p));
        }
        setProcessingProgress(80);
        const mergedBytes = await mergedPdf.save();
        const blob = new Blob([mergedBytes as any], { type: "application/pdf" });
        
        setResultFileName(`extractly_Merged_Document_${Date.now()}.pdf`);
        setResultFileSize(formatBytes(blob.size));
        setResultDownloadUrl(URL.createObjectURL(blob));

      // 2. PDF SPLIT
      } else if (toolId === "pdf-split") {
        await incrementProgress(40, 60);
        const file = selectedFiles[0];
        const fileBytes = await file.arrayBuffer();
        const pdf = await PDFDocument.load(fileBytes);
        const splitPdf = await PDFDocument.create();
        
        if (pdfSplitPages.length === 0) {
          throw new Error("No pages selected for extraction");
        }

        const copiedPages = await splitPdf.copyPages(pdf, pdfSplitPages);
        copiedPages.forEach((p) => splitPdf.addPage(p));
        
        setProcessingProgress(80);
        const splitBytes = await splitPdf.save();
        const blob = new Blob([splitBytes as any], { type: "application/pdf" });
        
        setResultFileName(`extractly_Split_${file.name}`);
        setResultFileSize(formatBytes(blob.size));
        setResultDownloadUrl(URL.createObjectURL(blob));

      // 3. IMAGE CONVERTER / RESIZER
      } else if (["image-converter", "image-resizer"].includes(toolId)) {
        await incrementProgress(50, 40);
        const file = selectedFiles[0];
        
        // Find original format (jpeg/png/webp)
        const getOriginalFormat = (f: File) => {
          const t = f.type.toLowerCase();
          if (t.includes("jpeg") || t.includes("jpg")) return "jpeg";
          if (t.includes("png")) return "png";
          if (t.includes("webp")) return "webp";
          if (t.includes("gif")) return "gif";
          return "png";
        };
        const origFormat = getOriginalFormat(file);
        
        // Format mapping
        const targetFormat = imageFormat === "original" ? origFormat : imageFormat;
        const format = targetFormat === "jpeg" || targetFormat === "jpg" ? "jpeg" : targetFormat;
        const quality = format === "png" ? 100 : imageQuality; // Use state directly if lossy
        
        const blob = await new Promise<Blob>((resolve, reject) => {
          const img = new Image();
          img.src = imagePreviewUrl || URL.createObjectURL(file);
          img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx) return reject("Canvas failed");

            const w = imageWidth || img.width;
            const h = imageHeight || img.height;
            canvas.width = w;
            canvas.height = h;
            
            ctx.drawImage(img, 0, 0, w, h);
            
            const mime = `image/${format === "jpg" || format === "jpeg" ? "jpeg" : format}`;
            canvas.toBlob((b) => {
              if (b) resolve(b);
              else reject("Blob conversion failed");
            }, mime, quality / 100);
          };
          img.onerror = () => reject("Image load error");
        });

        const extension = format === "jpeg" ? "jpg" : format;
        const baseName = file.name.substring(0, file.name.lastIndexOf("."));
        setResultFileName(`extractly_${baseName}_processed.${extension}`);
        setResultFileSize(formatBytes(blob.size));
        setResultDownloadUrl(URL.createObjectURL(blob));

      // 4. MOCK / SIMULATED HIGH-FIDELITY UTILITIES
      } else {
        await incrementProgress(70, 70);
        // Create a dummy text file / placeholder download blob
        const mockContent = `Processed asset output by Extractly utility suite on ${new Date().toISOString()}`;
        const blob = new Blob([mockContent], { type: "text/plain" });
        
        let outName = "extractly_processed_output.txt";
        let outSize = "1.2 MB";
        
        if (toolId === "video-downloader") {
          outName = "extractly_media_download_1080p.mp4";
          outSize = "24.5 MB";
        } else if (toolId === "video-compressor") {
          outName = `extractly_compressed_${selectedFiles[0]?.name || "video.mp4"}`;
          outSize = formatBytes((selectedFiles[0]?.size || 50000000) * 0.45);
        } else if (toolId === "ai-generator") {
          outName = `extractly_${aiPrompt.replace(/\s+/g, "_").slice(0, 15)}_ai.png`;
          outSize = "890 KB";
        } else if (toolId === "audio-extractor") {
          const baseName = selectedFiles[0]?.name.substring(0, selectedFiles[0]?.name.lastIndexOf(".")) || "audio";
          outName = `extractly_${baseName}.mp3`;
          outSize = formatBytes((selectedFiles[0]?.size || 10000000) * 0.15);
        } else if (toolId === "pdf-to-text") {
          outName = `extractly_${selectedFiles[0]?.name.replace(".pdf", "")}_extracted.txt`;
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
            <label className="flex items-center gap-2 cursor-pointer py-1">
              <input
                type="checkbox"
                checked={maintainAspect}
                onChange={(e) => setMaintainAspect(e.target.checked)}
                className="rounded-[5px] border-neutral-350 dark:border-neutral-800 text-neutral-950 focus:ring-0"
              />
              <span className="text-[10px] text-neutral-600 dark:text-neutral-300 font-bold uppercase tracking-wider">Maintain Aspect Ratio</span>
            </label>
            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800/80">
              <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Output Format</label>
              <div className="flex gap-2 mt-1.5">
                {["original", "webp", "jpg", "png"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setImageFormat(f)}
                    className={`flex-1 rounded-[5px] border py-1.5 text-[10px] font-bold uppercase transition-colors ${
                      imageFormat === f
                        ? "border-neutral-900 bg-neutral-950 text-white dark:border-neutral-200 dark:bg-white dark:text-black"
                        : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800/50"
                    }`}
                  >
                    {f === "original" ? "Source" : f}
                  </button>
                ))}
              </div>
            </div>
            {(() => {
              const file = selectedFiles[0];
              const isPng = imageFormat === "png" || (imageFormat === "original" && file && (file.type.includes("png") || file.name.endsWith(".png")));
              
              return (
                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800/80">
                  <div className="flex justify-between items-center text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    <span>Resizing Quality</span>
                    <span>{isPng ? "100% (Lossless)" : `${imageQuality}%`}</span>
                  </div>
                  
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={imageQuality}
                    disabled={isPng}
                    onChange={(e) => setImageQuality(parseInt(e.target.value))}
                    className={`w-full mt-2 h-1 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-neutral-950 dark:accent-white ${isPng ? "opacity-50 cursor-not-allowed" : ""}`}
                  />
                  
                  {isPng ? (
                    <div className="mt-2 flex items-start gap-1.5 rounded-[5px] bg-amber-500/5 border border-amber-500/10 px-2.5 py-2 text-[8px] text-amber-600 dark:text-amber-400 leading-normal font-semibold">
                      <AlertCircle className="h-3 w-3 flex-shrink-0 mt-0.5 text-amber-500" />
                      <span>PNG is a lossless format. Select WebP or JPG output format to enable quality adjustments and reduce file size.</span>
                    </div>
                  ) : (
                    <p className="text-[8px] text-neutral-500 dark:text-neutral-450 mt-1.5 font-medium leading-normal">
                      Controls output image compression. Quality below 100% yields significantly smaller file size with WebP/JPG.
                    </p>
                  )}
                </div>
              );
            })()}
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
              onChange={(e) => handleSplitRangeInputChange(e.target.value)}
              className="w-full mt-1.5 rounded-[5px] border border-neutral-200 bg-white px-3 py-2 text-xs outline-none focus:border-neutral-450 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-neutral-750"
            />
            <p className="text-[9px] text-neutral-500 dark:text-neutral-400 font-medium">Provide page numbers separated by dashes for ranges, or single digits.</p>
          </div>
        );

      case "video-compressor":
        return (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Compression Preset</label>
              <div className="flex gap-2 mt-1.5">
                {["low", "medium", "high"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setVideoPreset(p as any)}
                    className={`flex-1 rounded-[5px] border py-2 text-xs font-bold uppercase transition-colors ${
                      videoPreset === p
                        ? "border-neutral-900 bg-neutral-950 text-white dark:border-neutral-200 dark:bg-white dark:text-black"
                        : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800/50"
                    }`}
                  >
                    {p === "low" ? "Small Size" : p === "medium" ? "Medium" : "Best Quality"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Target Resolution</label>
              <div className="flex gap-2 mt-1.5">
                {["original", "1080p", "720p", "480p"].map((r) => (
                  <button
                    key={r}
                    onClick={() => setVideoResolution(r as any)}
                    className={`flex-1 rounded-[5px] border py-2 text-[10px] font-bold uppercase transition-colors ${
                      videoResolution === r
                        ? "border-neutral-900 bg-neutral-950 text-white dark:border-neutral-200 dark:bg-white dark:text-black"
                        : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800/50"
                    }`}
                  >
                    {r === "original" ? "Source" : r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Output Video Format</label>
              <div className="flex gap-2 mt-1.5">
                {["mp4", "webm"].map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setVideoFormat(fmt as any)}
                    className={`flex-1 rounded-[5px] border py-2 text-xs font-bold uppercase transition-colors ${
                      videoFormat === fmt
                        ? "border-neutral-900 bg-neutral-950 text-white dark:border-neutral-200 dark:bg-white dark:text-black"
                        : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800/50"
                    }`}
                  >
                    {fmt}
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
              <span>Merge Sequence Overview</span>
              <span>{pdfMergeItems.length} Files</span>
            </div>
            <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
              {pdfMergeItems.map((item, idx) => (
                <div key={item.id} className="flex flex-col gap-0.5 px-3 py-2 rounded-[5px] border border-neutral-150 bg-neutral-50/55 dark:border-neutral-800/60 dark:bg-neutral-900/30 text-[10px]">
                  <div className="flex items-center justify-between font-bold text-neutral-700 dark:text-neutral-350">
                    <span className="truncate max-w-[160px]">{item.file.name}</span>
                    <span>#{idx + 1}</span>
                  </div>
                  <span className="text-[8px] text-neutral-450 dark:text-neutral-500 font-semibold uppercase tracking-wider">
                    {item.selectedPages.length === 0 
                      ? "Skipped (no pages selected)" 
                      : `Includes ${item.selectedPages.length} / ${item.pageCount} pages`}
                  </span>
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
                    handleAddMergeFiles(Array.from(e.target.files as FileList));
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

  const renderMediaWorkspace = () => {
    return (
      <div className="rounded-[5px] border border-neutral-200 bg-white dark:border-neutral-850 dark:bg-neutral-900/30 overflow-hidden shadow-sm flex flex-col">
        {/* Header/HUD area */}
        <div className="border-b border-neutral-100 dark:border-neutral-800/80 px-4 py-3 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between">
          <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">
            {toolId === "video-compressor" ? "Video Preview & Metrics" : "Image Preview & Metrics"}
          </span>
          <div className="flex gap-2.5">
            <span className="text-[9px] font-semibold text-neutral-500 dark:text-neutral-400">
              Original: <span className="font-bold text-neutral-800 dark:text-neutral-200">
                {toolId === "video-compressor" 
                  ? `${videoWidth > 0 ? `${videoWidth}x${videoHeight} • ` : ""}${videoDuration > 0 ? `${Math.round(videoDuration)}s • ` : ""}${selectedFiles[0] ? formatBytes(selectedFiles[0].size) : ""}`
                  : `${imageWidth}x${imageHeight} (${selectedFiles[0] ? formatBytes(selectedFiles[0].size) : ""})`}
              </span>
            </span>
            {estimatedFileSize && (
              <span className="text-[9px] font-semibold text-violet-550 dark:text-violet-400">
                Est. Output: <span className="font-bold">
                  {toolId === "video-compressor"
                    ? `${videoResolution === "original" ? (videoWidth > 0 ? `${videoWidth}x${videoHeight}` : "Source") : videoResolution} (${estimatedFileSize})`
                    : `${imageWidth}x${imageHeight} (${estimatedFileSize})`}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Checkerboard media container */}
        <div className="relative p-6 flex items-center justify-center min-h-[320px] max-h-[440px] overflow-hidden bg-neutral-50 dark:bg-neutral-955/30 select-none">
          {/* Checkerboard Pattern background */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]" 
               style={{ 
                 backgroundImage: "radial-gradient(#000 20%, transparent 20%), radial-gradient(#000 20%, transparent 20%)",
                 backgroundPosition: "0 0, 10px 10px",
                 backgroundSize: "20px 20px" 
               }} 
          />
          
          {imagePreviewUrl ? (
            <div className="relative group z-10 max-h-[380px] max-w-full flex items-center justify-center w-full">
              {toolId === "video-compressor" ? (
                <video 
                  src={imagePreviewUrl} 
                  controls
                  className="max-h-[360px] max-w-full rounded border border-neutral-200/50 dark:border-neutral-800/40 shadow-md transition-all duration-300"
                />
              ) : (
                <img 
                  src={imagePreviewUrl} 
                  alt="Workspace Preview" 
                  className="max-h-[360px] max-w-full object-contain rounded border border-neutral-200/50 dark:border-neutral-800/40 shadow-md transition-all duration-300 hover:scale-[1.01]"
                />
              )}
              
              {/* Overlay Resolution Tag */}
              {toolId === "video-compressor" ? (
                videoWidth > 0 && videoHeight > 0 && (
                  <div className="absolute bottom-2 right-2 bg-neutral-900/80 backdrop-blur text-white px-2 py-0.5 rounded text-[8px] font-mono font-bold tracking-wider select-none shadow z-20">
                    {videoWidth} × {videoHeight} PX ({videoDuration > 0 ? `${Math.round(videoDuration)}S` : ""})
                  </div>
                )
              ) : (
                imageWidth > 0 && imageHeight > 0 && (
                  <div className="absolute bottom-2 right-2 bg-neutral-900/80 backdrop-blur text-white px-2 py-0.5 rounded text-[8px] font-mono font-bold tracking-wider select-none shadow">
                    {imageWidth} × {imageHeight} PX
                  </div>
                )
              )}
            </div>
          ) : (
            <span className="text-[10px] text-neutral-400 italic">No media preview available</span>
          )}
        </div>

        {/* Size savings footer banner */}
        {estimatedFileSize && selectedFiles[0] && (
          <div className="border-t border-neutral-100 dark:border-neutral-800/80 px-4 py-2.5 bg-neutral-50/30 dark:bg-neutral-900/20 flex items-center justify-between text-[10px]">
            <span className="text-neutral-550 dark:text-neutral-400 font-medium">Estimated storage savings</span>
            {(() => {
              const origSize = selectedFiles[0].size;
              const savings = ((origSize - estimatedSizeBytes) / origSize) * 100;
              if (savings > 0) {
                return (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/5 dark:bg-emerald-500/10 px-2 py-0.5 rounded">
                    Saves ~{Math.round(savings)}% ({formatBytes(origSize - estimatedSizeBytes)})
                  </span>
                );
              } else if (savings < 0) {
                return (
                  <span className="text-amber-600 dark:text-amber-555 font-bold bg-amber-500/5 dark:bg-amber-500/10 px-2 py-0.5 rounded">
                    Increases size by ~{Math.round(Math.abs(savings))}%
                  </span>
                );
              }
              return <span className="text-neutral-555 dark:text-neutral-350 font-bold bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">No change</span>;
            })()}
          </div>
        )}
      </div>
    );
  };

  const renderPdfWorkspace = () => {
    if (toolId === "pdf-merge") {
      return (
        <div className="rounded-[5px] border border-neutral-200 bg-white dark:border-neutral-850 dark:bg-neutral-900/30 overflow-hidden shadow-sm flex flex-col">
          <div className="border-b border-neutral-100 dark:border-neutral-800/80 px-4 py-3 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between">
            <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">
              Merge Workspace (Reorder & Pages selection)
            </span>
            <span className="text-[9px] font-semibold text-neutral-500 dark:text-neutral-400">
              Total Files: <span className="font-bold text-neutral-800 dark:text-neutral-200">{pdfMergeItems.length}</span>
            </span>
          </div>

          <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto bg-neutral-50/30 dark:bg-neutral-950/20">
            {pdfMergeItems.length === 0 ? (
              <div className="text-center py-8 text-neutral-450 dark:text-neutral-550 text-[11px] italic">
                No files uploaded.
              </div>
            ) : (
              pdfMergeItems.map((item, idx) => (
                <div key={item.id} className="rounded-[5px] border border-neutral-200 dark:border-neutral-800/60 bg-white dark:bg-neutral-900 p-3 shadow-sm flex flex-col gap-2.5 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => moveMergeItem(idx, -1)}
                        disabled={idx === 0}
                        className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-850 dark:text-neutral-450 dark:hover:text-neutral-200 disabled:opacity-30 disabled:pointer-events-none"
                        title="Move Up"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveMergeItem(idx, 1)}
                        disabled={idx === pdfMergeItems.length - 1}
                        className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-850 dark:text-neutral-450 dark:hover:text-neutral-200 disabled:opacity-30 disabled:pointer-events-none"
                        title="Move Down"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                      
                      <div className="flex items-center gap-1.5 ml-1">
                        <FileText className="h-3.5 w-3.5 text-neutral-400" />
                        <span className="text-[10px] font-bold text-neutral-800 dark:text-neutral-200 truncate max-w-[240px] md:max-w-[340px]" title={item.file.name}>
                          {item.file.name}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-semibold text-neutral-400 dark:text-neutral-500">
                        {formatBytes(item.file.size)} • {item.pageCount} Pages
                      </span>
                      <button
                        type="button"
                        onClick={() => removeMergeItem(item.id)}
                        className="p-1 text-red-500 hover:bg-red-500/5 rounded hover:text-red-600 dark:hover:bg-red-550/10 transition-colors"
                        title="Remove File"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-neutral-100 dark:border-neutral-800/80 pt-2">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[8px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                        Select pages to merge:
                      </span>
                      <div className="flex gap-2 text-[8px] font-bold">
                        <button
                          type="button"
                          onClick={() => selectAllPagesForItem(item.id, true)}
                          className="text-violet-600 hover:underline dark:text-violet-400 font-semibold"
                        >
                          All
                        </button>
                        <span className="text-neutral-300 dark:text-neutral-700">|</span>
                        <button
                          type="button"
                          onClick={() => selectAllPagesForItem(item.id, false)}
                          className="text-neutral-500 hover:underline dark:text-neutral-455 font-semibold"
                        >
                          None
                        </button>
                      </div>
                    </div>

                    <div className="flex overflow-x-auto gap-2.5 py-2 px-0.5 scrollbar-thin max-w-full">
                      {Array.from({ length: item.pageCount }).map((_, pageIdx) => {
                        const isSelected = item.selectedPages.includes(pageIdx);
                        const previewKey = `${item.id}_${pageIdx}`;
                        return (
                          <button
                            key={pageIdx}
                            type="button"
                            onClick={() => toggleMergePageSelection(item.id, pageIdx)}
                            className={`group relative flex flex-col items-center justify-between p-1.5 pb-1 rounded border aspect-[3/4] h-24 w-18 flex-shrink-0 transition-all duration-200 select-none shadow-sm hover:shadow-md hover:border-neutral-400 dark:hover:border-neutral-600 ${
                              isSelected
                                ? "border-neutral-900 bg-neutral-955/5 dark:border-neutral-200 dark:bg-white/5"
                                : "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
                            }`}
                          >
                            <div className={`absolute top-1 right-1 h-3 w-3 rounded border flex items-center justify-center transition-colors z-10 ${
                              isSelected 
                                ? "bg-neutral-950 border-neutral-950 text-white dark:bg-white dark:border-white dark:text-black" 
                                : "border-neutral-300 bg-white dark:border-neutral-700 dark:bg-neutral-900"
                            }`}>
                              {isSelected && <Check className="h-1.5 w-1.5 stroke-[3]" />}
                            </div>

                            {/* Page preview or skeleton */}
                            <div className="flex-1 w-full flex items-center justify-center overflow-hidden rounded bg-neutral-50 dark:bg-neutral-950 mb-1 border border-neutral-100 dark:border-neutral-800/60">
                              {pdfPagePreviews[previewKey] ? (
                                <img
                                  src={pdfPagePreviews[previewKey]}
                                  alt={`Page ${pageIdx + 1}`}
                                  className="w-full h-full object-contain transition-transform duration-350 group-hover:scale-105"
                                />
                              ) : (
                                <div className="flex flex-col items-center justify-center animate-pulse">
                                  <FileText className="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                                </div>
                              )}
                            </div>

                            <span className={`text-[8px] font-bold ${isSelected ? "text-neutral-900 dark:text-white" : "text-neutral-600 dark:text-neutral-400"}`}>
                              P. {pageIdx + 1}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {item.selectedPages.length === 0 && (
                      <div className="mt-1 text-[8px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        <span>No pages selected from this file (will be skipped).</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }

    if (toolId === "pdf-split") {
      return (
        <div className="rounded-[5px] border border-neutral-200 bg-white dark:border-neutral-850 dark:bg-neutral-900/30 overflow-hidden shadow-sm flex flex-col">
          <div className="border-b border-neutral-100 dark:border-neutral-800/80 px-4 py-3 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between">
            <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">
              Split Workspace (Select pages visually)
            </span>
            <div className="flex gap-2.5">
              <span className="text-[9px] font-semibold text-neutral-500 dark:text-neutral-400">
                Total Pages: <span className="font-bold text-neutral-800 dark:text-neutral-200">{pdfSplitTotalPages}</span>
              </span>
              <span className="text-[9px] font-semibold text-violet-550 dark:text-violet-400">
                Selected: <span className="font-bold">{pdfSplitPages.length} pages</span>
              </span>
            </div>
          </div>

          <div className="p-4 space-y-4 bg-neutral-50/30 dark:bg-neutral-955/20">
            <div className="flex flex-wrap gap-2 justify-between items-center bg-white dark:bg-neutral-900 p-2.5 rounded-[5px] border border-neutral-150 dark:border-neutral-800/60 shadow-sm">
              <span className="text-[9px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Quick Selection:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => selectAllSplitPages("all")}
                  className="px-2.5 py-1 border border-neutral-200 dark:border-neutral-800 rounded bg-white hover:bg-neutral-50 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-[9px] font-bold transition-all dark:text-neutral-300 shadow-sm"
                >
                  All Pages
                </button>
                <button
                  type="button"
                  onClick={() => selectAllSplitPages("even")}
                  className="px-2.5 py-1 border border-neutral-200 dark:border-neutral-800 rounded bg-white hover:bg-neutral-50 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-[9px] font-bold transition-all dark:text-neutral-300 shadow-sm"
                >
                  Even Pages
                </button>
                <button
                  type="button"
                  onClick={() => selectAllSplitPages("odd")}
                  className="px-2.5 py-1 border border-neutral-200 dark:border-neutral-800 rounded bg-white hover:bg-neutral-50 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-[9px] font-bold transition-all dark:text-neutral-300 shadow-sm"
                >
                  Odd Pages
                </button>
                <button
                  type="button"
                  onClick={() => selectAllSplitPages("none")}
                  className="px-2.5 py-1 border border-red-200/40 hover:bg-red-500/5 rounded text-red-550 text-[9px] font-bold transition-all"
                >
                  Clear Selection
                </button>
              </div>
            </div>

            {pdfSplitTotalPages === 0 ? (
              <div className="text-center py-8 text-neutral-450 dark:text-neutral-550 text-[11px] italic">
                Loading pages...
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[480px] overflow-y-auto pr-1 pb-1">
                {Array.from({ length: pdfSplitTotalPages }).map((_, pageIdx) => {
                  const isSelected = pdfSplitPages.includes(pageIdx);
                  return (
                    <button
                      key={pageIdx}
                      type="button"
                      onClick={() => toggleSplitPageSelection(pageIdx)}
                      className={`group relative flex flex-col items-center justify-between p-2.5 pb-2 rounded-[5px] border aspect-[3/4] transition-all duration-200 select-none shadow-sm hover:shadow-md hover:border-neutral-400 dark:hover:border-neutral-600 ${
                        isSelected
                          ? "border-neutral-900 bg-neutral-950/5 dark:border-neutral-200 dark:bg-white/5"
                          : "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
                      }`}
                    >
                      <div className={`absolute top-1.5 right-1.5 h-3.5 w-3.5 rounded border flex items-center justify-center transition-colors z-10 ${
                        isSelected 
                          ? "bg-neutral-950 border-neutral-950 text-white dark:bg-white dark:border-white dark:text-black" 
                          : "border-neutral-300 bg-white dark:border-neutral-700 dark:bg-neutral-900"
                      }`}>
                        {isSelected && <Check className="h-2 w-2 stroke-[3]" />}
                      </div>

                      {/* Visual PDF page preview thumbnail */}
                      <div className="flex-1 w-full flex items-center justify-center overflow-hidden rounded bg-neutral-50 dark:bg-neutral-950 mb-2 border border-neutral-100 dark:border-neutral-800/60">
                        {pdfPagePreviews[`split_${pageIdx}`] ? (
                          <img
                            src={pdfPagePreviews[`split_${pageIdx}`]}
                            alt={`Page ${pageIdx + 1}`}
                            className="w-full h-full object-contain transition-transform duration-350 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center animate-pulse">
                            <FileText className="h-6 w-6 text-neutral-400 dark:text-neutral-500 mb-0.5" />
                          </div>
                        )}
                      </div>
                      
                      <span className={`text-[10px] font-bold transition-colors ${isSelected ? "text-neutral-900 dark:text-white" : "text-neutral-600 dark:text-neutral-400"}`}>
                        Page {pageIdx + 1}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const isWorkspaceTool = ["image-resizer", "image-converter", "video-compressor", "pdf-merge", "pdf-split"].includes(toolId);
  const isImageTool = ["image-resizer", "image-converter", "video-compressor"].includes(toolId);

  return (
    <DashboardShell>
      <div className={`${isWorkspaceTool ? "max-w-5xl" : "max-w-2xl"} mx-auto space-y-6`}>
        
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
                
                {/* Reactive Waveform Visualizer */}
                <div className="flex items-center justify-center gap-1.5 h-8">
                  {Array.from({ length: 15 }).map((_, i) => (
                    <span
                      key={i}
                      style={{ height: "6px" }}
                      className="audio-visualizer-bar w-1 bg-neutral-950 dark:bg-white rounded-full transition-all duration-75"
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
        
        {(flowState === "configuring" || flowState === "processing") && (
          isWorkspaceTool ? (
            // Premium side-by-side layout for Workspace Tools (Image, Video, PDF Merge/Split)
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
              
              {/* Left Column: Workspace (2/3 width) */}
              <div className="md:col-span-2 space-y-4">
                {["pdf-merge", "pdf-split"].includes(toolId) ? renderPdfWorkspace() : renderMediaWorkspace()}
              </div>

              {/* Right Column: Settings panel (1/3 width) */}
              <div className="space-y-4">
                <div className={`rounded-[5px] border border-neutral-200 bg-white p-5 dark:border-neutral-850 dark:bg-neutral-900/30 shadow-sm space-y-4 ${flowState === "processing" ? "pointer-events-none opacity-60" : ""} transition-opacity duration-200`}>
                  <div className="text-[10px] font-bold text-neutral-455 dark:text-neutral-500 uppercase tracking-widest border-b border-neutral-100 dark:border-neutral-800/80 pb-2">
                    Configuration settings
                  </div>
                  {renderSettingsPanel()}
                </div>

                <div className="space-y-2">
                  <button
                    onClick={executeProcess}
                    disabled={flowState === "processing"}
                    className={`relative overflow-hidden flex items-center justify-center gap-1.5 w-full rounded-[5px] py-3 text-xs font-bold transition-all shadow-md ${
                      flowState === "processing"
                        ? "bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800/80 text-neutral-800 dark:text-neutral-205 cursor-not-allowed"
                        : "bg-neutral-950 text-white hover:bg-neutral-900 dark:bg-white dark:text-black dark:hover:bg-neutral-100 border border-transparent"
                    }`}
                  >
                    {/* Green Progress Background Overlay */}
                    {flowState === "processing" && (
                      <div 
                        className="absolute inset-y-0 left-0 bg-emerald-500/20 dark:bg-emerald-500/35 transition-all duration-300 ease-out z-0"
                        style={{ width: `${processingProgress}%` }}
                      />
                    )}

                    {flowState === "processing" ? (
                      <span className="relative z-10 flex items-center gap-1.5 justify-center text-neutral-800 dark:text-neutral-200">
                        <svg className="animate-spin h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Processing... {processingProgress}%</span>
                      </span>
                    ) : (
                      <span className="relative z-10 flex items-center gap-1.5">
                        <Play className="h-3.5 w-3.5 fill-current" />
                        <span>
                          {(() => {
                            if (toolId === "video-compressor") return "Compress & Process Video";
                            if (toolId === "pdf-merge") return "Merge PDF Documents";
                            if (toolId === "pdf-split") return "Split & Extract PDF";
                            return "Resize & Process Image";
                          })()}
                        </span>
                      </span>
                    )}
                  </button>

                  <div className="flex justify-between items-center px-1">
                    <button
                      onClick={handleReset}
                      disabled={flowState === "processing"}
                      className={`flex items-center gap-1 text-[9px] font-bold text-red-505 uppercase tracking-wider hover:opacity-85 ${flowState === "processing" ? "opacity-40 cursor-not-allowed" : ""}`}
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Clear File</span>
                    </button>
                    <span className="text-[8px] font-bold text-neutral-400 dark:text-neutral-550 uppercase tracking-wider">
                      Processed locally
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Standard layout for Non-Workspace tools
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Left Options settings Column */}
              <div className="md:col-span-2 space-y-4">
                <div className={`rounded-[5px] border border-neutral-200 bg-white p-5 dark:border-neutral-850 dark:bg-neutral-900/30 shadow-sm ${flowState === "processing" ? "pointer-events-none opacity-60" : ""} transition-opacity duration-200`}>
                  {renderSettingsPanel()}
                </div>
                
                <button
                  onClick={executeProcess}
                  disabled={flowState === "processing"}
                  className={`relative overflow-hidden flex items-center justify-center gap-1.5 w-full rounded-[5px] py-3 text-xs font-bold transition-all shadow-sm ${
                    flowState === "processing"
                      ? "bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800/80 text-neutral-800 dark:text-neutral-205 cursor-not-allowed"
                      : "bg-neutral-950 text-white hover:bg-neutral-900 dark:bg-white dark:text-black dark:hover:bg-neutral-100 border border-transparent"
                  }`}
                >
                  {/* Green Progress Background Overlay */}
                  {flowState === "processing" && (
                    <div 
                      className="absolute inset-y-0 left-0 bg-emerald-500/20 dark:bg-emerald-500/35 transition-all duration-300 ease-out z-0"
                      style={{ width: `${processingProgress}%` }}
                    />
                  )}

                  {flowState === "processing" ? (
                    <span className="relative z-10 flex items-center gap-1.5 justify-center text-neutral-800 dark:text-neutral-200">
                      <svg className="animate-spin h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Processing... {processingProgress}%</span>
                    </span>
                  ) : (
                    <span className="relative z-10 flex items-center gap-1.5">
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>Run Process</span>
                    </span>
                  )}
                </button>
              </div>

              {/* Right Side File Preview Details Column */}
              <div className="space-y-4">
                <div className="rounded-[5px] border border-neutral-200 bg-white p-4 text-left dark:border-neutral-850 dark:bg-neutral-900/40 shadow-sm">
                  <div className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">Selected Assets</div>
                  
                  <div className="mt-3 space-y-3">
                    {selectedFiles.slice(0, 3).map((file, idx) => {
                      const PreviewIcon = getIcon(tool.iconName);
                      return (
                        <div key={idx} className="space-y-2">
                          <div className="flex items-start gap-2.5 text-[10px]">
                            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[5px] bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                              <PreviewIcon className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-neutral-800 dark:text-neutral-200 truncate">{file.name}</div>
                              <div className="text-neutral-500 dark:text-neutral-400 mt-0.5 font-semibold">
                                {formatBytes(file.size)}
                              </div>
                            </div>
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
                      disabled={flowState === "processing"}
                      className={`flex items-center gap-1 text-[9px] font-bold text-red-505 uppercase tracking-wider hover:opacity-85 ${flowState === "processing" ? "opacity-40 cursor-not-allowed" : ""}`}
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Clear File</span>
                    </button>
                  </div>
                </div>
              </div>
              
            </div>
          )
        )}

        {/* ----------------------------------------------------
            D. COMPLETED READY FOR DOWNLOAD STATE
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
