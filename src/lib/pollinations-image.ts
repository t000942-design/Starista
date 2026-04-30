// Pollinations.ai — free public image generation API (no auth, no credits).
// We return the URL directly; the browser fetches it as an <img src>.

const POLLINATIONS_BASE = "https://image.pollinations.ai/prompt/";

export function generateImagePollinations(
  prompt: string,
  opts: { width?: number; height?: number; seed?: number; model?: string } = {}
): string {
  const width = opts.width ?? 768;
  const height = opts.height ?? 432;
  const seed = opts.seed ?? Math.floor(Math.random() * 1_000_000);
  const model = opts.model ?? process.env.POLLINATIONS_MODEL ?? "flux";

  const params = new URLSearchParams({
    width: String(width),
    height: String(height),
    seed: String(seed),
    nologo: "true",
    model,
  });

  return `${POLLINATIONS_BASE}${encodeURIComponent(prompt)}?${params.toString()}`;
}

export function generateImagesPollinations(prompts: string[]): string[] {
  // Each page gets a different random seed so the model varies the composition.
  return prompts.map((p, i) =>
    generateImagePollinations(p, {
      seed: Math.floor(Math.random() * 1_000_000) + i,
    })
  );
}
