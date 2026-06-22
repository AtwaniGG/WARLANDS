import { ImageResponse } from "next/og";

// Dynamic 1200x630 OG card for a raid-victory share (/s/raid). Rendered by Satori, so:
// flexbox only (no CSS grid), no emoji, no large embedded images — drawn shapes + text only.
// nodejs runtime keeps local font/file reads available (we use the bundled default font here).
export const runtime = "nodejs";

// Brand palette (mirrors src/app/globals.css design tokens).
const BG = "#070a10";
const PANEL = "#12161f";
const HAIRLINE = "#232b3a";
const AMBER = "#f5b301";
const TEXT_HI = "#e6e9ef";
const TEXT_LO = "#8a92a3";

/** Clamp a querystring value to a finite number, falling back when absent/garbage. */
function num(v: string | null, fallback: number, min: number, max: number): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/** Trim + length-cap an untrusted string (querystrings are never trusted). */
function str(v: string | null, fallback: string, max = 24): string {
  const s = (v ?? "").trim();
  if (!s) return fallback;
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const stars = Math.round(num(searchParams.get("stars"), 0, 0, 3));
  const loot = Math.round(num(searchParams.get("loot"), 0, 0, 1_000_000_000));
  const dpct = Math.round(num(searchParams.get("dpct"), 0, 0, 100));
  const troph = Math.round(num(searchParams.get("troph"), 0, -1000, 1_000_000));
  const def = str(searchParams.get("def"), "an enemy base");

  const trophStr = `${troph >= 0 ? "+" : ""}${troph.toLocaleString("en-US")}`;
  const headline = stars >= 3 ? "FLAWLESS VICTORY" : "BASE RAIDED";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: BG,
          backgroundImage: `radial-gradient(circle at 78% -10%, rgba(245,179,1,0.16), transparent 55%)`,
          padding: 64,
          fontFamily: "sans-serif",
          color: TEXT_HI,
        }}
      >
        {/* wordmark row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ width: 16, height: 38, backgroundColor: AMBER, marginRight: 16 }} />
            <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: 6, color: TEXT_HI }}>
              WARLANDS
            </div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: 2, color: TEXT_LO }}>
            RAID REPORT
          </div>
        </div>

        {/* headline + stars */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 44 }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 56,
                  height: 56,
                  marginRight: 14,
                  borderRadius: 8,
                  display: "flex",
                  transform: "rotate(45deg)",
                  backgroundColor: i < stars ? AMBER : "transparent",
                  border: `4px solid ${i < stars ? AMBER : HAIRLINE}`,
                }}
              />
            ))}
          </div>
          <div style={{ fontSize: 84, fontWeight: 800, letterSpacing: -1, marginTop: 24, color: AMBER }}>
            {headline}
          </div>
          <div style={{ fontSize: 30, color: TEXT_LO, marginTop: 8 }}>
            {`Smashed ${def} · ${dpct}% destroyed`}
          </div>
        </div>

        {/* stat slabs */}
        <div style={{ display: "flex", marginTop: "auto" }}>
          <Slab label="LOOT TAKEN" value={loot.toLocaleString("en-US")} accent />
          <Slab label="TROPHIES" value={trophStr} />
          <Slab label="STARS" value={`${stars} / 3`} />
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}

function Slab({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        marginRight: 20,
        padding: "24px 28px",
        borderRadius: 14,
        backgroundColor: PANEL,
        border: `1px solid ${HAIRLINE}`,
      }}
    >
      <div style={{ fontSize: 20, letterSpacing: 2, color: TEXT_LO }}>{label}</div>
      <div style={{ fontSize: 52, fontWeight: 800, marginTop: 6, color: accent ? AMBER : TEXT_HI }}>
        {value}
      </div>
    </div>
  );
}
