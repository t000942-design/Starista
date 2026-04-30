type OpenRouterImage = {
  type?: string;
  image_url?: { url?: string };
  url?: string;
};

type OpenRouterImageResponse = {
  choices?: {
    message?: {
      content?: string | null;
      images?: OpenRouterImage[];
    };
  }[];
};

function extractImageUrl(data: OpenRouterImageResponse): string | null {
  const message = data.choices?.[0]?.message;
  if (!message) return null;

  const images = message.images ?? [];
  for (const img of images) {
    const url = img.image_url?.url ?? img.url;
    if (typeof url === "string" && url.length > 0) return url;
  }

  // Some models embed the URL or data URI in the text content as a fallback
  const text = message.content;
  if (typeof text === "string") {
    const match = text.match(
      /(?:data:image\/[a-z+]+;base64,[A-Za-z0-9+/=]+)|(?:https?:\/\/[^\s()\[\]]+?\.(?:png|jpg|jpeg|webp|gif)(?:\?[^\s()\[\]]*)?)/i
    );
    if (match) return match[0];
  }

  return null;
}

export async function generateImageOpenRouter(
  prompt: string,
  opts: { model?: string } = {}
): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("Missing OPENROUTER_API_KEY env var");

  const model =
    opts.model ??
    process.env.OPENROUTER_IMAGE_MODEL ??
    "google/gemini-2.5-flash-image";

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer":
        process.env.OPENROUTER_SITE_URL ?? "http://localhost:3000",
      "X-Title": process.env.OPENROUTER_SITE_NAME ?? "Storista",
    },
    body: JSON.stringify({
      model,
      modalities: ["image", "text"],
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `OpenRouter image ${res.status}: ${detail.slice(0, 300)}`
    );
  }

  const data = (await res.json()) as OpenRouterImageResponse;
  const url = extractImageUrl(data);
  if (!url) {
    console.warn(
      "[openrouter-image] no image url in response:",
      JSON.stringify(data).slice(0, 500)
    );
  }
  return url;
}

export async function generateImagesOpenRouter(
  prompts: string[],
  opts: { model?: string } = {}
): Promise<(string | null)[]> {
  const settled = await Promise.allSettled(
    prompts.map((p) => generateImageOpenRouter(p, opts))
  );
  return settled.map((r, i) => {
    if (r.status === "fulfilled") return r.value;
    console.warn(`[openrouter-image] image ${i + 1} failed:`, r.reason);
    return null;
  });
}
