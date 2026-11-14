# Token Radar — pre-token protocols ranked by implied launch value

Entry for make.fun `token-radar-01` ($1,325, top 10 share; deadline Sun 2026-12-14 17:00 WIB).

The program (`main.ts`, Node 22, standard library only) reads a sealed DefiLlama
snapshot (`/input/snapshot.json`, 758 protocols, fetched 2026-11-14), finds the
protocols that record no token and are not a wrapped/staked/bridged product of
one that trades, ranks them by an implied launch value derived from the
snapshot's own figures, and writes a static dashboard (`dashboard/`, no
network) plus `board.json` and `dossier.json` to `/output`.

## Status

- **Stage 1 — done:** kit fetched and verified (20/20 files, sha256), scorer
  and judge model read, snapshot analysed, ranking-signal design written in
  `STAGE1.md`, repo created.
- **Stage 2 — done:** `main.ts` + `lib/model.ts` + `dashboard/` built (198 rows,
  top 10: Steakhouse $620M, Sentora $596M, Gauntlet $369M); two runs byte-identical;
  gate shape verified locally; 3 real screenshots taken with Chrome headless shell.
  See `STAGE2.md`.
- **Stage 3 — done:** cold-read against the house starter; ranking defensible, no
  fix needed. Added per-row "Why this rank" stories (token status, value driver,
  sensitivity), model radar-3; two runs byte-identical, 0 mismatches, screenshots
  re-shot. See `STAGE3.md`.
- **Stage 4 — done:** final review, verdict NO (not quite final): one improvement
  worth doing — board readability (implied-value bars + search width). All
  verification passed on HEAD 369b47aa. See `STAGE4.md`.
- **Stage 5 — done and FROZEN:** board readability (implied-value bars + wider
  search), model radar-3 unchanged, 2 runs byte-identical, 0 mismatches, screenshots
  re-shot. See `STAGE5.md`.
- **Next:** export transcripts, bundle, `makefun check`, submit — from the main chat,
  before Sun 2026-12-14 17:00 WIB. No further code change without a new stage.

## The model (design, see STAGE1.md)

- **Eligibility:** pre-token (`mcap_usd`, `gecko_id`, `symbol` all null) AND
  not excluded by the house rule replicated from the snapshot's own fields
  (category Bridge / Canonical Bridge / Liquid Staking / Liquid Restaking /
  Restaked BTC / CEX, whole word wrapped/staked/staking in the name, exchange
  prefix, version marker). 198 protocols qualify: the 40 watchlist rows, 20
  above-floor survivors the starter ignores, 138 below the floor.
- **Implied value:** `TVL x category multiple x growth multiplier x maturity
  multiplier`. The category multiple is the median market-cap/TVL of the
  live-token protocols in the same category in the same snapshot, shrunk
  toward the global median (0.205) by sample size and winsorized to
  [0.05, 1.0] — no hardcoded names, no hardcoded multiples.
- **Growth:** 7-day TVL change clamped to [-60, +120]%, weight 0.5.
- **Maturity:** 0.6–1.0 over 1,095 days since `listed_at` (unknown age: 365d).

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input <snapshot.json>
```

## Licence

MIT — see `LICENSE`.
