/**
 * NSFW Validation Endpoint
 *
 * POST /api/nsfw-check
 *
 * Validates image format and size before allowing upload.
 * This endpoint validates all images before storage.
 *
 * Security:
 * - File format validation (magic bytes)
 * - Size limits enforced
 * - Rate limited per user
 */

import { RequestHandler } from "express";
import {
  detectNSFW,
  getAuditLogs,
  getNSFWStats,
} from "../services/nsfw-detection";

// In-memory rate limiter (simple implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_CHECKS_PER_MINUTE = 30;

/**
 * Check rate limit for user
 */
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
 * POST /api/nsfw-check
 * Validate image for NSFW content
 */
export const handleNSFWCheck: RequestHandler = async (req, res) => {
  try {
    // This is a stub - in production, integrate with authentication middleware
    const userId = (req as any).userId || "anonymous";

    // Rate limiting
    if (!checkRateLimit(userId)) {
      return res.status(429).json({
        error: "Rate limit exceeded. Maximum 30 checks per minute.",
        retryAfter: 60,
      });
    }

    // Validate request
    if (!req.file) {
      return res.status(400).json({
        error: "No image provided",
        code: "NO_IMAGE",
      });
    }

    // Validate file is image
    if (!req.file.mimetype.startsWith("image/")) {
      return res.status(400).json({
        error: "File must be an image",
        code: "INVALID_FILE_TYPE",
      });
    }

    // Run NSFW detection
    const result = await detectNSFW(
      req.file.buffer,
      req.file.originalname,
      userId,
      req.file.size,
    );

    if (result.isNSFW) {
      return res.status(403).json({
        error: "Image rejected: contains prohibited content",
        code: "NSFW_CONTENT_DETECTED",
        details: {
          category: result.category,
          confidence: Math.round(result.confidence * 100) / 100,
        },
      });
    }

    // Image is safe
    return res.json({
      approved: true,
      category: result.category,
      confidence: Math.round(result.confidence * 100) / 100,
    });
  } catch (error) {
    console.error("[NSFW-ENDPOINT] Error:", error);

    // FAIL-SAFE: Return error that blocks upload
    return res.status(500).json({
      error: "Image validation failed",
      code: "VALIDATION_ERROR",
    });
  }
};

/**
 * GET /api/nsfw-check/stats
 * Get NSFW detection statistics (admin only)
 */
export const handleNSFWStats: RequestHandler = async (_req, res) => {
  try {
    // In production, add admin authentication check
    const stats = getNSFWStats();

    return res.json({
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[NSFW-STATS] Error:", error);
    return res.status(500).json({
      error: "Failed to retrieve statistics",
    });
  }
};

/**
 * GET /api/nsfw-check/audit-logs
 * Get recent audit logs (admin only)
 */
export const handleNSFWAuditLogs: RequestHandler = async (req, res) => {
  try {
    // In production, add admin authentication check
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);
    const logs = getAuditLogs(limit);

    return res.json({
      logs,
      count: logs.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[NSFW-AUDIT] Error:", error);
    return res.status(500).json({
      error: "Failed to retrieve audit logs",
    });
  }
};
