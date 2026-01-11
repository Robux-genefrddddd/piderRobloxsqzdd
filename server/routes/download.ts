import { RequestHandler } from "express";
import { getBytes } from "firebase/storage";
import { ref } from "firebase/storage";
import { storage } from "../config/firebase";

interface DownloadRequest {
  filePath: string;
  fileName?: string;
}

/**
 * Proxy endpoint for downloading files from Firebase Storage
 * This bypasses CORS issues by routing through the backend
 * 
 * Usage: GET /api/download?filePath=assets/assetId/filename.ext&fileName=display-name.ext
 */
export const handleDownload: RequestHandler = async (req, res) => {
  try {
    const { filePath, fileName } = req.query as Record<string, string>;

    if (!filePath) {
      return res.status(400).json({
        error: "Missing filePath parameter",
      });
    }

    // Security: Validate the file path to prevent directory traversal
    if (filePath.includes("..") || filePath.startsWith("/")) {
      return res.status(400).json({
        error: "Invalid file path",
      });
    }

    console.log(`Downloading file: ${filePath}`);

    // Get file from Firebase Storage
    const fileRef = ref(storage, filePath);
    const bytes = await getBytes(fileRef);

    // Set response headers for file download
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileName || filePath.split("/").pop() || "file"}"`
    );
    res.setHeader("Content-Length", bytes.length);
    res.setHeader("Cache-Control", "public, max-age=3600");

    // Send file
    res.send(bytes);
  } catch (error: any) {
    console.error("Download error:", error);

    const errorCode = error?.code || "unknown";

    if (errorCode === "storage/object-not-found") {
      return res.status(404).json({
        error: "File not found",
        code: "OBJECT_NOT_FOUND",
      });
    } else if (errorCode === "storage/unauthorized") {
      return res.status(403).json({
        error: "Access denied",
        code: "UNAUTHORIZED",
      });
    }

    res.status(500).json({
      error: "Failed to download file",
      code: errorCode,
    });
  }
};
