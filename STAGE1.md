# token-radar-01 — Stage 1: kit, scoring model, ranking-signal design

- Competition: `token-radar-01`, "Build the best token launch radar", program/v1
- Pot: $1,325 — 1st $1,000, 2nd–5th $50, 6th–10th $25, paid in USDC on Solana from escrow
- Deadline: Sun 2026-12-14 17:00 WIB (2026-12-14T10:00:00Z); entries committed on chain 10:10Z
- Repo: https://github.com/eastVUNK/token-radar-01 (public, MIT, created after the competition opened)
- Stage 1 finished: Sat 2026-11-14 ~17:50 WIB

## 1. Kit verification — PASS, 20/20 files

- Fetched `GET /api/competitions/token-radar-01/kit` with the account API key.
- `kit.json` `bundle_sha256` = `ea1c9dccab78e6846655e81b921a79465c7267677ea2e0908624ddbc8a012d43`,
  identical to the competition detail (`bundleSha256`).
- Tarball `GET /c/token-radar-01/kit` (5,446,982 bytes, sha256
  `1f386db7fa04c79e5653f134129a3a1dd20ce007bd6d175506157899eeb34be3`), unpacked to
  `kit/unpacked/token-radar-01-kit/`; **every one of the 20 files matches its kit.json sha256**.
- Harness tarball inside the kit also verifies (`sha256sum -c harness-src.tar.gz.sha256`: OK).
- Live status checked 2026-11-14 ~17:35 WIB: `acceptingSubmissions=true`, `submissionCount=784`
  (was 730 at ~17:29 — the field is climbing fast; the saved detail JSONs from 09:36/13:36
  both stale-show `accepting=false, subs=0`, do not trust them).
- Snapshot inside the kit (`input/snapshot.json`, sha256 `42a712135194…`, 247,940 bytes)
  is the sealed input the grade reads. `as_of` 2026-11-14, source DefiLlama
  `https://api.llama.fi/protocols`, fetched 2026-11-14T01:18:33Z, `floor_usd` $50,000,000.

## 2. What the sealed scorer checks (7 gate rows — all must pass, else 0 and no rate)

Read from the rules + kit RULES.txt + `starter/main.ts` (which quotes `reference/gate.json`).
The scorer itself (`scorer/score.ts`) stays server-side; the kit ships its limits and the
dossier library byte-for-byte, so the gate is fully reconstructable locally:

| Row | Rule |
|---|---|
| `dashboard_files` | `dashboard/` has index.html + ≥1 .css + ≥1 .js, ≤400 files, ≤4 MiB total, plain names only, **no `http://`/`https://` in any HTML attribute, `<style>` body, inline `<script>` import, CSS file, or JS import/require/dynamic-import**. Visible text/comments may carry URLs. |
| `board_file` | `board.json`: object with `rows` (bare array also read), 100–4,000 rows, ≤8 MiB. Each row: `slug` (snapshot protocol, unique, 1–128 chars, no whitespace), non-empty `name`, positive whole `rank`, positive whole `implied_value_usd` ≤ 10^14, `farm_steps` array. All implied values identical → refused. |
| `sorted_by_value` | Ranks exactly 1..N once each; `implied_value_usd` non-increasing with rank. |
| `coverage` | **Every watchlist slug appears** (`min_watchlist_coverage` = 1). The watchlist is the snapshot's own. |
| `farm_steps` | Every row: 3–12 steps, each 20–600 chars trimmed. |
| `screenshots` | 3–4 images, whole PNG/JPEG, each ≤512 KiB, long side ≤1440px, short side ≥800px. Target 300–350 KiB each (three at the cap exceed the dossier). |
| `dossier_matches` | `dossier.json` byte-for-byte equals `buildDossier('/output', {text_max_bytes: 65536})` from `dashboard/` + `screenshots/`, ≤1.5 MiB. |

Plus the program contract: `main.ts` at repo root, Node 22 stdlib only, reads `/input/snapshot.json`,
writes `/output/board.json`, `/output/data.js`, copies `dashboard/` + `screenshots/` to `/output`,
writes `/output/dossier.json` via `buildDossier` from `vendor/makefun-board.ts`. Runs twice, both runs
must write identical bytes. 120 s/run, 1 CPU, 1,024 MB, no network.

