import { NextResponse } from "next/server";

export const runtime = "nodejs";

type AgeRange = "4-6" | "7-9" | "10-12";

type StoryPage = { pageNumber: number; text: string };
type Story = { title: string; pages: StoryPage[] };

const AGE_GUIDANCE: Record<AgeRange, string> = {
  "4-6":
    "Use very simple, short sentences (5–10 words). Friendly, playful tone. Lots of repetition and onomatopoeia. About 50–80 words per page.",
  "7-9":
    "Use clear, vivid sentences with some descriptive language. Mild gentle humor. About 90–130 words per page.",
  "10-12":
    "Use rich vocabulary and a few longer sentences. A small amount of inner thought is okay. About 140–200 words per page.",
};

function buildPrompt(idea: string, age: AgeRange) {
  return `You are a friendly children's book author. Write an original 4-page bedtime story for kids aged ${age}.

Rules:
- Audience age: ${age}. ${AGE_GUIDANCE[age]}
- Exactly 4 pages, each a continuous prose passage (no bullet lists, no chapter headings).
- Page 1 introduces the character and setting.
- Page 2 sets up a small problem or quest.
- Page 3 shows the character trying and learning.
- Page 4 ends with a warm, hopeful resolution and a one-sentence gentle takeaway.
- Keep it kind, safe, and age-appropriate. No violence, no scary content, no romance, no brand names.
- Give the story a short, catchy title (max 6 words).

Story idea from the customer:
"""
${idea.trim()}
"""

Return ONLY a JSON object with this exact shape, no prose, no markdown fences:
{
  "title": "string",
  "pages": [
    { "pageNumber": 1, "text": "..." },
    { "pageNumber": 2, "text": "..." },
    { "pageNumber": 3, "text": "..." },
    { "pageNumber": 4, "text": "..." }
  ]
}`;
}

function tryParseStory(raw: string): Story | null {
  let text = raw.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    const parsed = JSON.parse(text.slice(start, end + 1));
    if (
      typeof parsed?.title === "string" &&
      Array.isArray(parsed?.pages) &&
      parsed.pages.length === 4 &&
      parsed.pages.every(
        (p: unknown) =>
          typeof p === "object" &&
          p !== null &&
          typeof (p as StoryPage).text === "string" &&
          typeof (p as StoryPage).pageNumber === "number"
      )
    ) {
      return parsed as Story;
    }
  } catch {
    return null;
  }
  return null;
}

export async function POST(req: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server is missing OPENROUTER_API_KEY." },
      { status: 500 }
    );
  }

  let body: { idea?: string; age?: AgeRange };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const idea = (body.idea ?? "").trim();
  const age = body.age ?? "4-6";

  if (idea.length < 4) {
    return NextResponse.json(
      { error: "Please share a story idea (a few words is enough)." },
      { status: 400 }
    );
  }
  if (idea.length > 800) {
    return NextResponse.json(
      { error: "Story idea is too long — keep it under 800 characters." },
      { status: 400 }
    );
  }
  if (!["4-6", "7-9", "10-12"].includes(age)) {
    return NextResponse.json({ error: "Invalid age range." }, { status: 400 });
  }

  const model = process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash";
  const prompt = buildPrompt(idea, age);

  let upstream: Response;
  try {
    upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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
        temperature: 0.9,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are a kind, imaginative children's book author. Always respond with valid JSON only.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach the story service. Please try again." },
      { status: 502 }
    );
  }

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => "");
    return NextResponse.json(
      {
        error: `Story service responded with ${upstream.status}.`,
        detail: detail.slice(0, 500),
      },
      { status: 502 }
    );
  }

  const data = (await upstream.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data?.choices?.[0]?.message?.content ?? "";
  const story = tryParseStory(content);

  if (!story) {
    return NextResponse.json(
      {
        error:
          "The story came back in an unexpected shape. Please try again with a different idea.",
      },
      { status: 502 }
    );
  }

  story.pages = story.pages
    .slice(0, 4)
    .map((p, i) => ({ pageNumber: i + 1, text: p.text.trim() }));

  return NextResponse.json(story);
}
