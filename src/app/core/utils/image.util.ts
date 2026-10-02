/**
 * Client-side photo downscale before base64 upload.
 * Server JSON body is capped at 16mb (src/server.ts) — a batch of up to 8 raw
 * phone photos blows past that, so we resize to maxDim and re-encode as JPEG.
 */
export async function downscaleImage(
  file: File,
  maxDim = 1600,
  quality = 0.85,
): Promise<{ base64Data: string; contentType: string }> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });

  const fallback = { base64Data: dataUrl, contentType: file.type || 'image/jpeg' };
  if (typeof document === 'undefined') return fallback;

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Image decode failed'));
      el.src = dataUrl;
    });

    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    if (scale >= 1 && file.size < 1_500_000) return fallback;

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return fallback;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return { base64Data: canvas.toDataURL('image/jpeg', quality), contentType: 'image/jpeg' };
  } catch {
    return fallback;
  }
}
