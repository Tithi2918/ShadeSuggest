// STUB — will be replaced by teammate's real CV implementation.
// Honors the documented return shape: { ok, bitmap, dataUrl, width, height, error }
import { IMAGE_CONSTRAINTS } from '@utils/constants';

/**
 * Ingest an image File and return a validated bitmap + metadata.
 * @param {File} file
 * @returns {Promise<{ ok: boolean, bitmap?: ImageBitmap, dataUrl?: string, width?: number, height?: number, error?: string }>}
 */
export async function ingestImage(file) {
  if (!file) return { ok: false, error: 'No file provided.' };

  if (!IMAGE_CONSTRAINTS.ALLOWED_TYPES.includes(file.type)) {
    return { ok: false, error: 'Unsupported file type. Please upload a JPEG, PNG, or WebP image.' };
  }

  if (file.size > IMAGE_CONSTRAINTS.MAX_SIZE_BYTES) {
    return { ok: false, error: 'File is too large. Maximum size is 10 MB.' };
  }

  try {
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Failed to read file.'));
      reader.readAsDataURL(file);
    });

    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;

    if (width < IMAGE_CONSTRAINTS.MIN_WIDTH || height < IMAGE_CONSTRAINTS.MIN_HEIGHT) {
      bitmap.close();
      return {
        ok: false,
        error: `Image too small. Minimum resolution is ${IMAGE_CONSTRAINTS.MIN_WIDTH}×${IMAGE_CONSTRAINTS.MIN_HEIGHT}px.`,
      };
    }

    return { ok: true, bitmap, dataUrl, width, height };
  } catch (err) {
    return { ok: false, error: err.message || 'Image ingestion failed.' };
  }
}
