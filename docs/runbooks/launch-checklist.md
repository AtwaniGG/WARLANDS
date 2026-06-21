# WARLANDS — Mainnet Launch Checklist (everything, code & non-code)

Living checklist. Pairs with [mainnet-launch.md](mainnet-launch.md) (the how-to) and
[onchain/README.md](../../onchain/README.md) (the distributor).

Legend: ✅ done · 🟢 code I can do · 🔵 you/team · 🟣 external vendor

## Deployed now — open BETA (non-custodial)
- ✅ **Frontend** live on Vercel → **[warlands.xyz](https://warlands.xyz)** (apex DNS resolving)
- ✅ **Game server** live on Railway (`warlands-server` / `warlands-app`), hardened build, world restored
- ✅ **Trailer** rendered with ElevenLabs music + `warlands.xyz` CTA; **HEXAR honeycomb logo** is the favicon
- 🔒 Beta is **non-custodial**: real payouts OFF (`AUTH_REQUIRED` off so the live client keeps working;
  on-chain claims gated behind audit + multisig)

## The one-step goal (real-money flip)
When you have the token mint, going live for real is: **set env (via `go-live.mjs`) → deploy**.
Everything that can be prebuilt is prebuilt.

```bash
node scripts/go-live.mjs --mint <YOUR_MINT> --rpc <PAID_RPC> --write   # assembles env + preflight
node scripts/preflight-mainnet.mjs --env .env.mainnet                  # GO / NO-GO gate
# then: vercel deploy --prod  ·  deploy server/ to Railway  ·  (optional) anchor deploy
```

## A. Engineering / code
- ✅ Mainnet config is env-driven (cluster/mint/RPC); mainnet has no default mint
- ✅ Wallet-signature identity (`AUTH_REQUIRED=1`) + payout wallet locked to proven key
- ✅ Merkle pipeline: `merkle.mjs` + `build-merkle.mjs` + `payout-war.mjs --merkle`
- ✅ **On-chain Anchor claim distributor** — compiles (SBF) + Rust unit test proves it matches
  the off-chain tree ([onchain/](../../onchain/))
- ✅ Raid-seed entropy (outcomes no longer precomputable)
- ✅ Server data-safety (validated restore, retry+flush persistence, no silent wipe)
- ✅ Rate limiting + deployment bounds-check
- ✅ Preflight GO/NO-GO checker + `go-live.mjs` orchestrator
- 🟢 Scale: delta-sync / sector-sharding **or** a CCU cap (full-state broadcast + JSONB blob caps ~hundreds)
- 🟢 Monitoring/alerting (surface `snapshot_fail`, payout failures, treasury balance, uptime)
- 🟢 Error tracking (Sentry), admin kill-switch/feature flags, heartbeat, load-test, CI/CD + staging

## B. Smart contracts & on-chain 🔵🟣
- 🔵 **Mint $HEXAR on mainnet-beta** (Token-2022): fixed supply, **revoke mint authority**, no freeze authority, Metaplex metadata
- 🔵 **Liquidity pool** (Raydium/Orca) + LP budget — required for the token to be acquirable
- 🔵 `anchor keys sync && anchor build && anchor deploy` the distributor; transfer upgrade authority to multisig
- 🟣 **Audit** the distributor + token setup before it custodies funds

## C. Infrastructure & DevOps 🔵 (🟢 I can wire)
- 🔵 **Paid mainnet RPC** (Helius/Triton) · **Prod Postgres** (Neon) + backups/PITR
- 🔵 Vercel + Railway production tiers; set env from `go-live.mjs` output (incl. `AUTH_REQUIRED=1`, `PERSIST_EVERY=3`)
- 🔵 Domain/DNS/TLS (warlands.xyz → Vercel; `wss://` server) · secrets manager · DDoS/WAF · uptime + status page

## D. Security 🟣🔵
- 🟣 Smart-contract + app **audit**; optional pen test; bug bounty (Immunefi)
- 🔵 **Multisig treasury** (Squads) + **timelock** — replace the hot key (today: one leak = total loss)
- 🔵 Hardware-wallet key custody · incident-response plan

## E. Treasury & finance 🔵
- 🔵 **Fund treasury/vault** with real $HEXAR (cover all claimable) + SOL for gas
- 🔵 Solvency model: payouts ≤ funded pool (size vs `HEXAR_CLAIM_CAP` × claimers) · accounting/tax · ops runway

## F. Legal & compliance 🔵🟣 (highest non-code risk)
- 🟣 Legal opinion: is $HEXAR a security? "earn real money" + loot ⇒ securities + gambling exposure
- 🔵 Entity/foundation · ToS, Privacy Policy, EULA, risk disclosures
- 🔵 Geo-blocking restricted jurisdictions · OFAC screening · possibly KYC/AML + age gate · trademark "WARLANDS"

## G. Product & game readiness 🔵 (🟢 code)
- 🔵 Closed beta → feedback → economy balance/tuning (season length, reward curve) · bug triage · ongoing anti-cheat

## H. Community, marketing & GTM 🔵
- ✅ Launch trailer · landing page · whitepaper
- 🔵 Socials (X/Discord/Telegram) + mods · KOL outreach · PR · CoinGecko/CMC/DexScreener · airdrop/incentives

## I. Operations & support 🔵 (🟢 runbooks)
- ✅ mainnet runbook · telemetry/event log
- 🔵 Support + dispute/refund policy · on-call rotation · moderation · KPI dashboards (DAU, retention, token velocity, treasury health)

## Phasing
- **Phase 1 — soft mainnet, non-custodial** (no audit needed): token + liquidity + `go-live.mjs` env + `AUTH_REQUIRED=1`; payouts stay `--dry-run`. Real game, zero money at risk.
- **Phase 2 — real stakes**: gated by multisig + timelock + audit + funded vault + legal sign-off. Then enable on-chain claims / payouts.

The remaining **code** is small (scale, monitoring) and I can do it. The launch **timeline** is set
by the non-code gates — audit, multisig, legal, funding — which are weeks and aren't mine to do.
