import type { Metadata } from "next";
import Link from "next/link";

// Public share/landing page for a clan recruitment. OG card at /api/og/clan; the body is a
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
  return `/api/og/clan${q ? `?${q}` : ""}`;
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
  const clan = one(sp.clan) || "our clan";
  const members = one(sp.members);

  const image = ogPath({ clan, members });
  const memNum = Number(members);
  const title = `Join "${clan}" in WARLANDS`;
  const description = Number.isFinite(memNum) && memNum > 0
    ? `${memNum.toLocaleString("en-US")} commanders strong. Enlist and raid together.`
    : "Enlist and raid together on a live world map.";

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

export default async function ClanSharePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const ref = one(sp.ref);
  const clan = one(sp.clan) || "our clan";
  const memNum = Number(one(sp.members));
  const members = Number.isFinite(memNum) && memNum > 0 ? Math.round(memNum) : 0;

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

      {/* drawn banner */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 96,
          height: 124,
          borderRadius: 10,
          background: "var(--surface-card)",
          border: "3px solid var(--amber)",
        }}
      >
        <span style={{ width: 36, height: 64, borderRadius: 4, background: "var(--amber)" }} />
      </div>

      <span style={{ fontSize: 16, letterSpacing: 4, color: "var(--text-lo)" }}>JOIN THE CLAN</span>
      <h1 style={{ fontSize: "clamp(40px, 9vw, 80px)", fontWeight: 800, color: "var(--amber)", margin: 0, lineHeight: 1.05 }}>
        {clan}
      </h1>
      <span style={{ fontSize: 18, color: "var(--text-lo)" }}>
        {members > 0 ? `${members.toLocaleString("en-US")} commander${members === 1 ? "" : "s"} strong` : "Recruiting commanders now"}
      </span>

      <p style={{ maxWidth: 520, color: "var(--text-lo)", fontSize: 18, lineHeight: 1.5, margin: 0 }}>
        A base-builder on a live world map with real $HEXAR rewards. Enlist, build, and raid together.
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
