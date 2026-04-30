"use client";

import { useState, type FormEvent } from "react";

export default function Home() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setMsg({ text: "Please enter a valid email address.", ok: false });
      return;
    }
    if (typeof window !== "undefined") {
      const list = JSON.parse(
        localStorage.getItem("storista:waitlist") || "[]"
      ) as string[];
      if (!list.includes(value)) list.push(value);
      localStorage.setItem("storista:waitlist", JSON.stringify(list));
    }
    setMsg({ text: "You're on the list — we'll be in touch soon. ✨", ok: true });
    setEmail("");
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
          <nav className="flex items-center gap-4 text-sm">
            <a className="hidden sm:inline text-[var(--muted)] hover:text-white" href="#features">
              Features
            </a>
            <a className="hidden sm:inline text-[var(--muted)] hover:text-white" href="#pricing">
              Pricing
            </a>
            <a className="hidden sm:inline text-[var(--muted)] hover:text-white" href="#about">
              About
            </a>
            <a
              href="#cta"
              className="px-4 py-2 rounded-lg border border-[var(--border)] hover:border-[#2f3547] transition"
            >
              Sign in
            </a>
            <a
              href="#cta"
              className="px-4 py-2 rounded-lg btn-primary text-white font-semibold transition"
            >
              Get started
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="px-6 pt-20 pb-16 text-center">
          <div className="max-w-[1100px] mx-auto">
            <span className="inline-block px-3 py-1.5 border border-[var(--border)] rounded-full text-[var(--muted)] text-xs mb-4">
              New · Now in private beta
            </span>
            <h1 className="text-4xl sm:text-6xl font-bold leading-[1.05] tracking-tight">
              Tell your story, <span className="gradient-text">beautifully</span>.
            </h1>
            <p className="mt-4 text-lg text-[var(--muted)] max-w-[640px] mx-auto">
              Storista is the modern home for creators to capture, craft, and share
              stories that resonate — without wrestling with tools.
            </p>

            <form
              onSubmit={onSubmit}
              className="mt-7 flex flex-col sm:flex-row gap-2 max-w-[480px] mx-auto"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                aria-label="Email address"
                className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3.5 py-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[rgba(124,92,255,0.25)]"
              />
              <button
                type="submit"
                className="px-4 py-3 rounded-lg btn-primary text-white font-semibold"
              >
                Join the waitlist
              </button>
            </form>
            <p
              role="status"
              aria-live="polite"
              className={`mt-3 text-sm min-h-[1.4em] ${
                msg ? (msg.ok ? "text-emerald-400" : "text-red-400") : "text-[var(--muted)]"
              }`}
            >
              {msg?.text ?? ""}
            </p>
          </div>
        </section>

        <section id="features" className="px-6 py-16">
          <div className="max-w-[1100px] mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-center mb-8">
              Built for storytellers, not toolmakers.
            </h2>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: "✍️",
                  title: "Distraction-free writing",
                  body: "A focused canvas that gets out of your way and lets the words flow.",
                },
                {
                  icon: "🎨",
                  title: "Beautiful by default",
                  body: "Hand-tuned typography and layouts that look polished from the first draft.",
                },
                {
                  icon: "🌐",
                  title: "Share anywhere",
                  body: "Publish to the web, export to PDF, or syndicate to your favorite platforms.",
                },
                {
                  icon: "🤝",
                  title: "Collaborate live",
                  body: "Invite editors and collaborators with granular permissions and history.",
                },
              ].map((f) => (
                <article
                  key={f.title}
                  className="bg-[var(--bg-elev)] border border-[var(--border)] rounded-2xl p-5 shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:-translate-y-0.5 hover:border-[#2f3547] transition"
                >
                  <div className="text-2xl mb-2">{f.icon}</div>
                  <h3 className="text-base font-semibold mb-1">{f.title}</h3>
                  <p className="text-sm text-[var(--muted)]">{f.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="px-6 py-16">
          <div className="max-w-[1100px] mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-center">
              Simple pricing.
            </h2>
            <p className="text-[var(--muted)] text-center mt-2 mb-8">
              Start free. Upgrade when your story finds its audience.
            </p>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  name: "Starter",
                  price: "$0",
                  features: ["Up to 3 stories", "Basic themes", "Community support"],
                  cta: "Get started",
                  primary: false,
                },
                {
                  name: "Creator",
                  price: "$9",
                  features: [
                    "Unlimited stories",
                    "Premium themes",
                    "Custom domain",
                    "Priority support",
                  ],
                  cta: "Start free trial",
                  primary: true,
                },
                {
                  name: "Studio",
                  price: "$29",
                  features: [
                    "Team collaboration",
                    "Brand kit",
                    "Analytics",
                    "SSO & audit logs",
                  ],
                  cta: "Contact sales",
                  primary: false,
                },
              ].map((p) => (
                <article
                  key={p.name}
                  className={`relative bg-[var(--bg-elev)] border rounded-2xl p-5 flex flex-col gap-2 ${
                    p.primary
                      ? "border-[rgba(124,92,255,0.6)] shadow-[0_10px_30px_rgba(124,92,255,0.18)]"
                      : "border-[var(--border)]"
                  }`}
                >
                  {p.primary && (
                    <span className="absolute -top-2.5 right-4 btn-primary text-white text-[11px] tracking-wide uppercase px-2 py-1 rounded-full">
                      Most popular
                    </span>
                  )}
                  <h3 className="text-lg font-semibold">{p.name}</h3>
                  <p className="text-3xl font-bold mt-1">
                    {p.price}
                    <span className="text-sm text-[var(--muted)] font-medium">/mo</span>
                  </p>
                  <ul className="mt-2 mb-3 text-sm text-[var(--muted)]">
                    {p.features.map((f) => (
                      <li
                        key={f}
                        className="py-1.5 border-b border-dashed border-[var(--border)] last:border-b-0"
                      >
                        {f}
                      </li>
                    ))}
                  </ul>
                  <a
                    href="#cta"
                    className={`mt-auto text-center px-4 py-2 rounded-lg text-sm font-semibold ${
                      p.primary
                        ? "btn-primary text-white"
                        : "border border-[var(--border)] hover:border-[#2f3547]"
                    }`}
                  >
                    {p.cta}
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="cta" className="px-6 py-20">
          <div className="max-w-[1100px] mx-auto text-center bg-[linear-gradient(180deg,rgba(124,92,255,0.12),rgba(34,211,238,0.06))] border border-[var(--border)] rounded-3xl p-10">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Ready to begin?
            </h2>
            <p className="text-[var(--muted)] mt-2 mb-5">
              Be one of the first to experience Storista.
            </p>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                const input = document.querySelector(
                  'input[type="email"]'
                ) as HTMLInputElement | null;
                input?.scrollIntoView({ behavior: "smooth", block: "center" });
                input?.focus();
              }}
              className="inline-block px-6 py-3.5 rounded-xl btn-primary text-white font-semibold text-base"
            >
              Join the waitlist
            </a>
          </div>
        </section>
      </main>

      <footer
        id="about"
        className="border-t border-[var(--border)] py-6 text-sm text-[var(--muted)]"
      >
        <div className="max-w-[1100px] mx-auto px-6 flex flex-wrap items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} Storista. Crafted with care.</p>
          <nav className="flex gap-4">
            <a href="#" className="hover:text-white">
              Privacy
            </a>
            <a href="#" className="hover:text-white">
              Terms
            </a>
            <a href="mailto:hello@storista.app" className="hover:text-white">
              Contact
            </a>
          </nav>
        </div>
      </footer>
    </>
  );
}
