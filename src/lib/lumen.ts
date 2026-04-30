const LUMEN_URL = "https://app.lumenpro.io/mcp";

let cachedSessionId: string | null = null;

type JsonRpcResponse<T = unknown> =
  | { jsonrpc: "2.0"; id: number; result: T }
  | { jsonrpc: "2.0"; id: number; error: { code: number; message: string } };

function authHeaders(): Record<string, string> {
  const token = process.env.LUMEN_TOKEN;
  if (!token) throw new Error("Missing LUMEN_TOKEN env var");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
  };
}

async function rpc<T>(
  method: string,
  params: unknown,
  id: number,
  sessionId?: string
): Promise<{ result: T; sessionId: string | null }> {
  const headers = authHeaders();
  if (sessionId) headers["Mcp-Session-Id"] = sessionId;

  const res = await fetch(LUMEN_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
  });

  const newSession = res.headers.get("mcp-session-id") ?? sessionId ?? null;
  const contentType = res.headers.get("content-type") ?? "";

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Lumen ${method} ${res.status}: ${text.slice(0, 300)}`);
  }

  let body: JsonRpcResponse<T>;
  if (contentType.includes("text/event-stream")) {
    const text = await res.text();
    body = parseSseForId<T>(text, id);
  } else {
    body = (await res.json()) as JsonRpcResponse<T>;
  }

  if ("error" in body) {
    throw new Error(`Lumen ${method} error: ${body.error.message}`);
  }
  return { result: body.result, sessionId: newSession };
}

function parseSseForId<T>(raw: string, id: number): JsonRpcResponse<T> {
  // SSE frames are separated by blank lines; data: lines may span multiple lines
  const events = raw.split(/\r?\n\r?\n/);
  for (const ev of events) {
    const dataLines = ev
      .split(/\r?\n/)
      .filter((l) => l.startsWith("data:"))
      .map((l) => l.slice(5).trimStart());
    if (dataLines.length === 0) continue;
    const payload = dataLines.join("\n");
    try {
      const parsed = JSON.parse(payload) as JsonRpcResponse<T>;
      if ("id" in parsed && parsed.id === id) return parsed;
    } catch {
      // ignore non-JSON SSE frames (e.g., progress notifications)
    }
  }
  throw new Error(`Lumen SSE: no response for id ${id}`);
}

async function notify(method: string, sessionId: string): Promise<void> {
  const headers = authHeaders();
  headers["Mcp-Session-Id"] = sessionId;
  await fetch(LUMEN_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ jsonrpc: "2.0", method }),
  });
}

async function ensureSession(): Promise<string> {
  if (cachedSessionId) return cachedSessionId;
  const init = await rpc<unknown>(
    "initialize",
    {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "storista", version: "0.1.0" },
    },
    1
  );
  if (!init.sessionId) throw new Error("Lumen did not return a session id");
  cachedSessionId = init.sessionId;
  await notify("notifications/initialized", cachedSessionId);
  return cachedSessionId;
}

type ToolCallResult = {
  content: Array<
    | { type: "text"; text: string }
    | { type: "image"; data?: string; url?: string; mimeType?: string }
    | { type: string; [k: string]: unknown }
  >;
  isError?: boolean;
};

async function callTool(
  name: string,
  args: Record<string, unknown>,
  id: number
): Promise<ToolCallResult> {
  const sessionId = await ensureSession();
  try {
    const { result } = await rpc<ToolCallResult>(
      "tools/call",
      { name, arguments: args },
      id,
      sessionId
    );
    return result;
  } catch {
    // Session may have expired — try once more with a fresh session
    cachedSessionId = null;
    const fresh = await ensureSession();
    const { result } = await rpc<ToolCallResult>(
      "tools/call",
      { name, arguments: args },
      id + 1,
      fresh
    );
    return result;
  }
}

function extractImageUrl(result: ToolCallResult): string | null {
  if (result.isError) return null;
  for (const item of result.content) {
    if (item.type === "image") {
      const img = item as { url?: string; data?: string; mimeType?: string };
      if (img.url) return img.url;
      if (img.data) {
        const mime = img.mimeType ?? "image/png";
        return `data:${mime};base64,${img.data}`;
      }
    }
  }
  // Some Lumen responses put the URL inside a text block — sniff for it
  for (const item of result.content) {
    if (item.type === "text" && typeof (item as { text: string }).text === "string") {
      const text = (item as { text: string }).text;
      const match = text.match(/https?:\/\/\S+\.(?:png|jpg|jpeg|webp|gif)\b/i);
      if (match) return match[0];
    }
  }
  return null;
}

export async function generateImage(
  prompt: string,
  opts: { modelId?: number; aspectRatio?: string } = {}
): Promise<string | null> {
  const modelId = opts.modelId ?? Number(process.env.LUMEN_MODEL_ID ?? 19); // imagen-4
  const aspectRatio = opts.aspectRatio ?? process.env.LUMEN_ASPECT_RATIO ?? "16:9";

  const result = await callTool(
    "generate_image",
    { model_id: modelId, prompt, aspect_ratio: aspectRatio },
    1000 + Math.floor(Math.random() * 100000)
  );
  return extractImageUrl(result);
}

export async function generateImages(
  prompts: string[],
  opts: { modelId?: number; aspectRatio?: string } = {}
): Promise<(string | null)[]> {
  const settled = await Promise.allSettled(
    prompts.map((p) => generateImage(p, opts))
  );
  return settled.map((r) => (r.status === "fulfilled" ? r.value : null));
}
