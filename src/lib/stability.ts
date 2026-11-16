/**
 * Stability AI image generation. Admin-only: the one caller is
 * /api/images/generate (the cover button on the admin journey form) plus a few
 * one-off scripts. Nothing public depends on it.
 *
 * RETIRING: Stability's notice of 10 Nov 2026 says its image endpoints leave
 * api.stability.ai on 10 Dec 2026 and move to ComfyUI (new account, new API
 * key, new URL; Stability credits do not carry over). Decided 16 Nov 2026 to
 * leave this as it is: after 10 Dec the call fails with Stability's error and
 * the admin form shows it. Moving needs a ComfyUI account and key first.
 */
const STABILITY_API_URL =
  "https://api.stability.ai/v2beta/stable-image/generate/core";

export async function generateImage(prompt: string): Promise<Buffer> {
  const apiKey = process.env.STABILITY_AI_API_KEY;
  if (!apiKey) {
    throw new Error("STABILITY_AI_API_KEY is not configured");
  }

  const formData = new FormData();
  formData.append("prompt", prompt);
  formData.append("output_format", "png");
  formData.append("aspect_ratio", "16:9");

  const response = await fetch(STABILITY_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "image/*",
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Stability AI error (${response.status}): ${errorText}`
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