Dossier text cap is the binding constraint on the dashboard: the judge's text holds at most
65,536 bytes of dashboard source (whole files in path order, then a cut line). **Keep dashboard
source under 64 KB total** or the judge reads a partial page. `data.js` lives at `/output` root,
outside `dashboard/`, so the row data does not consume the 64 KB — but it also means the judge
never sees `data.js` text; the board's content reaches the judge through the screenshots and
through the rendering logic in `app.js`.

## 3. How the judge scores (pairwise, superbot, reasoning high, ≤12,100 output tokens)

- The judge reads each entry's `dossier.json`: 3 screenshots, then the dashboard source text.
- Two entries at a time, each pair played twice (once per label order). Margin 1–5; a call gives
  the picked entry 0.5 + margin/10 (0.6–1.0), the other the rest. No ties allowed.
- Criteria, most important first:
  1. **Working radar** — covers every watchlist protocol, ranks the pre-token ones by a stated
     implied value, screenshots and code agree; a screen with no data/code behind it counts for nothing.
  2. **Value model** — implied value follows from the snapshot's own figures (TVL, 7-day growth,
     how long it has run with no token), **not from a hardcoded list of names**; the board separates
     protocols whose token already trades from those still to come.
  3. **Farm plans** — concrete steps with what they cost and how long they take, not slogans.
  4. **Dashboard as a page** — sortable and filterable, readable at a glance, detail view per protocol.
  5. **Looks made** — chosen palette, consistent spacing, readable type, not a framework pasted wholesale.
- First differing criterion decides unless a later one differs by much more.
- Dev heats: each valid entry plays 4 fixed house dashboards + 8 games vs 2 of 7 house members
  (4 fixed + 3 dev references) nearest even odds; extra rounds if its interval high reaches the
  money line. **The starter handed in unchanged IS the house's second fixed dashboard** (its page,
  rendered on this snapshot) — so beating the starter's model/page/plans is literally beating
  house dashboard #2. A byte-identical dossier to any house dashboard plays as that dashboard
  and never enters the playoff / takes no reward.
