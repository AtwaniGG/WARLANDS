import { ImageResponse } from "next/og";

// Dynamic 1200x630 OG card for a clan-recruitment share (/s/clan). Flexbox only (Satori),
// no emoji, no large images — drawn shapes + text. nodejs runtime per project convention.
export const runtime = "nodejs";

const BG = "#070a10";
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

function str(v: string | null, fallback: string, max = 28): string {
  const s = (v ?? "").trim();
  if (!s) return fallback;
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const clan = str(searchParams.get("clan"), "a clan");
  const members = Math.round(num(searchParams.get("members"), 1, 0, 100_000));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: BG,
          backgroundImage: `radial-gradient(circle at 18% -10%, rgba(245,179,1,0.15), transparent 55%)`,
          padding: 64,
          fontFamily: "sans-serif",
          color: TEXT_HI,
        }}
      >
        {/* wordmark + tag */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ width: 16, height: 38, backgroundColor: AMBER, marginRight: 16 }} />
            <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: 6 }}>WARLANDS</div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: 2, color: TEXT_LO }}>
            CLAN RECRUITING
          </div>
        </div>

        {/* body: banner + copy */}
        <div style={{ display: "flex", alignItems: "center", marginTop: 56 }}>
          {/* drawn clan banner */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 150,
              height: 190,
              marginRight: 44,
              borderRadius: 12,
              backgroundColor: PANEL,
              border: `3px solid ${AMBER}`,
            }}
          >
            <div style={{ display: "flex", width: 56, height: 100, backgroundColor: AMBER, borderRadius: 6 }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 26, letterSpacing: 3, color: TEXT_LO }}>JOIN THE CLAN</div>
            <div style={{ fontSize: 84, fontWeight: 800, letterSpacing: -1, color: AMBER, marginTop: 4 }}>
              {clan}
            </div>
            <div style={{ fontSize: 30, color: TEXT_LO, marginTop: 12 }}>
              {`${members.toLocaleString("en-US")} commander${members === 1 ? "" : "s"} strong — enlist and raid together`}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            marginTop: "auto",
            paddingTop: 18,
            borderTop: `1px solid ${HAIRLINE}`,
            fontSize: 24,
            color: TEXT_LO,
          }}
        >
          Base-builder on a live map · real $HEXAR rewards
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
