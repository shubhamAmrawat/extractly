"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, File, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  descriptionText?: string;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onFilesSelected,
  accept = "*",
  multiple = false,
  maxSizeMB = 50,
  descriptionText = "drag & drop files here, or click to browse",
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const validateFiles = (files: FileList): File[] => {
    setError(null);
    const validFiles: File[] = [];

    // Filter by type/extension if custom accept is provided
    const checkFileType = (file: File) => {
      if (accept === "*") return true;
      const acceptedTypes = accept.split(",").map((t) => t.trim());
      
      return acceptedTypes.some((type) => {
        if (type.startsWith(".")) {
          // File extension (e.g. .pdf, .png)
          return file.name.toLowerCase().endsWith(type.toLowerCase());
        } else if (type.includes("/*")) {
          // Mime type category (e.g. image/*)
          const category = type.split("/")[0];
          return file.type.startsWith(category);
        } else {
          // Exact mime type (e.g. application/pdf)
          return file.type === type;
        }
      });
    };

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check file size
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`File ${file.name} exceeds the maximum size of ${maxSizeMB}MB.`);
        return [];
      }

      // Check file type
      if (!checkFileType(file)) {
        setError(`File ${file.name} is not of type ${accept}.`);
        return [];
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      setError("No valid files found.");
      return [];
    }

    if (!multiple && validFiles.length > 1) {
      setError("Only single file upload is supported for this utility.");
      return [validFiles[0]];
    }

    return validFiles;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const validated = validateFiles(e.dataTransfer.files);
      if (validated.length > 0) {
        onFilesSelected(validated);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const validated = validateFiles(e.target.files);
      if (validated.length > 0) {
        onFilesSelected(validated);
      }
    }
  };

  const triggerInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <motion.div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerInput}
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.995 }}
        className={`group relative flex flex-col items-center justify-center rounded-xl border border-dashed p-10 text-center cursor-pointer transition-all min-h-[220px] ${
          isDragActive
            ? "border-neutral-800 bg-neutral-100/50 dark:border-neutral-200 dark:bg-neutral-800/20"
            : "border-neutral-200 bg-white hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-900/30 dark:hover:border-neutral-700"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          className="hidden"
        />

        {/* Upload Icon with animated micro-bounce */}
        <div className={`flex h-12 w-12 items-center justify-center rounded-lg border transition-all ${
          isDragActive 
            ? "border-neutral-400 bg-neutral-200 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-50"
            : "border-neutral-100 bg-neutral-50 text-neutral-400 group-hover:bg-neutral-100 group-hover:text-neutral-600 dark:border-neutral-800 dark:bg-neutral-800/40 dark:text-neutral-500 dark:group-hover:bg-neutral-800/80 dark:group-hover:text-neutral-300"
        }`}>
          <UploadCloud className={`h-6 w-6 transition-transform ${isDragActive ? "scale-110" : "group-hover:-translate-y-0.5"}`} />
        </div>

        <span className="mt-4 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
          Upload files
        </span>
        <span className="mt-1 text-[10px] text-neutral-400 dark:text-neutral-500 font-medium">
          {descriptionText}
        </span>

        <span className="mt-3 text-[9px] text-neutral-400/80 dark:text-neutral-500/80 uppercase tracking-wider font-bold">
          Max File Size: {maxSizeMB}MB
        </span>
      </motion.div>

      {/* Error state */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 flex items-center gap-2 rounded-lg bg-red-500/5 border border-red-500/10 px-3 py-2 text-[10px] text-red-500 dark:bg-red-500/10"
        >
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </motion.div>
      )}
    </div>
  );
};
