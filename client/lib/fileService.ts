import { storage } from "./firebase";
import {
  ref,
  uploadBytes,
  getBytes,
  deleteObject,
  getMetadata,
  listAll,
} from "firebase/storage";

const ASSETS_BUCKET = "assets";

export interface AssetFile {
  name: string;
  path: string;
  size: number;
  type: string;
}

// Upload asset file to Firebase Storage
export async function uploadAssetFile(
  assetId: string,
  file: File,
  onProgress?: (progress: number) => void,
): Promise<string> {
  try {
    const fileRef = ref(storage, `${ASSETS_BUCKET}/${assetId}/${file.name}`);

    // Upload file
    await uploadBytes(fileRef, file);

    // Return the file path for storage
    return `${ASSETS_BUCKET}/${assetId}/${file.name}`;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}

// Download asset file from Firebase Storage via backend proxy
// This bypasses CORS issues by routing through the app's backend server
export async function downloadAssetFile(
  filePath: string,
  fileName?: string,
): Promise<Blob> {
  try {
    console.log("Downloading file via backend proxy:", filePath);

    // Use Netlify Function proxy endpoint to avoid CORS issues
    // The function will fetch from Firebase Storage and return the file
    const params = new URLSearchParams({
      filePath: filePath,
      fileName: fileName || filePath.split("/").pop() || "file",
    });

    const response = await fetch(`/.netlify/functions/download?${params.toString()}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorCode = errorData?.code || "unknown";

      if (response.status === 404) {
        console.error("File not found:", filePath);
        throw new Error("File not found. It may have been deleted.");
      } else if (response.status === 403) {
        console.error("Access denied for file:", filePath);
        throw new Error("You don't have permission to download this file.");
      }

      throw new Error(
        `Download failed (${response.status}): ${errorData?.error || "Unknown error"}`,
      );
    }

    // Get file as blob
    const blob = await response.blob();
    return blob;
  } catch (error: any) {
    console.error("Error downloading file:", filePath, error);

    // If it's our custom error, re-throw it
    if (error instanceof Error && error.message.includes("Download failed")) {
      throw error;
    }

    // Provide user-friendly error messages for network issues
    if (
      error?.name === "TypeError" &&
      error?.message?.includes("Failed to fetch")
    ) {
      throw new Error(
        "Network error. Please check your connection and try again.",
      );
    }

    throw new Error(
      error?.message || "Failed to download file. Please try again.",
    );
  }
}

// Delete asset file from Firebase Storage
export async function deleteAssetFile(filePath: string): Promise<void> {
  try {
    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
}

// Force download file to browser
export function forceDownloadFile(blob: Blob, filename: string): void {
  // Create a blob URL
  const url = window.URL.createObjectURL(blob);

  // Create a temporary anchor element and click it
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;

  // Force download by setting headers to prevent preview
  link.setAttribute("download", filename);

  // Append to body and trigger click
  document.body.appendChild(link);
  link.click();

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, 100);
}

// Get file metadata (size, etc)
export async function getFileMetadata(filePath: string) {
  try {
    const fileRef = ref(storage, filePath);
    const metadata = await getMetadata(fileRef);
    return metadata;
  } catch (error) {
    console.error("Error getting file metadata:", error);
    return null;
  }
}

// Upload image file to Firebase Storage (for messages, etc)
export async function uploadImageToStorage(
  storageRef: any,
  file: File | Blob,
): Promise<void> {
  try {
    await uploadBytes(storageRef, file);
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
}

// List all files in an asset folder
export async function listAssetFiles(assetId: string): Promise<AssetFile[]> {
  try {
    const folderRef = ref(storage, `${ASSETS_BUCKET}/${assetId}`);
    console.log("Listing files from path:", `${ASSETS_BUCKET}/${assetId}`);

    const result = await listAll(folderRef);

    const files: AssetFile[] = [];

    for (const fileRef of result.items) {
      try {
        const metadata = await getMetadata(fileRef);
        const fileName = fileRef.name;
        const fullPath = `${ASSETS_BUCKET}/${assetId}/${fileName}`;
        const fileType = getFileType(fileName);

        files.push({
          name: fileName,
          path: fullPath,
          size: metadata.size || 0,
          type: fileType,
        });
      } catch (err: any) {
        const errorCode = err?.code || "unknown";
        console.error(
          `Error getting metadata for ${fileRef.name}:`,
          errorCode,
          err,
        );
      }
    }

    if (files.length === 0) {
      console.warn(
        `No files found in asset folder: ${ASSETS_BUCKET}/${assetId}`,
      );
    }

    return files;
  } catch (error: any) {
    const errorCode = error?.code || "unknown";
    console.error("Error listing asset files:", errorCode, error);

    // Return empty array instead of throwing - allows graceful fallback
    return [];
  }
}

// Helper function to determine file type from extension
function getFileType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "unknown";

  const typeMap: Record<string, string> = {
    // Images
    jpg: "image",
    jpeg: "image",
    png: "image",
    gif: "image",
    webp: "image",
    svg: "image",
    // Documents
    pdf: "document",
    doc: "document",
    docx: "document",
    txt: "text",
    // Archives
    zip: "archive",
    rar: "archive",
    "7z": "archive",
    // Code
    js: "code",
    ts: "code",
    tsx: "code",
    jsx: "code",
    json: "code",
    html: "code",
    css: "code",
    // Models
    obj: "model",
    fbx: "model",
    gltf: "model",
    glb: "model",
    blend: "model",
    // Video
    mp4: "video",
    webm: "video",
    mov: "video",
    // Audio
    mp3: "audio",
    wav: "audio",
    ogg: "audio",
  };

  return typeMap[ext] || "file";
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}
