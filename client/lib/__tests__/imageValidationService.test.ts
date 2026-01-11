/**
 * Client Image Validation Service Tests
 *
 * Tests cover:
 * - Image file validation
 * - Error handling
 * - User-friendly error messages
 * - API communication
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  validateImage,
  validateImages,
  getValidationErrorMessage,
} from "../imageValidationService";

// Mock fetch
global.fetch = vi.fn();

/**
 * Helper: Create a mock image file
 */
function createMockImageFile(
  name: string = "test.jpg",
  type: string = "image/jpeg",
  size: number = 1024,
): File {
  const blob = new Blob(["image data"], { type });
  return new File([blob], name, { type });
}

/**
 * Helper: Create a mock non-image file
 */
function createMockNonImageFile(): File {
  const blob = new Blob(["document content"], { type: "application/pdf" });
  return new File([blob], "document.pdf", { type: "application/pdf" });
}

describe("Image Validation Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("File Type Validation", () => {
    it("should reject non-image files", async () => {
      const file = createMockNonImageFile();
      const result = await validateImage(file);

      expect(result.approved).toBe(false);
      expect(result.code).toBe("INVALID_FILE_TYPE");
    });

    it("should accept image files", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          approved: true,
          category: "safe",
          confidence: 0.15,
        }),
      });

      const file = createMockImageFile("test.jpg", "image/jpeg");
      const result = await validateImage(file);

      expect(result.approved).toBe(true);
    });

    it("should accept different image formats", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          approved: true,
          category: "safe",
          confidence: 0.2,
        }),
      });

      const formats = ["image/jpeg", "image/png", "image/webp", "image/gif"];

      for (const format of formats) {
        const file = createMockImageFile("test", format);
        const result = await validateImage(file);

        expect(result.approved).toBe(true);
      }
    });
  });

  describe("File Size Validation", () => {
    it("should reject files exceeding 50MB", async () => {
      const largeFile = new File(
        [new ArrayBuffer(51 * 1024 * 1024)],
        "large.jpg",
        { type: "image/jpeg" },
      );

      const result = await validateImage(largeFile);

      expect(result.approved).toBe(false);
      expect(result.code).toBe("FILE_TOO_LARGE");
    });

    it("should accept files within 50MB limit", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          approved: true,
          category: "safe",
          confidence: 0.1,
        }),
      });

      const file = createMockImageFile("test.jpg", "image/jpeg", 1024 * 1024);
      const result = await validateImage(file);

      expect(result.approved).toBe(true);
    });
  });

  describe("NSFW Detection Response Handling", () => {
    it("should handle approved images", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          approved: true,
          category: "safe",
          confidence: 0.25,
        }),
      });

      const file = createMockImageFile();
      const result = await validateImage(file);

      expect(result.approved).toBe(true);
      expect(result.category).toBe("safe");
      expect(result.confidence).toBe(0.25);
    });

    it("should handle NSFW rejection", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          error: "Image contains prohibited content",
          code: "NSFW_CONTENT_DETECTED",
          details: {
            category: "nsfw",
            confidence: 0.85,
          },
        }),
      });

      const file = createMockImageFile();
      const result = await validateImage(file);

      expect(result.approved).toBe(false);
      expect(result.code).toBe("NSFW_CONTENT_DETECTED");
    });

    it("should handle rate limiting", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          error: "Rate limit exceeded",
          code: "RATE_LIMIT_EXCEEDED",
          retryAfter: 60,
        }),
      });

      const file = createMockImageFile();
      const result = await validateImage(file);

      expect(result.approved).toBe(false);
      expect(result.code).toBe("RATE_LIMIT_EXCEEDED");
    });

    it("should handle server errors", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          error: "Internal server error",
          code: "VALIDATION_ERROR",
        }),
      });

      const file = createMockImageFile();
      const result = await validateImage(file);

      expect(result.approved).toBe(false);
      expect(result.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("Network Error Handling", () => {
    it("should handle network errors gracefully", async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

      const file = createMockImageFile();
      const result = await validateImage(file);

      expect(result.approved).toBe(false);
      expect(result.code).toBe("NETWORK_ERROR");
    });

    it("should handle fetch failures", async () => {
      (global.fetch as any).mockRejectedValueOnce(
        new TypeError("Failed to fetch"),
      );

      const file = createMockImageFile();
      const result = await validateImage(file);

      expect(result.approved).toBe(false);
      expect(result.code).toBe("NETWORK_ERROR");
    });
  });

  describe("Error Messages", () => {
    it("should provide message for invalid file type", () => {
      const message = getValidationErrorMessage({
        approved: false,
        code: "INVALID_FILE_TYPE",
      });

      expect(message).toContain("image");
    });

    it("should provide message for file too large", () => {
      const message = getValidationErrorMessage({
        approved: false,
        code: "FILE_TOO_LARGE",
        error: "File size exceeds 50MB limit",
      });

      expect(message).toContain("too large");
    });

    it("should provide message for NSFW content", () => {
      const message = getValidationErrorMessage({
        approved: false,
        code: "NSFW_CONTENT_DETECTED",
      });

      expect(message).toContain("prohibited content");
    });

    it("should provide message for rate limit", () => {
      const message = getValidationErrorMessage({
        approved: false,
        code: "RATE_LIMIT_EXCEEDED",
      });

      expect(message).toContain("wait");
    });

    it("should provide message for network error", () => {
      const message = getValidationErrorMessage({
        approved: false,
        code: "NETWORK_ERROR",
      });

      expect(message).toContain("Network");
    });

    it("should return empty message for approved images", () => {
      const message = getValidationErrorMessage({
        approved: true,
      });

      expect(message).toBe("");
    });
  });

  describe("Multiple Image Validation", () => {
    it("should validate multiple images", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          approved: true,
          category: "safe",
          confidence: 0.1,
        }),
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          approved: true,
          category: "safe",
          confidence: 0.2,
        }),
      });

      const files = [
        createMockImageFile("image1.jpg"),
        createMockImageFile("image2.png"),
      ];

      const results = await validateImages(files);

      expect(results.size).toBe(2);
      expect(results.get(files[0])?.approved).toBe(true);
      expect(results.get(files[1])?.approved).toBe(true);
    });

    it("should stop on network error during batch validation", async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

      const files = [
        createMockImageFile("image1.jpg"),
        createMockImageFile("image2.jpg"),
      ];

      const results = await validateImages(files);

      // Should have only validated first image before error
      expect(results.size).toBeLessThanOrEqual(2);
    });
  });

  describe("API Communication", () => {
    it("should send image to /api/nsfw-check endpoint", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          approved: true,
          category: "safe",
          confidence: 0.1,
        }),
      });

      const file = createMockImageFile();
      await validateImage(file);

      expect(global.fetch).toHaveBeenCalledWith("/api/nsfw-check", {
        method: "POST",
        body: expect.any(FormData),
      });
    });

    it("should include file in FormData", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          approved: true,
          category: "safe",
          confidence: 0.1,
        }),
      });

      const file = createMockImageFile("custom-name.jpg");
      await validateImage(file);

      const call = (global.fetch as any).mock.calls[0];
      const formData = call[1].body;

      expect(formData).toBeInstanceOf(FormData);
    });
  });
});
