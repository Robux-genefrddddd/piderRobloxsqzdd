import { Handler } from "@netlify/functions";
import {
  detectNSFW,
  getAuditLogs,
  getNSFWStats,
} from "../../server/services/nsfw-detection";

// In-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_CHECKS_PER_MINUTE = 30;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, {
      count: 1,
      resetTime: now + 60 * 1000,
    });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT_CHECKS_PER_MINUTE) {
    return false;
  }

  userLimit.count++;
  return true;
}

/**
 * Parse multipart form data
 * Handles file uploads from the frontend
 */
async function parseFormData(
  event: any,
): Promise<{ file?: Buffer; fileName?: string } | null> {
  try {
    const contentType = event.headers["content-type"];

    if (!contentType || !contentType.includes("multipart/form-data")) {
      return null;
    }

    // Get the body
    const body = event.isBase64Encoded
      ? Buffer.from(event.body, "base64")
      : Buffer.from(event.body);

    // Parse boundary from content-type
    const boundaryMatch = contentType.match(/boundary=([^;]+)/);
    if (!boundaryMatch) {
      return null;
    }

    const boundary = boundaryMatch[1];
    const parts = body.toString("binary").split(`--${boundary}`);

    for (const part of parts) {
      // Look for file part
      if (part.includes('name="file"')) {
        // Extract headers and body
        const [headers, fileData] = part.split("\r\n\r\n");

        if (!fileData) continue;

        // Get filename from Content-Disposition header
        const fileNameMatch = headers.match(/filename="([^"]+)"/);
        const fileName = fileNameMatch ? fileNameMatch[1] : "file";

        // Remove trailing boundary
        const cleanedData = fileData
          .replace(/\r\n--$/, "")
          .replace(/\r\n$/, "");

        return {
          file: Buffer.from(cleanedData, "binary"),
          fileName,
        };
      }
    }

    return null;
  } catch (error) {
    console.error("[NSFW] Form parsing error:", error);
    return null;
  }
}

/**
 * Netlify Function: NSFW Check
 * POST /.netlify/functions/nsfw-check
 *
 * Validates images for NSFW content before upload
 */
const handler: Handler = async (event, context): Promise<any> => {
  try {
    // Only allow POST requests
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Method not allowed" }),
      };
    }

    // Get user ID from request (from auth header or query param)
    const userId = event.queryStringParameters?.userId || "anonymous";

    // Check rate limit
    if (!checkRateLimit(userId)) {
      return {
        statusCode: 429,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "Rate limit exceeded. Maximum 30 checks per minute.",
          retryAfter: 60,
        }),
      };
    }

    // Parse form data
    const formData = await parseFormData(event);

    if (!formData || !formData.file) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "No image provided",
          code: "NO_IMAGE",
        }),
      };
    }

    // Run NSFW detection
    const result = await detectNSFW(
      formData.file,
      formData.fileName || "file",
      userId,
      formData.file.length,
    );

    if (result.isNSFW) {
      return {
        statusCode: 403,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "Image rejected: contains prohibited content",
          code: "NSFW_CONTENT_DETECTED",
          details: {
            category: result.category,
            confidence: Math.round(result.confidence * 100) / 100,
          },
        }),
      };
    }

    // Image is safe
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        approved: true,
        category: result.category,
        confidence: Math.round(result.confidence * 100) / 100,
      }),
    };
  } catch (error) {
    console.error("[NSFW-ENDPOINT] Error:", error);

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Image validation failed",
        code: "VALIDATION_ERROR",
      }),
    };
  }
};

/**
 * Netlify Function: NSFW Stats
 * GET /.netlify/functions/nsfw-check?action=stats
 *
 * Returns NSFW detection statistics (admin only)
 */
const statsHandler: Handler = async (event, context): Promise<any> => {
  try {
    // In production, add admin authentication check
    const stats = getNSFWStats();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stats,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error("[NSFW-STATS] Error:", error);

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Failed to retrieve statistics",
      }),
    };
  }
};

/**
 * Netlify Function: NSFW Audit Logs
 * GET /.netlify/functions/nsfw-check?action=audit&limit=100
 *
 * Returns recent audit logs (admin only)
 */
const auditHandler: Handler = async (event, context): Promise<any> => {
  try {
    // In production, add admin authentication check
    const limit = Math.min(
      parseInt(event.queryStringParameters?.limit || "100"),
      1000,
    );
    const logs = getAuditLogs(limit);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        logs,
        count: logs.length,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error("[NSFW-AUDIT] Error:", error);

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Failed to retrieve audit logs",
      }),
    };
  }
};

/**
 * Main handler that routes to appropriate function
 */
const mainHandler: Handler = async (event, context): Promise<any> => {
  const action = event.queryStringParameters?.action;

  if (action === "stats") {
    const result = await statsHandler(event, context);
    return result;
  }

  if (action === "audit") {
    const result = await auditHandler(event, context);
    return result;
  }

  // Default: NSFW check
  const result = await handler(event, context);
  return result;
};

export { mainHandler as handler };