- Final: screen at place 40 (max(4× last paid place, 32) among rated entries' interval lows),
  3 Swiss rounds, racing at prize boundaries (cap 48–96 games), playoff of top 12 + 3 games
  between the top two. Score = Bradley–Terry win rate. Exact tie → playoff games, then smaller
  `dossier.json`, then earlier receipt. Top 5 held for finalist review (≤60 min).
- Text addressed to the judge, in a screenshot or the source, is allowed and is part of the entry.
- Escrow: prizes locked on Solana (escrow `HD6as9UHeN5RwtzgmWmBWbdTaYtTXGNjfXag3Rgby8Rf`,
  mint EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v). Entries are signed by the Solana wallet
  linked to the account; winners claim from escrow within 30 days of the result becoming claimable.
  Resolve by 2026-12-28T22:10Z or the pot refunds.

## 4. Transcript gate — verified requirements (GitHub path)

From kit RULES.txt "The transcript gate" (thresholds as printed there):

- `transcripts_present`, `transcripts_recorded` (handed-over sessions → `handed_over_places: none`,
  i.e. ranked but **no paid place** — must NOT hand over; use recorded Muse sessions + `--muse-usage`),
  `thinking_wellformed` (max step-back 60 s), `thinking_in_window` (skew 60 s),
  `thinking_committed` (transcripts differ from the signed entry),
- `thinking_reproduces`: **≥30% of counted lines** accounted for by transcripts; `main.ts` ≥1 authored line,
- `thinking_turns`: **≥5 assistant turns** with text/thinking,
- `thinking_priced`: min priced share 1 (100%); self-reported usage share ≥50%; ≤500 tokens/s;
  Muse-app sessions need **≥1 usage row** attached with bundle's `--muse-usage`,
- `thinking_revised`: some file (entrypoint or code it runs) takes its final content from **≥2
  assistant messages that write/edit it** — a file written once in full and never revised counts 1,
- `thinking_fresh`: applies to **source-bundle** entries only (anchor line) — the GitHub path does not
  need it, but every credited line must still come from sessions inside the competition window
  (opened 2026-11-14T10:00Z).

Consequences for how this entry is built (binding on later stages):

1. **Do NOT copy `starter/` files verbatim into the repo.** The agent must write `main.ts`,
   `lib/model.ts` and the dashboard files itself, in this session chain, and revise them in a
   later stage (Stage 2 writes, Stage 3+ revises). `vendor/makefun-board.ts` is the one exception:
   the rules explicitly say to copy it byte-for-byte (it is the scorer's own library).
2. This session is turn 1 of the build; the entry must reach ≥5 assistant turns with text/thinking
   and genuine revisions before any submission. **Do NOT submit after Stage 2.**
3. Submission is via GitHub repo + commit + `transcripts.tar.gz` from `cli/makefun.mjs bundle`
   (with `--muse-usage`), then `submit --competition token-radar-01 --repo-url … --commit <sha>
   --bundle transcripts.tar.gz --keypair wallet.json`. Max 5 submissions/day, 10 total; last
   before the deadline is final. Claim file `.makefun/owner.json` already in the repo
   (wallet `BghxTGURoYyWDjrUAnoBu5HWwRmnnoueR5PuDUfRb9gE`), because the GitHub owner
   (eastVUNK) is the account's login — the file is belt-and-braces either way.

## 5. Snapshot analysis (the facts the design stands on)

- 758 protocols ≥$5M TVL; **342 record no token** (`gecko_id` + `symbol` + `mcap_usd` all null);
  416 record a token.
- Watchlist: **40** protocols, TVL $51.3M–$2.75B. Top: Steakhouse Financial $2.75B (Risk Curators),
  Gauntlet $1.58B, Veda $1.56B, USDD $1.06B, Nonce Capital $514M.
- Watchlist categories: Risk Curators 12, RWA 7, Onchain Capital Allocator 3, Basis Trading 2,
  Yield 2, Chain 2, Lending 2, + 8 singletons. Median age 511 days (min 45, max 1,563);
  7-day change median −3.29% (min −28.5%, max +11.2%); 2 rows have `listed_at` null, 0 have `change_7d` null.
- **The trap — "records no token" ≠ "has no token":** the snapshot's pre-token test alone lets
  through wrapped/staked/bridged giants that the house rule excludes: WBTC $7.91B (Bridge),
  Binance staked ETH $7.45B (Liquid Staking), Coinbase Bridge $7.23B (Bridge), Binance Bitcoin
  $4.66B, USDT0 $3.57B — all record no token in DefiLlama's ten fields, all are products of
  tokens that already trade. The rules name WBTC, Binance staked ETH and USDT0 explicitly as
  off-list for this reason. A board that ranks WBTC #1 as a "token launch" would fail judge
  criterion 2 on its face.
- The starter dodges the trap only accidentally: its early pool requires TVL < $50M floor, so it
  ignores all 92 above-floor pre-token protocols that are not on the watchlist. Of those 92,
  **72 are house-rule-excluded and 20 survive** — the biggest legitimate find the starter misses
  is **Sentora Curator, $2.76B** (Risk Curators), larger than watchlist #1 Steakhouse.
- Replicating the house exclusion rule from the 10 available fields (category ∈ {Bridge,
  Canonical Bridge, Liquid Staking, Liquid Restaking, Restaked BTC, CEX}; whole word
  wrapped/staked/staking in the name; name begins with an exchange name; name ends in a version
  marker) yields **198 rankable protocols**: 40 watchlist + 20 above-floor survivors + 138 below floor.
  Residual gap, disclosed in the dashboard: `parentProtocol` is not one of the ten fields, so a
  protocol with a parent but no name/category signal cannot be detected from the snapshot — the
  dashboard must say "records no token", never "has no token".
- **Comparables (live-token mcap/TVL, same snapshot):** global median 0.205 (n=129). By category:
  Lending 0.132 (n=15), Dexs 0.342 (n=11), Yield 0.180 (n=10), RWA 0.275 (n=9),
  Basis Trading 0.654 (n=7), Liquid Staking 0.041 (n=9), CEX 0.075 (n=9). Thin categories are
  unstable: Risk Curators n=1 (2.975 — an outlier), Chain n=1 (3.026), Onchain Capital Allocator
  n=2 (0.012). 13 rankable categories have zero live comps at all (incl. CDP Manager, Insurance,
  Collateral Markets, CeDeFi, Governance Incentives). Raw category medians must therefore be
  **shrunk toward the global median by sample size and winsorized** — see §6.
- Growth outliers: rankable 7-day change spans −72.7% to **+4,448%**; 3 rows > +120%, 1 row < −60%.
  Clamping is not optional. 2 rankable rows have `change_7d` null → treat as 0.

## 6. Ranking-signal design (what Stage 2 builds)

### Eligibility (the board's universe)

```
pre-token(p)  = mcap_usd is null AND gecko_id is null AND symbol is null
excluded(p)   = category in {Bridge, Canonical Bridge, Liquid Staking,
                Liquid Restaking, Restaked BTC, CEX}
                OR name has whole word wrapped|staked|staking (any case)
                OR name begins with Binance|Coinbase|Bybit|Kraken|Bitget|OKX|Bitfinex|Gemini
                OR name ends in a version marker (\s(V\d+(\.\d+)?|v\d+(\.\d+)?|\d+\.\d+)$)
rankable(p)   = pre-token(p) AND NOT excluded(p)
```

Board = **all 198 rankable protocols** (not the starter's 200 = 40 + top-160-by-TVL). Every
watchlist slug is covered by construction; the 20 above-floor survivors are the radar's headline
early finds; the 138 below-floor rows are the long tail. Ranks 1..198, implied value strictly
non-increasing (ties broken deterministically by slug so the two grader runs are byte-identical).

### Implied value

```
implied = round( TVL × categoryMultiple(category) × growthMult × maturityMult )
```

- **categoryMultiple** — computed at runtime from the snapshot itself, never hardcoded:
  median `mcap_usd / tvl_usd` over live-token protocols in the same category, shrunk toward the
  global median by sample size (`w = n / (n + 5)`; `mult = w × catMedian + (1 − w) × globalMedian`),
  then winsorized to [0.05, 1.00]. Categories with no live comps get the global median (0.205 on
  this snapshot). This is the main break from the starter's flat 0.25: a Basis Trading protocol is
  worth ~3× a Lending protocol per TVL dollar in the market's own terms, and Risk Curators'
  single 2.975× comp cannot explode the board because n=1 shrinks it to ≈0.68 and the cap is 1.00.
  The dashboard shows the comparables table (category, n, median, shrunk multiple) so the judge
  can audit the number from the snapshot.
- **growthMult** — `1 + clamp(change_7d, −60, +120) / 100 × 0.5` (starter's clamp/weight kept:
  a +4,448% week must not decide the board; null → 0).
- **maturityMult** — `0.6 + min(age_days, 1095) / 1095 × 0.4`, age from `listed_at` to `as_of`
  (null → 365 days, as the starter does). Older-with-no-token = proven staying power, per the
  house model's direction; the range is deliberately narrow so TVL and category dominate.
- Sanity anchor: under this model Steakhouse ≈ $2.75B × ~0.68 (shrunk Risk Curators) × ~0.99 ×
  ~0.80 ≈ $1.5B implied; Sentora Curator ≈ $2.76B × 0.68 × 1.01 × ~0.80 ≈ $1.5B — the two
  curator giants fight for rank 1 on growth/age, not on TVL alone. (Exact figures computed in Stage 2.)

### Farm plans (6–8 steps per row, each 20–600 chars, cost + time in every step)

Generated from the row's own record — category, first chain, TVL band, age — never a hardcoded
name list. Improvements over the starter's 6 generic steps:

1. Fresh-wallet hygiene + seed offline (cost: first-tx gas, 5 min).
2. The category action (supply / LP / vault deposit / mint / stake / bridge / trade) with a
   capital band from TVL ($50 / $100 / $150 / $250) on the protocol's first chain.
3. A second, distinct qualifying action the category supports (borrow, swap, vote, restake,
   claim points) so the plan is not one-and-done.
4. Weekly cadence action (cost ~$2 gas/week, 10 min/week).
5. Hold window from age (young <180d → 60d, <365d → 45d, else 30d) so activity spans snapshots.
6. Points/rewards-page check before any withdraw; claim only from the protocol's own published link.
7. Exit/unwind step: how to leave without losing the position (chain-specific gas note).
8. Farm-log step (wallet, dates, tx hashes) for repeatability.

Steps name the chain and the capital explicitly; steps that do not apply to a category are
replaced, not skipped, so every row still carries 6–8 steps.

### Dashboard structure (static, no network, source < 64 KB)

- `dashboard/index.html` — shell + `<main>`; loads `../data.js` then `app.js`. No external URLs anywhere.
- `dashboard/app.css` — one chosen palette (dark ink + amber accent), consistent spacing/type.
- `dashboard/app.js` — renders from `window.RADAR`:
  - **Board tab (pre-token):** sortable table (rank, name, category, chains, TVL, 7d, age,
    implied value) — click a column header to sort; search box; category select; chain select;
    watchlist-only toggle; min-TVL filter. Row click (or `#p=<slug>`) opens the detail view.
  - **Detail view (per protocol, all 198):** name, rank, implied value + the full model breakdown
    (TVL × category multiple × growth × maturity, with each input shown), comparables note,
    "records no token" caveat, farm plan with cost/time per step, and the live-token separation note.
  - **Live-token tab:** top live-token protocols by market cap with their market values only —
    never mixed into the ranked board (judge criterion 2).
  - **Model panel:** the formula, the comparables table, the exclusion rule, the limitations
    (parentProtocol invisible in the snapshot; implied value is the entry's own claim, never
    make.fun's; no prediction of whether/when a token launches).
  - The page recomputes `impliedOf(row)` from the snapshot figures and checks it against
    `board.json`'s number, as the starter does — screenshots and code agree (criterion 1).
- `main.ts` — reads the snapshot, builds the board (model in `lib/model.ts`), writes
  `board.json` + `data.js`, copies `dashboard/` + `screenshots/`, writes `dossier.json` via
  `vendor/makefun-board.ts`; self-checks the gate shape (`boardIssue`) before writing.
- `screenshots/`: `1-board.png` (board), `2-detail.png` (a protocol detail view),
  `3-filtered.png` (filtered view) — 300–350 KB each, long side ≤1440, short side ≥800.
  **Open item:** no Chromium/Firefox binary was found on this machine (`which` empty) — Stage 2
  must settle the screenshot route (install headless Chromium, or capture via the Muse browser)
  before the screenshots can be taken.

## 7. What would beat the starter (house dashboard #2)

1. **Coverage:** 198 rows incl. the 20 above-floor survivors (Sentora Curator $2.76B et al.)
   vs the starter's 200 rows that ignore them entirely.
2. **Model:** category comparables shrunk + winsorized, computed from the snapshot — vs a flat
   0.25 that ranks almost purely by TVL and cannot distinguish a curator from a lender.
3. **Exclusion:** the house rule replicated from the snapshot's fields, so no wrapped/staked
   product can top the board — vs the starter's accidental dodge (TVL < floor only).
4. **Farm plans:** category-specific, two qualifying actions, explicit cost/time, exit step —
   vs 6 generic steps.
5. **Page:** watchlist toggle, chain filter, min-TVL filter, model/comparables panel, per-row
   model breakdown — vs the starter's search + category + two tabs.

## 8. Stage 2 plan (not started)

1. Settle the screenshot route (browser availability).
2. Agent writes `lib/model.ts` (eligibility + comparables + implied value + farm plans),
   `main.ts`, `dashboard/` (index.html, app.css, app.js) — in this session chain, not copied.
3. Run locally against the kit snapshot; verify gate shape (200→198 rows, coverage, ranks,
   farm-step lengths, no-network scan, dossier byte-equality via a rebuild).
4. Take the 3 screenshots; check sizes/dimensions; revise the page/model at least once
   (transcript-gate `thinking_revised`).
5. Report back; submit only in a later stage (≥5 turns, revised entrypoint) — never after Stage 2.
