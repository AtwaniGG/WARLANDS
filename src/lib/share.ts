// Shareable links + X/Twitter intents for viral loops. Every share link carries the sharer's `?ref`
// referral code, so a click that converts becomes an attributed referral. The OG preview cards for
// these landing URLs are rendered server-side by /api/og/* (see src/app/s/* + src/app/api/og/*).

const FALLBACK_ORIGIN = "https://warlands-nine.vercel.app";

/** The public site origin — env first (NEXT_PUBLIC_SITE_URL), then the live origin, then a fallback. */
export function siteOrigin(): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/+$/, "");
  if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
  return FALLBACK_ORIGIN;
}

function qs(params: Record<string, string | number | undefined>): string {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === "" || (typeof v === "number" && !Number.isFinite(v))) continue;
    u.set(k, String(v));
  }
  return u.toString();
}

/** Build a public share/landing URL (renders an OG card + a CTA into the game with the ref attached). */
export function shareUrl(path: string, params: Record<string, string | number | undefined> = {}): string {
  const query = qs(params);
  return `${siteOrigin()}${path}${query ? `?${query}` : ""}`;
}

/** A tweet-intent URL that posts `text` + a link to the share page. */
export function xIntent(text: string, url: string): string {
  return `https://twitter.com/intent/tweet?${qs({ text, url })}`;
}

export interface RaidShare { stars: number; loot: number; dpct: number; troph: number; def?: string; ref?: string }
export function raidShare(p: RaidShare): { url: string; intent: string } {
  const url = shareUrl("/s/raid", { stars: p.stars, loot: p.loot, dpct: p.dpct, troph: p.troph, def: p.def, ref: p.ref });
  const text = p.stars >= 3
    ? `Just 3-starred a base for ${p.loot.toLocaleString()} loot in WARLANDS ⚔️ Come take a swing:`
    : `Raided a base for ${p.loot.toLocaleString()} loot (${p.dpct}% wiped) in WARLANDS ⚔️ Think you can do better?`;
  return { url, intent: xIntent(text, url) };
}

export interface RankShare { league: string; trophies: number; ref?: string }
export function rankShare(p: RankShare): { url: string; intent: string } {
  const url = shareUrl("/s/rank", { league: p.league, troph: p.trophies, ref: p.ref });
  return { url, intent: xIntent(`${p.league} league · ${p.trophies.toLocaleString()} 🏆 in WARLANDS. Outrank me:`, url) };
}

export interface ClanShare { clan: string; members: number; ref?: string }
export function clanShare(p: ClanShare): { url: string; intent: string } {
  const url = shareUrl("/s/clan", { clan: p.clan, members: p.members, ref: p.ref });
  return { url, intent: xIntent(`Join my clan "${p.clan}" in WARLANDS — ${p.members} commanders strong. Enlist:`, url) };
}

/** The bare referral invite link (for copy buttons / "invite & earn"). */
export function inviteUrl(ref: string): string {
  return shareUrl("/", { ref });
}
export function inviteShare(ref: string): { url: string; intent: string } {
  const url = inviteUrl(ref);
  return { url, intent: xIntent("I'm building a base in WARLANDS ⚔️ a base-builder on a live map with real $HEXAR rewards. Use my link for a starter bonus:", url) };
}
