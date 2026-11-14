# token-radar-01 — Stage 4: final review (model radar-3)

- Stage 4 finished: Sat 2026-11-14 ~22:00 WIB
- Repo: https://github.com/eastVUNK/token-radar-01
- Reviewed HEAD: `369b47aa0c8d4ab911aff3a2426d1d1d8f02677f` (Stage 3, unchanged — no code
  changed in this stage)
- **Verdict: NO — not quite final. One specific improvement is worth doing in Stage 5:
  board readability — implied-value bars in the board table (plus the search-input
  width that truncates its placeholder). Everything else is submission-ready.**

## 1. Verification (fresh run from the pushed repo)

- **HEAD:** `get-ref` returns `369b47aa0c8d4ab911aff3a2426d1d1d8f02677f`; all 15 tracked
  files match local by size (20 files in the tree). /tmp was wiped by a VM restart
  again, so Chrome headless shell 141 was re-downloaded and the staging copy rebuilt
  from the repo.
- **Determinism:** two runs → `diff -r` byte-identical.
- **Dossier:** rebuilding `dossier.json` with `buildDossier` from the fresh `/output`
  is byte-identical (736,081 bytes; text 30,901 bytes, under the 65,536 cap; 3 images).
  Note: the byte count differs from Stage 3's 719,657 because Stage 3's final run was
  built before the screenshots were re-shot, so its dossier embedded the older shots;
  the fresh run embeds the current repo screenshots. Both runs are self-consistent,
  and the grader re-runs `main.ts` at grade time, so the shipped state is what was
  verified here.
- **Gate shape, all PASS:** 198 rows; ranks exactly 1..198; implied value
  non-increasing and not all equal; watchlist 40/40 covered; farm steps 8 per row,
  each 20–600 chars; stories 3 per row, each 20–600 chars; unique slugs; implied
  values positive integers; no WBTC / Binance staked ETH / Coinbase Bridge / Binance
  Bitcoin / USDT0; no CEX rows; no `http://` or `https://` in any dashboard file;
  `board.json` 441,712 bytes (cap 8 MiB); dashboard files 30,638 bytes.
- **Page vs board agreement:** the fake-DOM harness loaded `data.js` + `app.js` and
  compared the page's `impliedOf`, `farmSteps` and `story` against `board.json` for
  all 198 rows: **0 implied mismatches, 0 farm-step mismatches, 0 story mismatches**.
- Top 10 unchanged from Stage 2/3: Steakhouse $620.0M, Sentora $595.6M, Gauntlet
  $369.2M, Veda $194.6M, USDD $168.7M, Polymarket International $90.8M, Nonce Capital
  $85.9M, BitFi Basis $78.7M, Upshift $69.8M, Bittensor dTAO $68.2M.

## 2. Honest judge comparison vs the house starter (#2)

Criteria in the kit's order; the first differing criterion decides.

1. **Working radar, coverage, screenshots and code agree.** Both pass. Ours covers
   the watchlist 40/40 and adds 20 above-floor protocols the starter misses (its early
   radar is below-floor only), including #2 Sentora. Ours agrees page-vs-board at
   0 mismatches on all three data families. Slight edge: ours.
2. **Value model from the snapshot's own figures, not a hardcoded name list.**
   Starter: one flat 0.25x multiple for every protocol. Ours: category multiples from
   live mcap/TVL medians, capped at 3x global, shrunk by sample size, with the
   comparables table and a per-row story that names the median, the cap and the
   sensitivity. Clear edge: ours.
3. **Farm plans concrete with cost and time.** Starter: 6 steps. Ours: 8 steps with a
   second qualifying action and a two-move unwind, each with cost and time. Edge: ours.
4. **Sortable/filterable page with per-protocol detail.** Starter: search + category
   filter + tabs. Ours adds a chain filter, a watchlist-only toggle, and a detail view
   with the formula, the recompute check, the "Why this rank" story and the farm plan.
   Edge: ours.
5. **Looks made, not framework-pasted.** Both are hand-built static pages with a
   coherent palette. The starter's one visible advantage is here: it draws an
   implied-value bar in every row, so magnitude is visible at a glance; ours is
   numbers only, and its search placeholder truncates at 1280px. Slight edge: starter.

The entry beats the house bar on criteria 1–4 and is roughly even on 5, so an AI judge
should pick ours over the starter. The remaining gap is confined to criterion 5's
first impression — the board screenshot, the first image the judge sees.

## 3. What Stage 5 should do (one item)

- **Board readability:** add an implied-value bar to each board row (width relative to
  the row's implied value vs the board maximum, as the starter does), and widen the
  search input so its placeholder no longer truncates. `app.js` + `app.css` only: no
  model change, no ranking change, no new data. Then re-verify (2 runs byte-identical,
  0 mismatches, dossier rebuild), re-shoot the board screenshot, and freeze.
- Deliberately NOT doing: a richer model (more signals would look overfit on one
  snapshot), a model sandbox (the starter has none either — the Stage 1 note saying
  otherwise was wrong; the starter's model panel is static text), or any ranking change
  (the top 10 is defensible as it stands; Nonce at 45 days and USDD/dTAO are disclosed
  in the per-row stories).

## 4. Stage 5 plan (not started — do NOT submit after Stage 4)

Stage 5: the board-readability change above, re-verification, sign-off, then
export/bundle/check/submit from the main chat before Sun 2026-12-14 17:00 WIB.
