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
