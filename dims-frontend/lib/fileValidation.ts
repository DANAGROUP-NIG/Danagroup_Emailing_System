/**
 * File validation utilities for DIMS
 *
 * Security features:
 * - Magic byte validation (file type verification beyond MIME)
 * - EXIF metadata stripping for images
 * - File extension validation
 * - MIME type allowlist checking
 */

// Magic bytes for common file types
const MAGIC_BYTES: Record<string, number[][]> = {
  // PDF: %PDF
  "application/pdf": [[0x25, 0x50, 0x44, 0x46]],
  // JPEG: FF D8 FF
  "image/jpeg": [
    [0xff, 0xd8, 0xff, 0xe0], // JFIF
    [0xff, 0xd8, 0xff, 0xe1], // Exif
    [0xff, 0xd8, 0xff, 0xee], // JPEG
    [0xff, 0xd8, 0xff, 0xdb], // JPEG raw
  ],
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  "image/png": [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  // GIF: GIF87a or GIF89a
  "image/gif": [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
  ],
  // WebP: RIFF....WEBP
  "image/webp": [[0x52, 0x49, 0x46, 0x46]], // First 4 bytes, need to check WEBP at offset 8
  // DOC/XLS (old Office): D0 CF 11 E0
  "application/msword": [[0xd0, 0xcf, 0x11, 0xe0]],
  "application/vnd.ms-excel": [[0xd0, 0xcf, 0x11, 0xe0]],
  // DOCX/XLSX (OOXML): 50 4B 03 04 (ZIP header)
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    [0x50, 0x4b, 0x03, 0x04],
  ],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
    [0x50, 0x4b, 0x03, 0x04],
  ],
};

/**
 * Validate file by checking magic bytes against expected values
 * This prevents MIME type spoofing attacks
 *
 * @param file - File to validate
 * @param expectedMimeType - Expected MIME type based on file extension/MIME
 * @returns Promise<boolean> - True if magic bytes match expected type
 */
export async function validateMagicBytes(
  file: File,
  expectedMimeType: string,
): Promise<boolean> {
  // Skip validation for types without magic byte definitions
  if (!MAGIC_BYTES[expectedMimeType]) {
    // For unknown types, accept but log warning in development
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn(`[Security] No magic byte validation for type: ${expectedMimeType}`);
    }
    return true;
  }

  try {
    // Read first 8 bytes of file
    const header = await file.slice(0, 8).arrayBuffer();
    const bytes = new Uint8Array(header);

    // Special handling for WebP (need to check RIFF + WEBP)
    if (expectedMimeType === "image/webp") {
      const isRIFF =
        bytes[0] === 0x52 &&
        bytes[1] === 0x49 &&
        bytes[2] === 0x46 &&
        bytes[3] === 0x46;
      if (!isRIFF) return false;

      // Read bytes 8-12 for WEBP signature
      const webpHeader = await file.slice(8, 12).arrayBuffer();
      const webpBytes = new Uint8Array(webpHeader);
      const isWEBP =
        webpBytes[0] === 0x57 &&
        webpBytes[1] === 0x45 &&
        webpBytes[2] === 0x42 &&
        webpBytes[3] === 0x50;
      return isWEBP;
    }

    // Check against all possible magic byte signatures for this type
    const signatures = MAGIC_BYTES[expectedMimeType];
    return signatures.some((signature) => {
      if (bytes.length < signature.length) return false;
      for (let i = 0; i < signature.length; i++) {
        if (bytes[i] !== signature[i]) return false;
      }
      return true;
    });
  } catch {
    return false;
  }
}

/**
 * Strip EXIF metadata from image files
 * Uses canvas-based approach for browser-side EXIF stripping
 *
 * @param file - Image file to process
 * @returns Promise<Blob> - New Blob with EXIF data removed
 */
export async function stripExifMetadata(file: File): Promise<Blob> {
  // Only process image files
  if (!file.type.startsWith("image/")) {
    return file;
  }

  // Skip GIFs (canvas can't handle animated GIFs well)
  if (file.type === "image/gif") {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to create canvas context"));
        return;
      }

      // Draw image without EXIF
      ctx.drawImage(img, 0, 0);

      // Convert to blob with same MIME type but without EXIF
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to create blob from canvas"));
          }
        },
        file.type,
        0.95, // Quality for JPEG
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}

/**
 * Get safe file extension from filename
 *
 * @param filename - Original filename
 * @returns string - Lowercase extension without dot
 */
export function getFileExtension(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  return ext;
}

/**
 * Check if file extension matches MIME type
 * Helps detect mismatched file types
 *
 * @param filename - Original filename
 * @param mimeType - Declared MIME type
 * @returns boolean - True if extension matches MIME type
 */
export function isValidExtensionForMimeType(
  filename: string,
  mimeType: string,
): boolean {
  const ext = getFileExtension(filename);

  const mimeToExt: Record<string, string[]> = {
    "application/pdf": ["pdf"],
    "application/msword": ["doc"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
      "docx",
    ],
    "application/vnd.ms-excel": ["xls"],
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ["xlsx"],
    "image/jpeg": ["jpg", "jpeg"],
    "image/png": ["png"],
    "image/gif": ["gif"],
    "image/webp": ["webp"],
  };

  const validExts = mimeToExt[mimeType];
  if (!validExts) return true; // Unknown type, accept

  return validExts.includes(ext);
}

/**
 * Format file size for display
 *
 * @param bytes - Size in bytes
 * @returns string - Formatted size (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Validate file against all security checks
 *
 * @param file - File to validate
 * @param allowedTypes - Array of allowed MIME types
 * @param maxSize - Maximum file size in bytes
 * @returns Promise<{ valid: boolean; error?: string }>
 */
export async function validateFileSecurity(
  file: File,
  allowedTypes: string[],
  maxSize: number,
): Promise<{ valid: boolean; error?: string }> {
  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large: ${file.name} (max ${formatFileSize(maxSize)})`,
    };
  }

  // Check MIME type against allowlist
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type not allowed: ${file.name}`,
    };
  }

  // Check file extension matches MIME type
  if (!isValidExtensionForMimeType(file.name, file.type)) {
    return {
      valid: false,
      error: `File extension does not match MIME type: ${file.name}`,
    };
  }

  // Validate magic bytes
  const magicBytesValid = await validateMagicBytes(file, file.type);
  if (!magicBytesValid) {
    return {
      valid: false,
      error: `File type mismatch detected (magic bytes): ${file.name}`,
    };
  }

  return { valid: true };
}
