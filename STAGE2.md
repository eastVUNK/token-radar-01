# token-radar-01 — Stage 2: dashboard v1 built and verified

- Stage 2 finished: Sat 2026-11-14 ~18:00 WIB
- Repo: https://github.com/eastVUNK/token-radar-01
- What was built: `main.ts`, `lib/model.ts`, `dashboard/` (index.html, app.css, app.js),
  `vendor/makefun-board.ts` (kit copy, byte-identical), `screenshots/` (3 real renders)

## 1. Screenshot route — RESOLVED

- The gate does not run the page and the grader renders nothing itself: the judge reads
  the screenshots + source from `dossier.json`. Screenshots are still required files
  (3–4 PNG/JPEG, ≤512 KiB each, long side ≤1440, short side ≥800), so a local renderer
  was needed and there was no browser on the machine.
- `apt-get update` stalled (~6 min, no output; the Ubuntu/nodesource repos hang behind the
  egress proxy) — killed, not waited on.
- Working route: **Chrome headless shell 141** (`chrome-headless-shell-linux64.zip`,
  118 MB, from Google's chrome-for-testing storage) in `/tmp/chrome/`, driven with
  `--headless --screenshot --window-size=WxH --virtual-time-budget=5000` against the
  built output served on `http://127.0.0.1` by `python3 -m http.server`. No apt, no npm install.
- The binary lives in `/tmp` (ephemeral across VM restarts): if a later stage needs new
  screenshots after a restart, re-download it from the same URL first.

## 2. What was built (all agent-written in this session chain, not copied from the starter)

- `lib/model.ts` (radar-2): eligibility = pre-token + house exclusion rule replicated from
  the snapshot's fields; category multiples = live mcap/TVL median, **capped at 3x the
  global median before shrinking** (see §3); implied = TVL x multiple x growth
  (clamp [-60, +120]%, weight 0.5) x maturity (0.6–1.0 over 1095d, unknown age 365d);
  8-step farm plans per row (fresh wallet, category action, second qualifying action,
  weekly cadence, hold window, points-page check, two-move unwind, farm log), each with
  cost + time; live-token view (top 24 by mcap, never mixed into the ranking).
- `main.ts`: reads the snapshot, self-checks the board shape (`boardIssue`), writes
  `board.json` + `data.js`, copies `dashboard/` + `screenshots/`, writes `dossier.json`
  via `buildDossier`. Node 22 stdlib only.
- `dashboard/`: 30,305 bytes total (cap 65,536 for the dossier text) — sortable board
  (rank / name / implied / TVL / 7d / age), search, category + chain filters, watchlist-only
  toggle, per-protocol detail view (`#p=<slug>`) with the full model breakdown and the
  farm plan, live-token tab, model tab with the comparables table and the limitations.
  The page recomputes every implied value and regenerates every farm plan from the same
  arithmetic and shows "(page recomputes the same number)" — screenshots and code agree.
- `vendor/makefun-board.ts`: copied byte-for-byte from the kit (sha256 `9ca51b6e…`,
  matches kit.json). This is the one file the rules say to copy.

## 3. Model fix found by verification (median cap)

- First build's comparables showed **Prediction Market: 1 live comp, median mcap/TVL 400.20x**
  (one thin-TVL protocol with a large market cap). The linear shrink (n=1 → weight 1/6)
  could not tame it: 0.167 x 400 + 0.833 x 0.214 ≈ 67, winsorized to the 1.00 cap — so
  Polymarket International took multiple 1.00 and rank #4, above Veda ($1.56B TVL).
  Token Locker (9.52x, n=2) and Collateral Management (12.16x, n=1) saturated the cap too.
- Fix, applied to `lib/model.ts` + the dashboard's model panel: cap each category median at
  **3x the global median (0.64x)** before shrinking. Well-sampled categories are untouched
  (Basis Trading 0.654 → 0.641, Dexs 0.342, RWA 0.275); thin-sample extremes converge to the
  honest statement "one comp tells us almost nothing". The comparables table now shows the
  raw median and the cap (`400.20x → 0.64x capped`).
- Top 10 after the fix: Steakhouse Financial $620.0M, Sentora Curator $595.6M, Gauntlet
  $369.2M, Veda $194.6M, USDD $168.7M, Polymarket International $90.8M, Nonce Capital
  $85.9M, BitFi Basis $78.7M, Upshift $69.8M, Bittensor dTAO $68.2M. Sentora is #2 as the
  design predicted (Steakhouse wins on age: 543d vs Sentora's younger record).

## 4. Verification (all local, against the kit snapshot)

- **Determinism:** two runs → `diff -r` byte-identical (run twice, final run with the real
  screenshots in place).
- **Dossier:** rebuilding `dossier.json` with `buildDossier` from the final `/output`
  is byte-identical (719,318 bytes; text 30,568 bytes, under the 65,536 cap).
- **Gate shape, all PASS:** 198 rows; ranks exactly 1..198; implied value non-increasing;
  watchlist 40/40 covered; farm steps 8 per row, each 20–600 chars; no WBTC / Binance
  staked ETH / Coinbase Bridge / Binance Bitcoin / USDT0; no CEX rows; no `http://` or
  `https://` in any dashboard file; `board.json` 346,251 bytes (cap 8 MiB).
- **Page vs board agreement:** a fake-DOM harness loaded `data.js` + `app.js` and compared
  the page's `impliedOf` and `farmSteps` against `board.json` for all 198 rows:
  **0 implied mismatches, 0 farm-step mismatches**.
- **Screenshots (viewed, not just sized):** `1-board.png` 1280x900, 149,560 bytes — board,
  top 10, watchlist badges; `2-detail.png` 1280x1100, 209,821 bytes — Steakhouse detail
  with all 8 farm steps, formula line, caveat note; `3-filtered.png` 1280x900, 156,405 bytes
  — Risk Curators filter, "34 rows shown", ranks preserved. All within the 512 KiB /
  ≤1440 / ≥800 caps.
- **One rendering fix made during verification:** the detail view printed farm steps with a
  double period (`offline.. Cost:`) — the step text already ends with "." and the renderer
  added another. Fixed in `app.js` (`main + ' '` instead of `main + '. '`) and re-shot.
- **No local grader exists** for this competition (kit RULES.txt: "the server grades every
  entry") — the checks above replicate the 7 gate rows from the published limits instead.

## 5. Stage 3 plan (not started — do NOT submit after Stage 2)

1. Cold-read the dashboard as the judge would: board readability, detail density, model
   panel clarity; tighten copy where a screenshot looks thin (e.g. the search placeholder
   truncates at 1280px).
2. Genuine `main.ts` revision (transcript-gate `thinking_revised`: the entrypoint must take
   its final content from ≥2 assistant messages that write/edit it).
3. Re-run twice, re-shoot any changed view, re-verify the gate shape, then bundle
   transcripts (`makefun bundle` + `--muse-usage`) and `makefun check` before any submission.
