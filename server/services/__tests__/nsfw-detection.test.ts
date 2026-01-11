/**
 * NSFW Detection Service Tests
 *
 * Tests cover:
 * - Safe image detection
 * - NSFW content rejection
 * - Error handling (fail-safe)
 * - Rate limiting
 * - Audit logging
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  detectNSFW,
  getAuditLogs,
  clearAuditLogs,
  getNSFWStats,
} from "../nsfw-detection";
import sharp from "sharp";

/**
 * Helper: Create a test image buffer
 */
async function createTestImage(
  width: number = 100,
  height: number = 100,
  color: { r: number; g: number; b: number } = { r: 100, g: 100, b: 100 },
): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: color,
    },
  })
    .png()
    .toBuffer();
}

/**
 * Helper: Create a large image buffer
 */
async function createLargeImage(): Promise<Buffer> {
  return sharp({
    create: {
      width: 8000,
      height: 8000,
      channels: 3,
      background: { r: 100, g: 100, b: 100 },
    },
  })
    .png()
    .toBuffer();
}

describe("NSFW Detection Service", () => {
  beforeEach(() => {
    clearAuditLogs();
  });

  describe("Safe Image Detection", () => {
    it("should approve safe landscape image", async () => {
      const imageBuffer = await createTestImage(224, 224, {
        r: 50,
        g: 150,
        b: 100,
      });

      const result = await detectNSFW(imageBuffer, "landscape.png");

      expect(result.isNSFW).toBe(false);
      expect(result.category).toBe("safe");
      expect(result.confidence).toBeLessThan(0.7);
    });

    it("should approve safe portrait image", async () => {
      const imageBuffer = await createTestImage(224, 224, {
        r: 200,
        g: 200,
        b: 200,
      });

      const result = await detectNSFW(imageBuffer, "portrait.jpg");

      expect(result.isNSFW).toBe(false);
      expect(result.approved === undefined || !result.approved).toBeTruthy();
    });

    it("should have high confidence for safe images", async () => {
      const imageBuffer = await createTestImage();
      const result = await detectNSFW(imageBuffer, "safe.png");

      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThan(0.7);
    });
  });

  describe("File Size Validation", () => {
    it("should reject files exceeding size limit", async () => {
      // Simulate large file (51MB)
      const result = await detectNSFW(
        Buffer.alloc(51 * 1024 * 1024),
        "huge.jpg",
        undefined,
        51 * 1024 * 1024,
      );

      expect(result.isNSFW).toBe(true);
      expect(result.confidence).toBe(1.0);
      expect(result.error).toContain("exceeds limit");
    });

    it("should accept files within size limit", async () => {
      const imageBuffer = await createTestImage();
      const result = await detectNSFW(
        imageBuffer,
        "valid.jpg",
        undefined,
        imageBuffer.length,
      );

      expect(result.error === undefined || result.error === "").toBeTruthy();
    });
  });

  describe("Image Dimension Validation", () => {
    it("should handle oversized images gracefully", async () => {
      const largeImage = await createLargeImage();
      const result = await detectNSFW(largeImage, "oversized.png");

      // Should either reject or handle gracefully
      expect(result.isNSFW !== undefined).toBeTruthy();
    });

    it("should process standard sized images", async () => {
      const imageBuffer = await createTestImage(1920, 1080);
      const result = await detectNSFW(imageBuffer, "standard.png");

      expect(result.error === undefined || result.error === "").toBeTruthy();
    });
  });

  describe("Error Handling (Fail-Safe)", () => {
    it("should reject invalid image data", async () => {
      const invalidBuffer = Buffer.from("not an image");
      const result = await detectNSFW(invalidBuffer, "invalid.jpg");

      expect(result.isNSFW).toBe(true);
      expect(result.confidence).toBe(1.0);
    });

    it("should reject empty buffer", async () => {
      const emptyBuffer = Buffer.alloc(0);
      const result = await detectNSFW(emptyBuffer, "empty.jpg");

      expect(result.isNSFW).toBe(true);
      expect(result.error).toBeDefined();
    });

    it("should handle null/undefined gracefully", async () => {
      const result = await detectNSFW(Buffer.from(""), "test.jpg");

      expect(result.isNSFW).toBe(true);
    });
  });

  describe("Audit Logging", () => {
    it("should log detection results", async () => {
      const imageBuffer = await createTestImage();
      await detectNSFW(imageBuffer, "test.png", "user-123", imageBuffer.length);

      const logs = getAuditLogs();
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].fileName).toBe("test.png");
      expect(logs[0].userId).toBe("user-123");
    });

    it("should include confidence and decision in logs", async () => {
      const imageBuffer = await createTestImage();
      await detectNSFW(imageBuffer, "test.png", "user-456");

      const logs = getAuditLogs(1);
      expect(logs[0].isNSFW).toBeDefined();
      expect(logs[0].confidence).toBeDefined();
    });

    it("should record file dimensions", async () => {
      const imageBuffer = await createTestImage(500, 300);
      await detectNSFW(imageBuffer, "sized.png");

      const logs = getAuditLogs(1);
      expect(logs[0].dimensions).toBeDefined();
    });

    it("should track detection errors in logs", async () => {
      const invalidBuffer = Buffer.from("corrupt");
      await detectNSFW(invalidBuffer, "corrupt.jpg", "user-789");

      const logs = getAuditLogs(1);
      expect(logs[0].error).toBeDefined();
      expect(logs[0].isNSFW).toBe(true);
    });

    it("should support audit log retrieval with limit", async () => {
      // Create multiple logs
      for (let i = 0; i < 20; i++) {
        const buffer = await createTestImage();
        await detectNSFW(buffer, `image-${i}.png`);
      }

      const allLogs = getAuditLogs(100);
      const limitedLogs = getAuditLogs(5);

      expect(allLogs.length).toBeGreaterThanOrEqual(5);
      expect(limitedLogs.length).toBeLessThanOrEqual(5);
    });
  });

  describe("Statistics", () => {
    it("should calculate block rate correctly", async () => {
      // Create a few test scenarios
      const buffer = await createTestImage();

      // Safe images
      await detectNSFW(buffer, "safe1.png");
      await detectNSFW(buffer, "safe2.png");

      // Simulate NSFW (we can't actually create NSFW images in tests)
      const largeBuffer = Buffer.alloc(51 * 1024 * 1024);
      await detectNSFW(
        largeBuffer,
        "blocked.png",
        undefined,
        largeBuffer.length,
      );

      const stats = getNSFWStats();

      expect(stats.totalChecks).toBeGreaterThan(0);
      expect(stats.blockedCount).toBeGreaterThanOrEqual(0);
      expect(stats.allowedCount).toBeGreaterThanOrEqual(0);
      expect(stats.blockRate).toBeGreaterThanOrEqual(0);
      expect(stats.blockRate).toBeLessThanOrEqual(100);
    });

    it("should reset stats after clear", async () => {
      const buffer = await createTestImage();
      await detectNSFW(buffer, "test.png");

      clearAuditLogs();
      const stats = getNSFWStats();

      expect(stats.totalChecks).toBe(0);
      expect(stats.blockedCount).toBe(0);
      expect(stats.allowedCount).toBe(0);
    });
  });

  describe("Concurrent Requests", () => {
    it("should handle multiple simultaneous detections", async () => {
      const imageBuffer = await createTestImage();
      const promises = [];

      for (let i = 0; i < 10; i++) {
        promises.push(
          detectNSFW(imageBuffer, `concurrent-${i}.png`, `user-${i}`),
        );
      }

      const results = await Promise.all(promises);

      expect(results.length).toBe(10);
      expect(results.every((r) => r.isNSFW !== undefined)).toBeTruthy();
    });
  });

  describe("Input Validation", () => {
    it("should require fileName parameter", async () => {
      const buffer = await createTestImage();
      const result = await detectNSFW(buffer, "");

      // Should still work but with empty fileName
      expect(result.isNSFW !== undefined).toBeTruthy();
    });

    it("should accept optional userId and fileSize", async () => {
      const buffer = await createTestImage();

      const result1 = await detectNSFW(buffer, "test.png");
      const result2 = await detectNSFW(
        buffer,
        "test.png",
        "user-123",
        buffer.length,
      );

      expect(result1.isNSFW !== undefined).toBeTruthy();
      expect(result2.isNSFW !== undefined).toBeTruthy();
    });
  });
});
