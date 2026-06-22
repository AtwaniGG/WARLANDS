import type { Metadata } from "next";
import Link from "next/link";

// Public share/landing page for a raid victory. The OG card (/api/og/raid) gives the rich
// social preview; the body is a CTA into the game carrying the sharer's ?ref for attribution.
// In this Next version `searchParams` is a Promise — it must be awaited.

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

/** First value of a (possibly repeated) querystring param, trimmed. */
function one(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return (v[0] ?? "").trim();
  return (v ?? "").trim();
}

/** Build a /api/og/raid URL with only the params that are present. */
function ogPath(p: Record<string, string>): string {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) if (v) u.set(k, v);
  const q = u.toString();
  return `/api/og/raid${q ? `?${q}` : ""}`;
}

/** In-game CTA target — carry the ref through if present. */
function playHref(ref: string): string {
  return ref ? `/world?ref=${encodeURIComponent(ref)}` : "/world";
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const sp = await searchParams;
  const stars = one(sp.stars);
  const loot = one(sp.loot);
  const dpct = one(sp.dpct);
  const troph = one(sp.troph);
  const def = one(sp.def);

  const image = ogPath({ stars, loot, dpct, troph, def });
  const lootNum = Number(loot);
  const title =
    Number(stars) >= 3
      ? "Flawless victory in WARLANDS"
      : "Base raided in WARLANDS";
  const description = Number.isFinite(lootNum) && lootNum > 0
    ? `Looted ${lootNum.toLocaleString("en-US")} $HEXAR. Think you can do better?`
    : "Raid bases, take loot, climb the ladder. Think you can do better?";

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

export default async function RaidSharePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const ref = one(sp.ref);
  const stars = Math.max(0, Math.min(3, Math.round(Number(one(sp.stars)) || 0)));
  const lootNum = Number(one(sp.loot));
  const loot = Number.isFinite(lootNum) && lootNum > 0 ? lootNum.toLocaleString("en-US") : "—";
  const dpctNum = Number(one(sp.dpct));
  const dpct = Number.isFinite(dpctNum) ? Math.max(0, Math.min(100, Math.round(dpctNum))) : 0;

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
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

      <div style={{ display: "flex", gap: 8 }} aria-label={`${stars} of 3 stars`}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 22,
              height: 22,
              transform: "rotate(45deg)",
              background: i < stars ? "var(--amber)" : "transparent",
              border: `3px solid ${i < stars ? "var(--amber)" : "var(--border-default)"}`,
              borderRadius: 4,
            }}
          />
        ))}
      </div>

      <h1 style={{ fontSize: "clamp(34px, 7vw, 64px)", fontWeight: 800, color: "var(--amber)", margin: 0 }}>
        {stars >= 3 ? "Flawless victory" : "Base raided"}
      </h1>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 16,
          maxWidth: 720,
        }}
      >
        <Stat label="Loot taken" value={loot} accent />
        <Stat label="Destroyed" value={`${dpct}%`} />
      </div>

      <p style={{ maxWidth: 520, color: "var(--text-lo)", fontSize: 18, lineHeight: 1.5, margin: 0 }}>
        A Clash-style base-builder on a live world map, with real $HEXAR rewards. Build a base, raid your rivals, climb the ladder.
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

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minWidth: 180,
        padding: "18px 24px",
        borderRadius: 12,
        background: "var(--surface-card)",
        border: "1px solid var(--border-default)",
      }}
    >
      <span style={{ fontSize: 13, letterSpacing: 2, color: "var(--text-lo)" }}>{label.toUpperCase()}</span>
      <span style={{ fontSize: 34, fontWeight: 800, color: accent ? "var(--amber)" : "var(--text-hi)" }}>
        {value}
      </span>
    </div>
  );
}
