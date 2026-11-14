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
- **Stage 2 — next:** build `main.ts`, the model, the dashboard and the farm
  plans; run locally; take the 3 screenshots.

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
