import type { Metadata } from "next";
import Link from "next/link";

// Public share/landing page for a trophy/league rank. OG card at /api/og/rank; the body is a
// CTA into the game carrying the sharer's ?ref. `searchParams` is a Promise in this Next version.

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function one(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return (v[0] ?? "").trim();
  return (v ?? "").trim();
}

function ogPath(p: Record<string, string>): string {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) if (v) u.set(k, v);
  const q = u.toString();
  return `/api/og/rank${q ? `?${q}` : ""}`;
}

function playHref(ref: string): string {
  return ref ? `/world?ref=${encodeURIComponent(ref)}` : "/world";
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const sp = await searchParams;
  const league = one(sp.league) || "Unranked";
  const troph = one(sp.troph);

  const image = ogPath({ league, troph });
  const trophNum = Number(troph);
  const title = `${league} league in WARLANDS`;
  const description = Number.isFinite(trophNum) && trophNum > 0
    ? `${trophNum.toLocaleString("en-US")} trophies. Can you outrank me?`
    : "Climb the live-map trophy ladder. Can you outrank me?";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function RankSharePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const ref = one(sp.ref);
  const league = one(sp.league) || "Unranked";
  const trophNum = Number(one(sp.troph));
  const troph = Number.isFinite(trophNum) && trophNum > 0 ? trophNum.toLocaleString("en-US") : "—";

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        padding: "48px 24px",
        background: "var(--bg-app)",
        color: "var(--text-hi)",
        fontFamily: "var(--font-ui)",
        textAlign: "center",
      }}
    >
      <div style={{ display: "flex", gap: 10, alignItems: "center", letterSpacing: 6, fontWeight: 700, fontSize: 18 }}>
        <span style={{ display: "inline-block", width: 12, height: 26, background: "var(--amber)" }} />
        WARLANDS
      </div>

      {/* drawn crest */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 110,
          height: 110,
          borderRadius: 20,
          background: "var(--surface-card)",
          border: "3px solid var(--amber)",
        }}
      >
        <span style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--amber)" }} />
      </div>

      <span style={{ fontSize: 16, letterSpacing: 4, color: "var(--text-lo)" }}>{league.toUpperCase()} LEAGUE</span>
      <h1 style={{ fontSize: "clamp(48px, 11vw, 104px)", fontWeight: 800, color: "var(--amber)", margin: 0, lineHeight: 1 }}>
        {troph}
      </h1>
      <span style={{ fontSize: 18, color: "var(--text-lo)" }}>trophies earned</span>

      <p style={{ maxWidth: 520, color: "var(--text-lo)", fontSize: 18, lineHeight: 1.5, margin: 0 }}>
        A base-builder on a live world map with real $HEXAR rewards. Outrank me on the ladder.
      </p>

      <Link
        href={playHref(ref)}
        style={{
          marginTop: 8,
          padding: "16px 40px",
          borderRadius: 999,
          background: "var(--cta-bg)",
          color: "var(--cta-fg)",
          fontWeight: 800,
          fontSize: 18,
          letterSpacing: 2,
          textDecoration: "none",
        }}
      >
        PLAY WARLANDS
      </Link>
    </main>
  );
}
