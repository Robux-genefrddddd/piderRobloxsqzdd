import { Handler } from "@netlify/functions";

/**
 * Netlify Function: Download Proxy
 * GET /.netlify/functions/download?filePath=...&fileName=...
 *
 * Proxies file downloads from Firebase Storage to avoid CORS issues.
 * Validates file paths and prevents directory traversal attacks.
 */
const handler: Handler = async (event, context) => {
  try {
    // Only allow GET requests
    if (event.httpMethod !== "GET") {
      return {
        statusCode: 405,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Method not allowed" }),
      };
    }

    const { filePath, fileName } = event.queryStringParameters || {};

    // Validate filePath parameter
    if (!filePath) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "Missing filePath parameter",
        }),
      };
    }

    // Security: Validate the file path to prevent directory traversal
    if (filePath.includes("..") || filePath.startsWith("/")) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "Invalid file path",
        }),
      };
    }

    // Encode the path for URL
    const encodedPath = encodeURIComponent(filePath);
    const firebaseUrl = `https://firebasestorage.googleapis.com/v0/b/keysystem-d0b86-8df89.firebasestorage.app/o/${encodedPath}?alt=media`;

    console.log(`Proxying download: ${filePath}`);

    // Fetch the file from Firebase Storage
    const response = await fetch(firebaseUrl);

    if (!response.ok) {
      console.error(
        `Firebase Storage error: ${response.status} ${response.statusText}`,
      );

      if (response.status === 404) {
        return {
          statusCode: 404,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            error: "File not found",
            code: "OBJECT_NOT_FOUND",
          }),
        };
      } else if (response.status === 403) {
        return {
          statusCode: 403,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            error: "Access denied",
            code: "UNAUTHORIZED",
          }),
        };
      }

      return {
        statusCode: response.status,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "Firebase Storage error",
          code: response.status,
        }),
      };
    }

    // Get file as buffer
    const buffer = await response.arrayBuffer();
    const base64Body = Buffer.from(buffer).toString("base64");

    // Determine the display filename
    const displayFileName =
      fileName || filePath.split("/").pop() || "file";

    // Determine content type
    const contentType =
      response.headers.get("content-type") || "application/octet-stream";

    // Return file with proper headers
    return {
      statusCode: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${displayFileName}"`,
        "Content-Length": String(buffer.byteLength),
        "Cache-Control": "public, max-age=3600",
        "Accept-Ranges": "bytes",
      },
      isBase64Encoded: true,
      body: base64Body,
    };
  } catch (error: any) {
    console.error("Download proxy error:", error);

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Failed to download file",
        message: error?.message || "Unknown error",
      }),
    };
  }
};

export { handler };
