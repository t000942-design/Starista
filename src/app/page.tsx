"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

type AgeRange = "4-6" | "7-9" | "10-12";
type StoryPage = { pageNumber: number; text: string; imageUrl?: string | null };
type Story = { title: string; pages: StoryPage[] };

const AGE_OPTIONS: { value: AgeRange; label: string }[] = [
  { value: "4-6", label: "Ages 4–6" },
  { value: "7-9", label: "Ages 7–9" },
  { value: "10-12", label: "Ages 10–12" },
];

const IDEA_EXAMPLES = [
  "A shy octopus who learns to play the trumpet",
  "A small dragon who is afraid of fire",
  "Two best friends find a door inside a tree",
  "A robot who wants to grow a flower",
];

export default function Home() {
  const [idea, setIdea] = useState("");
  const [age, setAge] = useState<AgeRange>("4-6");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [story, setStory] = useState<Story | null>(null);
  const [pageIndex, setPageIndex] = useState(0);

  // Per-page narration cache: pageNumber -> blob URL
  const audioCache = useRef<Map<number, string>>(new Map());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [narrating, setNarrating] = useState(false);
  const [narrateError, setNarrateError] = useState<string | null>(null);

  useEffect(() => {
    // Stop playback when changing pages or stories
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setNarrating(false);
    setNarrateError(null);
  }, [pageIndex, story]);

  async function readPage() {
    if (!story) return;
    const page = story.pages[pageIndex];
    if (!page) return;

    setNarrateError(null);

    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setNarrating(false);
      return;
    }

    let url = audioCache.current.get(page.pageNumber);
    if (!url) {
      try {
        setNarrating(true);
        const textWithTitle =
          pageIndex === 0 ? `${story.title}. ${page.text}` : page.text;
        const res = await fetch("/api/narrate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: textWithTitle }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error ?? `Narration failed (${res.status}).`);
        }
        const blob = await res.blob();
        url = URL.createObjectURL(blob);
        audioCache.current.set(page.pageNumber, url);
      } catch (err) {
        setNarrating(false);
        setNarrateError(
          err instanceof Error ? err.message : "Narration failed."
        );
        return;
      }
    }

    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => setNarrating(false);
    audio.onerror = () => {
      setNarrating(false);
      setNarrateError("Couldn't play audio.");
    };
    setNarrating(true);
    audio.play().catch(() => {
      setNarrating(false);
      setNarrateError("Couldn't play audio.");
    });
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (idea.trim().length < 4) {
      setError("Please share a story idea (a few words is enough).");
      return;
    }
    setLoading(true);
    setStory(null);
    setPageIndex(0);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, age }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Something went wrong. Please try again.");
      } else {
        setStory(data as Story);
      }
    } catch {
      setError("Could not reach the story service. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setStory(null);
    setError(null);
    setPageIndex(0);
  }

  return (
    <>
      <header className="sticky top-0 z-10 backdrop-blur bg-[rgba(11,13,18,0.6)] border-b border-[var(--border)]">
        <div className="max-w-[1100px] mx-auto px-6 h-16 flex items-center justify-between">
          <a href="#" className="inline-flex items-center gap-2.5 font-bold">
            <span className="grid place-items-center w-7 h-7 rounded-lg btn-primary text-white font-extrabold">
              S
            </span>
            <span>Storista</span>
          </a>
          <span className="text-[var(--muted)] text-sm hidden sm:inline">
            Bedtime stories, made just for them.
          </span>
        </div>
      </header>

      <main className="flex-1 px-6 py-10 sm:py-16">
        <div className="max-w-[820px] mx-auto">
          {!story && (
            <section className="text-center">
              <span className="inline-block px-3 py-1.5 border border-[var(--border)] rounded-full text-[var(--muted)] text-xs mb-4">
                ✨ Free · No sign-up
              </span>
              <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight">
                Tell us an idea, get a{" "}
                <span className="gradient-text">4-page story</span>.
              </h1>
              <p className="mt-3 text-[var(--muted)] max-w-[600px] mx-auto">
                Type any tiny spark — a character, a place, a feeling — and we&apos;ll
                turn it into a kind, age-perfect bedtime story.
              </p>

              <form onSubmit={onSubmit} className="mt-8 text-left">
                <label
                  htmlFor="idea"
                  className="block text-sm font-medium mb-2"
                >
                  What should the story be about?
                </label>
                <textarea
                  id="idea"
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  rows={4}
                  maxLength={800}
                  placeholder="e.g. A shy little fox who finds a glowing stone in the forest…"
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-base outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[rgba(124,92,255,0.25)] resize-none"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {IDEA_EXAMPLES.map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => setIdea(ex)}
                      className="text-xs text-[var(--muted)] border border-[var(--border)] hover:border-[#2f3547] hover:text-white rounded-full px-3 py-1.5 transition"
                    >
                      {ex}
                    </button>
                  ))}
                </div>

                <fieldset className="mt-6">
                  <legend className="block text-sm font-medium mb-2">
                    Who is it for?
                  </legend>
                  <div className="grid grid-cols-3 gap-2">
                    {AGE_OPTIONS.map((opt) => {
                      const active = opt.value === age;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setAge(opt.value)}
                          aria-pressed={active}
                          className={`px-3 py-2.5 rounded-lg text-sm font-medium border transition ${
                            active
                              ? "btn-primary text-white border-transparent"
                              : "bg-[var(--surface)] border-[var(--border)] text-[var(--muted)] hover:text-white hover:border-[#2f3547]"
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                {error && (
                  <p className="mt-4 text-sm text-red-400" role="alert">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-6 w-full sm:w-auto px-6 py-3.5 rounded-xl btn-primary text-white font-semibold text-base disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Writing & illustrating… (about a minute)
                    </>
                  ) : (
                    <>✨ Create my story</>
                  )}
                </button>
              </form>
            </section>
          )}

          {story && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={reset}
                  className="text-sm text-[var(--muted)] hover:text-white inline-flex items-center gap-1"
                >
                  ← New story
                </button>
                <span className="text-xs text-[var(--muted)]">
                  Page {pageIndex + 1} of {story.pages.length}
                </span>
              </div>

              <article className="bg-[var(--bg-elev)] border border-[var(--border)] rounded-3xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
                <div className="w-full aspect-[16/9] bg-[var(--surface)] border-b border-[var(--border)] flex items-center justify-center overflow-hidden">
                  {story.pages[pageIndex]?.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={story.pages[pageIndex]!.imageUrl!}
                      alt={`Illustration for page ${pageIndex + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center px-6">
                      <div className="text-4xl mb-2 opacity-40">🖼️</div>
                      <p className="text-sm text-[var(--muted)]">
                        Illustration unavailable
                      </p>
                      <p className="text-xs text-[var(--muted)] mt-1 opacity-70">
                        Add OpenRouter credits or set IMAGE_PROVIDER=lumen
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-6 sm:p-10 min-h-[240px]">
                  {pageIndex === 0 && (
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight gradient-text mb-4">
                      {story.title}
                    </h2>
                  )}
                  <div className="text-base sm:text-lg leading-relaxed whitespace-pre-wrap">
                    {story.pages[pageIndex]?.text}
                  </div>

                  <div className="mt-5 flex items-center gap-3">
                    <button
                      onClick={readPage}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[var(--border)] hover:border-[#2f3547] text-sm font-medium transition"
                    >
                      {narrating ? (
                        <>
                          <span className="inline-block w-3.5 h-3.5 border-2 border-[var(--muted)] border-t-white rounded-full animate-spin" />
                          Reading…
                        </>
                      ) : (
                        <>🔊 Read aloud</>
                      )}
                    </button>
                    {narrateError && (
                      <span className="text-xs text-red-400">{narrateError}</span>
                    )}
                  </div>
                </div>
              </article>

              <div className="mt-5 flex items-center justify-between gap-3">
                <button
                  onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
                  disabled={pageIndex === 0}
                  className="px-4 py-2.5 rounded-lg border border-[var(--border)] text-sm font-medium hover:border-[#2f3547] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>

                <div className="flex gap-1.5">
                  {story.pages.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPageIndex(i)}
                      aria-label={`Go to page ${i + 1}`}
                      className={`w-2.5 h-2.5 rounded-full transition ${
                        i === pageIndex ? "bg-[var(--primary)]" : "bg-[var(--border)]"
                      }`}
                    />
                  ))}
                </div>

                {pageIndex < story.pages.length - 1 ? (
                  <button
                    onClick={() =>
                      setPageIndex((i) => Math.min(story.pages.length - 1, i + 1))
                    }
                    className="px-4 py-2.5 rounded-lg btn-primary text-white text-sm font-semibold"
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    onClick={reset}
                    className="px-4 py-2.5 rounded-lg btn-primary text-white text-sm font-semibold"
                  >
                    The End ✨
                  </button>
                )}
              </div>
            </section>
          )}
        </div>
      </main>

      <footer className="border-t border-[var(--border)] py-6 text-sm text-[var(--muted)]">
        <div className="max-w-[1100px] mx-auto px-6 flex flex-wrap items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} Storista. Stories made with care.</p>
          <span className="text-xs">A free service. No accounts, no ads.</span>
        </div>
      </footer>
    </>
  );
}
