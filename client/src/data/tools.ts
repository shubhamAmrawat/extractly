import { 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Music, 
  Code, 
  FolderArchive, 
  Sparkles, 
  FilePlus, 
  FileMinus,
  Mic,
  Camera,
  Scissors,
  Download,
  PenTool,
  Hash,
  Palette,
  Shuffle,
  FileCode,
  Languages
} from "lucide-react";

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  iconName: string;
  path: string;
  trending?: boolean;
  popular?: boolean;
  status?: "stable" | "beta" | "new";
}

export type ToolCategory = 
  | "PDF Tools"
  | "Image Tools"
  | "Video Tools"
  | "Audio Tools"
  | "Document & Text"
  | "Developer Utilities"
  | "Creator & Media";

export const CATEGORIES: ToolCategory[] = [
  "PDF Tools",
  "Image Tools",
  "Video Tools",
  "Audio Tools",
  "Document & Text",
  "Developer Utilities",
  "Creator & Media"
];

export const TOOLS: Tool[] = [
  // PDF Tools
  {
    id: "pdf-merge",
    name: "Merge PDF",
    description: "Combine multiple PDF files into a single document in seconds.",
    category: "PDF Tools",
    iconName: "FilePlus",
    path: "/tools/pdf-merge",
    popular: true,
    status: "stable"
  },
  {
    id: "pdf-split",
    name: "Split PDF",
    description: "Extract specific pages or split a PDF into separate files.",
    category: "PDF Tools",
    iconName: "FileMinus",
    path: "/tools/pdf-split",
    status: "stable"
  },
  {
    id: "pdf-to-text",
    name: "PDF to Text",
    description: "Extract readable text directly from your PDF files client-side.",
    category: "PDF Tools",
    iconName: "FileText",
    path: "/tools/pdf-to-text",
    status: "beta"
  },

  // Image Tools
  {
    id: "image-converter",
    name: "Image Converter",
    description: "Convert images between PNG, JPG, WebP, AVIF, and GIF formats.",
    category: "Image Tools",
    iconName: "Shuffle",
    path: "/tools/image-converter",
    popular: true,
    trending: true,
    status: "stable"
  },
  {
    id: "image-resizer",
    name: "Image Resizer",
    description: "Resize images by specific dimensions or percentage ratios.",
    category: "Image Tools",
    iconName: "ImageIcon",
    path: "/tools/image-resizer",
    status: "stable"
  },

  // Video Tools
  {
    id: "screen-recorder",
    name: "Screen Recorder",
    description: "Record your desktop or specific window directly from the browser.",
    category: "Video Tools",
    iconName: "Camera",
    path: "/tools/screen-recorder",
    trending: true,
    status: "stable"
  },
  {
    id: "video-compressor",
    name: "Video Compressor",
    description: "Compress video files to shareable size while preserving quality.",
    category: "Video Tools",
    iconName: "Video",
    path: "/tools/video-compressor",
    status: "beta"
  },

  // Audio Tools
  {
    id: "audio-recorder",
    name: "Voice Recorder",
    description: "Record crisp audio from your microphone with simulated waveform visualization.",
    category: "Audio Tools",
    iconName: "Mic",
    path: "/tools/audio-recorder",
    status: "stable"
  },
  {
    id: "audio-extractor",
    name: "Audio Extractor",
    description: "Extract high-quality MP3 or WAV audio tracks from video files.",
    category: "Audio Tools",
    iconName: "Music",
    path: "/tools/audio-extractor",
    trending: true,
    status: "stable"
  },

  // Document & Text Tools
  {
    id: "word-counter",
    name: "Word Counter",
    description: "Analyze word count, reading time, sentences, and character density.",
    category: "Document & Text",
    iconName: "Hash",
    path: "/tools/word-counter",
    status: "stable"
  },
  {
    id: "markdown-previewer",
    name: "Markdown Editor",
    description: "Write markdown with side-by-side premium rendered HTML preview.",
    category: "Document & Text",
    iconName: "PenTool",
    path: "/tools/markdown-previewer",
    status: "stable"
  },

  // Developer Utilities
  {
    id: "json-formatter",
    name: "JSON Formatter",
    description: "Format, validate, and minify JSON with interactive folding.",
    category: "Developer Utilities",
    iconName: "Code",
    path: "/tools/json-formatter",
    popular: true,
    status: "stable"
  },
  {
    id: "svg-optimizer",
    name: "SVG Optimizer",
    description: "Clean up and optimize SVG vector codes to minimize asset size.",
    category: "Developer Utilities",
    iconName: "FileCode",
    path: "/tools/svg-optimizer",
    status: "beta"
  },

  // Creator & Media Utilities
  {
    id: "color-palette",
    name: "Palette Generator",
    description: "Create premium color schemes with locks, HEX codes, and preview mockups.",
    category: "Creator & Media",
    iconName: "Palette",
    path: "/tools/color-palette",
    trending: true,
    status: "stable"
  },
  {
    id: "video-downloader",
    name: "Media Downloader",
    description: "Download video and audio from popular media sharing platforms.",
    category: "Creator & Media",
    iconName: "Download",
    path: "/tools/video-downloader",
    popular: true,
    status: "beta"
  },
  {
    id: "ai-generator",
    name: "AI Image Generator",
    description: "Describe an image and generate modern visual mockups using AI engines.",
    category: "Creator & Media",
    iconName: "Sparkles",
    path: "/tools/ai-generator",
    trending: true,
    status: "new"
  }
];

export const getIcon = (name: string) => {
  switch (name) {
    case "FileText": return FileText;
    case "ImageIcon": return ImageIcon;
    case "Video": return Video;
    case "Music": return Music;
    case "Code": return Code;
    case "FolderArchive": return FolderArchive;
    case "Sparkles": return Sparkles;
    case "FilePlus": return FilePlus;
    case "FileMinus": return FileMinus;
    case "Mic": return Mic;
    case "Camera": return Camera;
    case "Scissors": return Scissors;
    case "Download": return Download;
    case "PenTool": return PenTool;
    case "Hash": return Hash;
    case "Palette": return Palette;
    case "Shuffle": return Shuffle;
    case "FileCode": return FileCode;
    case "Languages": return Languages;
    default: return FileText;
  }
};
