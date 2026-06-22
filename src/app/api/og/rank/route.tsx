import { ImageResponse } from "next/og";

// Dynamic 1200x630 OG card for a trophy/league-rank share (/s/rank). Flexbox only (Satori),
// no emoji, no large images — drawn shapes + text. nodejs runtime per project convention.
export const runtime = "nodejs";

const BG = "#0c0a04";
const PANEL = "#12161f";
const HAIRLINE = "#232b3a";
const AMBER = "#f5b301";
const TEXT_HI = "#e6e9ef";
const TEXT_LO = "#8a92a3";

function num(v: string | null, fallback: number, min: number, max: number): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function str(v: string | null, fallback: string, max = 24): string {
  const s = (v ?? "").trim();
  if (!s) return fallback;
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const league = str(searchParams.get("league"), "Unranked", 22);
  const troph = Math.round(num(searchParams.get("troph"), 0, 0, 1_000_000));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          backgroundColor: BG,
          backgroundImage: `radial-gradient(circle at 50% -20%, rgba(245,179,1,0.18), transparent 60%)`,
          padding: 64,
          fontFamily: "sans-serif",
          color: TEXT_HI,
        }}
      >
        {/* wordmark */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ width: 14, height: 34, backgroundColor: AMBER, marginRight: 14 }} />
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: 6 }}>WARLANDS</div>
        </div>

        {/* trophy crest — drawn shield shape */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 168,
            height: 168,
            marginTop: 40,
            borderRadius: 24,
            backgroundColor: PANEL,
            border: `3px solid ${AMBER}`,
            boxShadow: "0 0 0 1px rgba(245,179,1,0.4)",
          }}
        >
          <div
            style={{
              display: "flex",
              width: 84,
              height: 84,
              borderRadius: "50%",
              backgroundColor: AMBER,
            }}
          />
        </div>

        <div style={{ fontSize: 26, letterSpacing: 4, color: TEXT_LO, marginTop: 36 }}>
          {`${league.toUpperCase()} LEAGUE`}
        </div>
        <div style={{ fontSize: 132, fontWeight: 800, letterSpacing: -2, color: AMBER, marginTop: 4 }}>
          {troph.toLocaleString("en-US")}
        </div>
        <div style={{ fontSize: 30, color: TEXT_LO, marginTop: -6 }}>trophies earned · think you can outrank me?</div>

        <div
          style={{
            display: "flex",
            marginTop: "auto",
            paddingTop: 18,
            borderTop: `1px solid ${HAIRLINE}`,
            width: "100%",
            justifyContent: "center",
            fontSize: 24,
            color: TEXT_LO,
          }}
        >
          Climb the live-map ladder in WARLANDS
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
