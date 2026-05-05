/**
 * Captures a screenshot of the <main> element as a JPEG blob.
 * html2canvas is dynamically imported (~200KB) so it's only loaded on demand.
 * Returns null silently on any failure.
 */
export async function captureScreenshot(): Promise<Blob | null> {
  try {
    const mainEl = document.querySelector('main');
    if (!mainEl) return null;

    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(mainEl as HTMLElement, {
      useCORS: true,
      logging: false,
      scale: 1,
      backgroundColor: null,
    });

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.7);
    });
  } catch {
    return null;
  }
}
