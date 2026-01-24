import { 
  FileArchive, 
  FileVideo, 
  FileAudio, 
  FileText, 
  FileCode, 
  FileImage,
  File,
  LucideIcon
} from "lucide-react";

// Map of file extensions to their icon components
const extensionIconMap: Record<string, LucideIcon> = {
  // Archives
  zip: FileArchive,
  rar: FileArchive,
  "7z": FileArchive,
  tar: FileArchive,
  gz: FileArchive,
  
  // Video
  mp4: FileVideo,
  mov: FileVideo,
  avi: FileVideo,
  mkv: FileVideo,
  webm: FileVideo,
  wmv: FileVideo,
  flv: FileVideo,
  
  // Audio
  mp3: FileAudio,
  wav: FileAudio,
  aac: FileAudio,
  flac: FileAudio,
  ogg: FileAudio,
  m4a: FileAudio,
  wma: FileAudio,
  
  // Documents
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  txt: FileText,
  rtf: FileText,
  
  // Project files (code/editing software)
  aex: FileCode,
  aep: FileCode,
  prproj: FileCode,
  mogrt: FileCode,
  drp: FileCode, // DaVinci Resolve
  psd: FileCode,
  ai: FileCode,
  fcp: FileCode, // Final Cut Pro
  
  // Images
  jpg: FileImage,
  jpeg: FileImage,
  png: FileImage,
  gif: FileImage,
  webp: FileImage,
  svg: FileImage,
  bmp: FileImage,
  tiff: FileImage,
};

export function getFileTypeIcon(filename: string): LucideIcon {
  if (!filename) return File;
  
  // Get extension from filename
  const parts = filename.toLowerCase().split('.');
  const extension = parts.length > 1 ? parts[parts.length - 1] : '';
  
  return extensionIconMap[extension] || File;
}

export function getFileTypeLabel(filename: string): string {
  if (!filename) return "File";
  
  const parts = filename.toLowerCase().split('.');
  const extension = parts.length > 1 ? parts[parts.length - 1] : '';
  
  const labels: Record<string, string> = {
    zip: "ZIP Archive",
    rar: "RAR Archive",
    "7z": "7-Zip Archive",
    mp4: "Video",
    mov: "Video",
    avi: "Video",
    mp3: "Audio",
    wav: "Audio",
    aac: "Audio",
    pdf: "PDF Document",
    aex: "After Effects Plugin",
    aep: "After Effects Project",
    prproj: "Premiere Project",
    mogrt: "Motion Graphics",
    psd: "Photoshop File",
  };
  
  return labels[extension] || extension.toUpperCase() || "File";
}
