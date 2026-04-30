import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const DEFAULT_VOICE = "EXAVITQu4vr4xnSDxMaL"; // Bella — warm, kid-friendly
const DEFAULT_MODEL = "eleven_turbo_v2_5";

export async function POST(req: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server is missing ELEVENLABS_API_KEY." },
      { status: 500 }
    );
  }

  let body: { text?: string; voiceId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const text = (body.text ?? "").trim();
  if (text.length < 1) {
    return NextResponse.json({ error: "Missing text." }, { status: 400 });
  }
  if (text.length > 3000) {
    return NextResponse.json(
      { error: "Text too long (max 3000 chars)." },
      { status: 400 }
    );
  }

  const voiceId =
    body.voiceId ?? process.env.ELEVENLABS_VOICE_ID ?? DEFAULT_VOICE;

  const upstream = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: DEFAULT_MODEL,
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.75,
          style: 0.4,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => "");
    return NextResponse.json(
      {
        error: `ElevenLabs responded with ${upstream.status}.`,
        detail: detail.slice(0, 400),
      },
      { status: 502 }
    );
  }

  const audio = await upstream.arrayBuffer();
  return new NextResponse(audio, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
