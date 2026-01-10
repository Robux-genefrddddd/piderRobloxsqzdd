import { storage } from "./firebase";
import {
  ref,
  uploadBytes,
  getBytes,
  deleteObject,
  getMetadata,
} from "firebase/storage";

const ASSETS_BUCKET = "assets";

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

// Download asset file from Firebase Storage
export async function downloadAssetFile(filePath: string): Promise<Blob> {
  try {
    const fileRef = ref(storage, filePath);
    const bytes = await getBytes(fileRef);
    return new Blob([bytes]);
  } catch (error) {
    console.error("Error downloading file:", error);
    throw error;
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
