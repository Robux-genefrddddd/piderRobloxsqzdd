/**
 * Image Validation Service
 *
 * Validates images before uploading to storage.
 * - Checks file type and size
 * - Validates image format
 * - Handles errors gracefully
 */

export interface ImageValidationResult {
  approved: boolean;
  category?: "safe" | "nsfw" | "uncertain";
  confidence?: number;
  error?: string;
  code?: string;
}

/**
 * Validate image file before upload
 *
 * @param file - Image file to validate
 * @returns Validation result
 */
export async function validateImage(
  file: File,
): Promise<ImageValidationResult> {
  try {
    // Client-side: Validate file is an image
    if (!file.type.startsWith("image/")) {
      return {
        approved: false,
        error: "File must be an image (PNG, JPG, WebP, GIF)",
        code: "INVALID_FILE_TYPE",
      };
    }

    // Client-side: Validate file size (50MB limit)
    const MAX_FILE_SIZE_MB = 50;
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return {
        approved: false,
        error: `File size exceeds ${MAX_FILE_SIZE_MB}MB limit`,
        code: "FILE_TOO_LARGE",
      };
    }

    // Prepare file for server validation
    const formData = new FormData();
    formData.append("file", file);

    console.log("[ImageValidation] Sending image to server:", file.name);

    // Send to server validation endpoint
    const response = await fetch("/api/nsfw-check", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      console.warn("[ImageValidation] Server validation failed:", {
        status: response.status,
        error: errorData.error,
      });

      // Handle rate limiting
      if (response.status === 429) {
        return {
          approved: false,
          error:
            "Too many validation requests. Please wait a moment and try again.",
          code: "RATE_LIMIT_EXCEEDED",
        };
      }

      // Handle invalid format on server
      if (response.status === 400) {
        return {
          approved: false,
          error:
            "Image file is invalid or corrupted. Please try a different image.",
          code: "INVALID_IMAGE",
        };
      }

      // Handle other server errors
      return {
        approved: false,
        error: errorData.error || "Image validation failed. Please try again.",
        code: errorData.code || "VALIDATION_ERROR",
      };
    }

    // Parse successful response
    const result = await response.json();

    if (!result.approved) {
      console.warn("[ImageValidation] Image rejected:", {
        fileName: file.name,
        reason: result.category,
      });

      return {
        approved: false,
        error:
          "This image cannot be uploaded. Please select a different image.",
        code: "CONTENT_REJECTED",
      };
    }

    console.log("[ImageValidation] Image approved:", file.name);

    return {
      approved: true,
      category: result.category || "safe",
      confidence: result.confidence,
    };
  } catch (error) {
    console.error("[ImageValidation] Network error:", error);

    // Network error: Still allow retry
    return {
      approved: false,
      error: "Network error. Please check your connection and try again.",
      code: "NETWORK_ERROR",
    };
  }
}

/**
 * Validate multiple images
 */
export async function validateImages(
  files: File[],
): Promise<Map<File, ImageValidationResult>> {
  const results = new Map<File, ImageValidationResult>();

  for (const file of files) {
    const result = await validateImage(file);
    results.set(file, result);

    // Stop validation on first critical error
    if (
      result.code === "NETWORK_ERROR" ||
      result.code === "RATE_LIMIT_EXCEEDED"
    ) {
      break;
    }
  }

  return results;
}

/**
 * Get user-friendly error message
 */
export function getValidationErrorMessage(
  result: ImageValidationResult,
): string {
  if (result.approved) {
    return "";
  }

  switch (result.code) {
    case "INVALID_FILE_TYPE":
      return "Please upload an image file (PNG, JPG, WebP, GIF)";

    case "FILE_TOO_LARGE":
      return result.error || "File size is too large";

    case "NSFW_CONTENT_DETECTED":
      return "This image contains prohibited content. Please select a different image.";

    case "RATE_LIMIT_EXCEEDED":
      return "Too many uploads. Please wait a moment and try again.";

    case "NETWORK_ERROR":
      return "Network connection error. Please check your internet and try again.";

    case "VALIDATION_ERROR":
      return "Image validation failed. Please try again or contact support.";

    default:
      return result.error || "Image validation failed. Please try again.";
  }
}
