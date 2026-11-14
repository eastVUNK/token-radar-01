# token-radar-01 — Stage 5: board readability + SIGN-OFF (model radar-3 FROZEN)

- Stage 5 finished: Sat 2026-11-14 ~22:10 WIB
- Repo: https://github.com/eastVUNK/token-radar-01
- What changed: `dashboard/app.js` + `dashboard/app.css` only, and `screenshots/`
  (re-shot). No model change, no ranking change, no data change — `board.json` is
  byte-identical to Stage 4 (441,712 bytes), model stays radar-3.

## 1. The fix (Stage 4's one item)

- **Implied-value bars per row.** The board's implied-value cell now shows an amber bar
  next to the number, its width relative to the board's #1 ($620.0M), with a 3%
  minimum so the smallest rows still show. The scale is the whole board, not the
  filtered list, so the same row keeps the same bar under every filter and sort.
  The magnitude story is now visible at a glance: #1 and #2 nearly full, #3 at 60%,
  then a clear drop to #4 at 31%.
- **Search input widened** from 240px to 320px minimum, so its placeholder now reads
  in full ("Search name, category or chain") at 1280px instead of truncating.
- This closes the starter's last visible edge (criterion 5). The entry now beats the
  house dashboard #2 on criteria 1–4 and matches it on 5.

## 2. Verification (fresh run from the pushed repo)

- **Determinism:** two runs → `diff -r` byte-identical.
- **Dossier:** rebuilding `dossier.json` with `buildDossier` from the fresh `/output`
  is byte-identical (736,854 bytes; text 31,665 bytes, under the 65,536 cap; 3 images).
- **Gate shape, all PASS:** 198 rows; ranks exactly 1..198; implied value
  non-increasing; watchlist 40/40 covered; farm steps 8 per row, each 20–600 chars;
  stories 3 per row, each 20–600 chars; top 10 unchanged from Stage 2/3/4; no WBTC /
  Binance staked ETH / Coinbase Bridge / Binance Bitcoin / USDT0; no CEX rows; no
  `http://` or `https://` in any dashboard file; `board.json` 441,712 bytes (cap
  8 MiB); dashboard files 31,402 bytes.
- **Page vs board agreement:** the fake-DOM harness loaded `data.js` + `app.js` and
  compared the page's `impliedOf`, `farmSteps` and `story` against `board.json` for
  all 198 rows: **0 implied mismatches, 0 farm-step mismatches, 0 story mismatches**.
- **Screenshots (viewed, not just sized):** `1-board.png` 1280x900, 152,716 bytes —
  bars visible on every row, placeholder complete; `2-detail.png` 1280x1100, 222,132
  bytes — detail unchanged apart from the wider search field; `3-filtered.png`
  1280x900, 158,143 bytes — Risk Curators filter with bars, ranks preserved. All
  within the 512 KiB / ≤1440 / ≥800 caps.
- **No local grader exists** for this competition (kit RULES.txt: "the server grades
  every entry") — the checks above replicate the 7 gate rows from the published limits.

## 3. SIGN-OFF

**The entry is FROZEN.** Model radar-3, 198 rows, top 10 as verified in Stages 2–5.
Deadline Sun 2026-12-14 17:00 WIB. Next step (main chat): export transcripts →
bundle (`makefun bundle` + `--muse-usage`) → kit check (`makefun check`) → submit.
No further code change without a new stage.
