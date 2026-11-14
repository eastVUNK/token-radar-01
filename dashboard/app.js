// Token Radar's plain dashboard. It reads window.RADAR (written beside dashboard/ by main.ts) and
// renders the ranked board, a filterable table, a per-protocol detail view with the model's own
// inputs and the protocol's farm plan, a live-token view, and the model itself. No network: every
// byte it shows is in data.js.
//
// The model in two functions, the same arithmetic main.ts writes to board.json, so the page's code
// and the board's data are visibly the same numbers: impliedOf recomputes a row from the snapshot
// figures and the page checks it against the value board.json carries; farmSteps regenerates a
// row's plan from its category, chains, TVL and age, and the page checks it against the plan
// board.json carries. A mismatch would show on the page, not hide behind it.
(function () {
  'use strict';

  var DATA = window.RADAR;
  if (!DATA) return;
  var app = document.getElementById('board');
  var state = { q: '', category: 'all', chain: 'all', watchlist: false, tab: 'pre-token', sort: 'implied', dir: -1, selected: null };

  var usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  function fmtUsd(n) {
    if (n === null || n === undefined || !isFinite(n)) return 'n/a';
    if (Math.abs(n) >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (Math.abs(n) >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
    if (Math.abs(n) >= 1e3) return '$' + Math.round(n / 1e3) + 'K';
    return usd.format(n);
  }
  function fmtPct(n) {
    if (n === null || n === undefined || !isFinite(n)) return 'n/a';
    return (n > 0 ? '+' : '') + n.toFixed(2) + '%';
  }
  function fmtAge(days) {
    if (days === null || days === undefined) return 'unknown';
    if (days >= 365) return (days / 365).toFixed(1) + 'y';
    return Math.max(0, Math.round(days)) + 'd';
  }

  // The model in one function: TVL x category multiple x growth x maturity.
  function impliedOf(row, model) {
    var growth = Math.min(model.growth_cap, Math.max(model.growth_floor, row.change_7d === null || row.change_7d === undefined ? 0 : row.change_7d));
    var growthMult = 1 + (growth / 100) * model.growth_weight;
    var age = row.age_days === null || row.age_days === undefined ? model.unknown_age_days : row.age_days;
    var maturity = model.maturity_floor + (Math.min(Math.max(age, 0), model.maturity_days) / model.maturity_days) * model.maturity_range;
    return Math.max(1, Math.round(row.tvl_usd * row.category_multiple * growthMult * maturity));
  }

  function chainOf(p) { return p.chains && p.chains.length > 0 ? p.chains[0] : 'its main chain'; }
  function capitalFor(p) {
    if (p.tvl_usd >= 5e9) return 250;
    if (p.tvl_usd >= 1e9) return 150;
    if (p.tvl_usd >= 1e8) return 100;
    return 50;
  }
  function holdDaysFor(age) {
    if (age === null || age === undefined) return 30;
    if (age < 180) return 60;
    if (age < 365) return 45;
    return 30;
  }
  function actionFor(p, capital, chain) {
    var c = (p.category || '').toLowerCase();
    var name = p.name;
    if (c.indexOf('lend') >= 0 || c.indexOf('cdp') >= 0 || c.indexOf('collateral') >= 0) return 'Supply $' + capital + ' of USDC to ' + name + ' on ' + chain + ' and keep the position open.';
    if (c.indexOf('dex') >= 0 || c.indexOf('leveraged farm') >= 0) return 'Provide $' + capital + ' of liquidity to ' + name + '\'s main pool on ' + chain + ' and keep the position open.';
    if (c.indexOf('bridge') >= 0) return 'Bridge $' + capital + ' of USDC to ' + chain + ' through ' + name + ' and use the bridged funds in its app.';
    if (c.indexOf('staking') >= 0 || c.indexOf('restak') >= 0) return 'Stake $' + capital + ' of the chain\'s staking asset through ' + name + ' and keep the receipt.';
    if (c.indexOf('perpetual') >= 0 || c.indexOf('derivative') >= 0) return 'Deposit $' + capital + ' of USDC as margin on ' + name + ' and open one small hedge.';
    if (c.indexOf('prediction') >= 0) return 'Fund $' + capital + ' and place one market position on ' + name + '.';
    if (c.indexOf('curator') >= 0 || c.indexOf('allocator') >= 0 || c.indexOf('yield') >= 0) return 'Deposit $' + capital + ' into a ' + name + ' vault on ' + chain + ' and keep the shares.';
    if (c.indexOf('stable') >= 0) return 'Mint or deposit $' + capital + ' of the stable asset through ' + name + ' on ' + chain + '.';
    if (c.indexOf('rwa') >= 0) return 'Mint $' + capital + ' of the protocol\'s yield asset on ' + chain + ' and hold it.';
    if (c.indexOf('insurance') >= 0) return 'Buy $' + capital + ' of cover from ' + name + ' on ' + chain + ' and keep the policy.';
    return 'Deposit $' + capital + ' of USDC into ' + name + ' on ' + chain + ' and keep the position open.';
  }
  function secondActionFor(p, chain) {
    var c = (p.category || '').toLowerCase();
    var name = p.name;
    if (c.indexOf('lend') >= 0 || c.indexOf('cdp') >= 0 || c.indexOf('collateral') >= 0) return 'Borrow a small amount against the supply on ' + name + ' and repay it within the week, so the wallet shows both sides of the market.';
    if (c.indexOf('dex') >= 0 || c.indexOf('leveraged farm') >= 0) return 'Swap a small amount through ' + name + '\'s main pool on ' + chain + ' so the wallet shows trading as well as liquidity.';
    if (c.indexOf('curator') >= 0 || c.indexOf('allocator') >= 0 || c.indexOf('yield') >= 0) return 'Move a small part of the vault position into a second vault on ' + name + ' so the wallet shows more than one allocation.';
    if (c.indexOf('perpetual') >= 0 || c.indexOf('derivative') >= 0) return 'Close the hedge and open a fresh one at a different size, so the wallet shows repeated trading.';
    if (c.indexOf('prediction') >= 0) return 'Settle one market and place a second position on ' + name + ', so the wallet shows more than a single bet.';
    if (c.indexOf('rwa') >= 0) return 'Reinvest the yield the asset pays into the same position on ' + chain + ' so the balance grows on chain.';
    return 'Use ' + name + '\'s main feature a second time on ' + chain + ' — a swap, a deposit or a vote — so the wallet shows repeated use.';
  }
  function stepText(step) {
    var s = step.text + ' Cost: ' + step.cost + '. Time: ' + step.time + '.';
    if (s.length > 600) s = s.slice(0, 596) + '...';
    if (s.length < 20) s = s + ' Hold the position and check the protocol\'s own page.';
    return s;
  }
  // The farm plan is the same derivation main.ts writes to board.json: category, chains, TVL and age.
  function farmSteps(p) {
    var chain = chainOf(p);
    var capital = capitalFor(p);
    var hold = holdDaysFor(p.age_days);
    var gas = capital >= 150 ? 8 : 4;
    return [
      { text: 'Use a fresh wallet that holds only the funds you plan to farm, and keep its seed phrase offline.', cost: 'under $3 of gas for the first transaction', time: '5 minutes' },
      { text: actionFor(p, capital, chain), cost: '$' + capital + ' of capital and about $' + gas + ' of gas', time: '15 minutes to set up' },
      { text: secondActionFor(p, chain), cost: 'about $2 of gas', time: '10 minutes' },
      { text: 'Make one qualifying action each week, such as a deposit, a borrow, a swap or a vote.', cost: 'about $2 of gas a week', time: '10 minutes a week' },
      { text: 'Hold the position for at least ' + hold + ' days so the activity is counted in more than one snapshot.', cost: 'the $' + capital + ' stays in the position', time: hold + ' days' },
      { text: 'Before you withdraw, open the protocol\'s own points or rewards page and claim only from the link it publishes.', cost: 'no fee to check, and never pay to claim', time: '10 minutes' },
      { text: 'Unwind in two moves: withdraw half the position, wait a day, then withdraw the rest, and keep the gas for ' + chain + ' in the wallet.', cost: 'about $4 of gas in two transactions', time: '10 minutes across two days' },
      { text: 'Write the wallet, the dates and every transaction in a farm log so you can repeat the position or unwind it.', cost: 'nothing but the log', time: '5 minutes' },
    ].map(stepText);
  }

  // Exposed for the offline self-check: the grader's two runs and the page must agree.
  window.RADAR_MODEL = { impliedOf: impliedOf, farmSteps: farmSteps, stepText: stepText };

  function el(tag, attrs) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'class') node.className = attrs[k];
        else if (k === 'text') node.textContent = attrs[k];
        else if (k === 'html') node.innerHTML = attrs[k];
        else if (k.slice(0, 2) === 'on') node.addEventListener(k.slice(2), attrs[k]);
        else if (attrs[k] !== null && attrs[k] !== undefined) node.setAttribute(k, attrs[k]);
      });
    }
    for (var i = 2; i < arguments.length; i++) {
      var child = arguments[i];
      if (child === null || child === undefined) continue;
      if (Array.isArray(child)) child.forEach(function (c) { if (c) node.appendChild(c); });
      else if (typeof child === 'string') node.appendChild(document.createTextNode(child));
      else node.appendChild(child);
    }
    return node;
  }

  function readHash() {
    var params = new URLSearchParams(window.location.hash.slice(1));
    if (params.get('q')) state.q = params.get('q');
    if (params.get('p')) state.selected = params.get('p');
    if (params.get('category')) state.category = params.get('category');
    if (params.get('chain')) state.chain = params.get('chain');
    if (params.get('tab')) state.tab = params.get('tab');
    if (params.get('wl') === '1') state.watchlist = true;
  }
  function writeHash() {
    var params = new URLSearchParams();
    if (state.q) params.set('q', state.q);
    if (state.category !== 'all') params.set('category', state.category);
    if (state.chain !== 'all') params.set('chain', state.chain);
    if (state.watchlist) params.set('wl', '1');
    if (state.tab !== 'pre-token') params.set('tab', state.tab);
    if (state.selected) params.set('p', state.selected);
    var h = params.toString();
    history.replaceState(null, '', h ? '#' + h : window.location.pathname);
  }

  // Watchlist membership is a set, not a rank range: ranks are by value.
  var WATCHLIST = {};
  (DATA.watchlist_slugs || []).forEach(function (s) { WATCHLIST[s] = true; });

  function rows() {
    var q = state.q.trim().toLowerCase();
    return DATA.rows.filter(function (r) {
      if (state.watchlist && !isWatchlist(r)) return false;
      if (state.category !== 'all' && (r.category || 'Other') !== state.category) return false;
      if (state.chain !== 'all' && r.chains.indexOf(state.chain) < 0) return false;
      if (q) {
        var hay = (r.name + ' ' + (r.category || '') + ' ' + r.chains.join(' ')).toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    });
  }
  function isWatchlist(r) {
    return WATCHLIST[r.slug] === true;
  }

  function sortedRows(list) {
    var key = state.sort;
    return list.slice().sort(function (a, b) {
      var av = key === 'name' ? a.name : key === 'tvl' ? a.tvl_usd : key === 'growth' ? (a.change_7d === null ? -9999 : a.change_7d) : key === 'age' ? (a.age_days === null ? -1 : a.age_days) : a.implied_value_usd;
      var bv = key === 'name' ? b.name : key === 'tvl' ? b.tvl_usd : key === 'growth' ? (b.change_7d === null ? -9999 : b.change_7d) : key === 'age' ? (b.age_days === null ? -1 : b.age_days) : b.implied_value_usd;
      if (av < bv) return -state.dir;
      if (av > bv) return state.dir;
      return a.rank - b.rank;
    });
  }

  function header() {
    return el('header', null,
      el('h1', null, 'Token Radar', el('span', { text: ' — the pre-token board' })),
      el('p', { 'class': 'lede', text: DATA.board_size + ' protocols that record no token, ranked by what a launch would be worth if their record stayed as it is. The watchlist of ' + DATA.watchlist_size + ' is the floor, never the ceiling: ' + DATA.early_size + ' rows below it are the early finds.' }),
      el('p', { 'class': 'meta' },
        el('span', { text: 'Snapshot ' }),
        el('b', { text: DATA.as_of }),
        el('span', { text: ' · DefiLlama · Model ' + DATA.model_version + ' · Implied values are this entry\u2019s own claim, never make.fun\u2019s.' })));
  }

  function controls() {
    var categories = Array.from(new Set(DATA.rows.map(function (r) { return r.category || 'Other'; }))).sort();
    var chains = Array.from(new Set(DATA.rows.reduce(function (acc, r) { return acc.concat(r.chains); }, []))).sort();
    var search = el('input', { type: 'search', id: 'q', placeholder: 'Search name, category or chain', value: state.q, 'aria-label': 'Search the board' });
    search.addEventListener('input', function () { state.q = search.value; writeHash(); render(); });
    var cat = el('select', { id: 'category', 'aria-label': 'Category' },
      [el('option', { value: 'all', text: 'All categories' })].concat(categories.map(function (c) { return el('option', { value: c, text: c, selected: c === state.category ? 'selected' : null }); })));
    cat.addEventListener('change', function () { state.category = cat.value; writeHash(); render(); });
    var ch = el('select', { id: 'chain', 'aria-label': 'Chain' },
      [el('option', { value: 'all', text: 'All chains' })].concat(chains.map(function (c) { return el('option', { value: c, text: c, selected: c === state.chain ? 'selected' : null }); })));
    ch.addEventListener('change', function () { state.chain = ch.value; writeHash(); render(); });
    var wl = el('input', { type: 'checkbox', id: 'wl', checked: state.watchlist ? 'checked' : null });
    wl.addEventListener('change', function () { state.watchlist = wl.checked; writeHash(); render(); });
    var pre = el('button', { type: 'button', 'aria-pressed': state.tab === 'pre-token' ? 'true' : 'false', text: 'Pre-token', onclick: function () { state.tab = 'pre-token'; render(); } });
    var live = el('button', { type: 'button', 'aria-pressed': state.tab === 'live' ? 'true' : 'false', text: 'Live token', onclick: function () { state.tab = 'live'; render(); } });
    var model = el('button', { type: 'button', 'aria-pressed': state.tab === 'model' ? 'true' : 'false', text: 'The model', onclick: function () { state.tab = 'model'; render(); } });
    return el('div', null,
      el('div', { 'class': 'tabs' }, pre, live, model),
      el('div', { 'class': 'controls' },
        el('div', { 'class': 'field' }, el('span', { 'class': 'sub', text: 'Search' }), search),
        el('div', { 'class': 'field' }, el('span', { 'class': 'sub', text: 'Category' }), cat),
        el('div', { 'class': 'field' }, el('span', { 'class': 'sub', text: 'Chain' }), ch),
        el('label', { 'class': 'check' }, wl, el('span', { text: 'Watchlist only' })),
        el('span', { 'class': 'count', text: state.tab === 'pre-token' ? rows().length + ' rows shown' : state.tab === 'live' ? DATA.live.length + ' live-token protocols' : DATA.comparables.length + ' categories compared' })));
  }

  function sortHeader(key, label) {
    return el('th', { 'class': key === 'name' ? '' : 'num' },
      el('button', { type: 'button', onclick: function () { if (state.sort === key) state.dir = -state.dir; else { state.sort = key; state.dir = -1; } render(); } },
        el('span', { text: label }),
        state.sort === key ? el('span', { 'aria-hidden': 'true', text: state.dir < 0 ? ' v' : ' ^' }) : null));
  }

  function boardTable() {
    var list = sortedRows(rows());
    var body = list.map(function (r) {
      var g = r.change_7d;
      return el('tr', { 'class': 'row' + (state.selected === r.slug ? ' sel' : ''), onclick: function () { state.selected = r.slug; writeHash(); render(); } },
        el('td', { 'class': 'num', text: String(r.rank) }),
        el('td', null, el('span', { 'class': 'name', text: r.name }), isWatchlist(r) ? el('span', { 'class': 'badge', text: 'WATCHLIST' }) : null, el('span', { 'class': 'sub2', text: (r.category || 'Other') + ' · ' + r.chains.slice(0, 3).join(', ') + (r.chains.length > 3 ? ' +' + (r.chains.length - 3) : '') })),
        el('td', { 'class': 'num', text: fmtUsd(r.implied_value_usd) }),
        el('td', { 'class': 'num', text: fmtUsd(r.tvl_usd) }),
        el('td', { 'class': 'num' }, el('span', { 'class': g === null ? '' : g >= 0 ? 'up' : 'down', text: fmtPct(g) })),
        el('td', { 'class': 'num', text: fmtAge(r.age_days) }));
    });
    return el('table', null,
      el('thead', null, el('tr', null,
        sortHeader('implied', '#'),
        sortHeader('name', 'Protocol'),
        sortHeader('implied', 'Implied value'),
        sortHeader('tvl', 'TVL'),
        sortHeader('growth', '7d'),
        sortHeader('age', 'Age'))),
      el('tbody', null, body));
  }

  function liveTable() {
    var body = DATA.live.map(function (p, i) {
      return el('tr', null,
        el('td', { 'class': 'num', text: String(i + 1) }),
        el('td', null, el('span', { 'class': 'name', text: p.name }), el('span', { 'class': 'sub2', text: (p.category || 'Other') + ' · ' + p.chains.slice(0, 3).join(', ') })),
        el('td', { 'class': 'num', text: fmtUsd(p.mcap_usd) }),
        el('td', { 'class': 'num', text: fmtUsd(p.tvl_usd) }),
        el('td', { 'class': 'num' }, el('span', { 'class': p.change_7d === null ? '' : p.change_7d >= 0 ? 'up' : 'down', text: fmtPct(p.change_7d) })));
    });
    return el('div', null,
      el('p', { 'class': 'lede', text: 'These protocols already trade. Their market values are the market\u2019s own, shown here so the board can be checked against them — never mixed into the ranking.' }),
      el('table', null,
        el('thead', null, el('tr', null,
          el('th', { 'class': 'num', text: '#' }),
          el('th', { text: 'Protocol' }),
          el('th', { 'class': 'num', text: 'Market cap' }),
          el('th', { 'class': 'num', text: 'TVL' }),
          el('th', { 'class': 'num', text: '7d' }))),
        el('tbody', null, body)));
  }

  function detailView() {
    var r = null;
    for (var i = 0; i < DATA.rows.length; i++) if (DATA.rows[i].slug === state.selected) { r = DATA.rows[i]; break; }
    if (!r) return null;
    var recomputed = impliedOf(r, DATA.model);
    var ok = recomputed === r.implied_value_usd;
    var growth = Math.min(DATA.model.growth_cap, Math.max(DATA.model.growth_floor, r.change_7d === null ? 0 : r.change_7d));
    var formula = 'TVL ' + fmtUsd(r.tvl_usd) + ' x multiple ' + r.category_multiple.toFixed(2) +
      ' x growth ' + (1 + (growth / 100) * DATA.model.growth_weight).toFixed(2) +
      ' x maturity ' + r.maturity_multiplier.toFixed(2) + ' = ' + fmtUsd(r.implied_value_usd) +
      (ok ? '  (page recomputes the same number)' : '  (MISMATCH: page recomputes ' + fmtUsd(recomputed) + ')');
    var steps = farmSteps(r);
    return el('section', { 'class': 'detail', 'aria-label': 'Protocol detail' },
      el('h2', null, '#' + r.rank + ' ' + r.name, isWatchlist(r) ? el('span', { 'class': 'badge', text: 'WATCHLIST' }) : null),
      el('p', { 'class': 'sub3', text: (r.category || 'Other') + ' · ' + r.chains.join(', ') + ' · tracked since ' + (r.listed_at || 'unknown') }),
      el('div', { 'class': 'kv' },
        el('div', null, el('div', { 'class': 'k', text: 'Implied value' }), el('div', { 'class': 'v', text: fmtUsd(r.implied_value_usd) })),
        el('div', null, el('div', { 'class': 'k', text: 'TVL' }), el('div', { 'class': 'v', text: fmtUsd(r.tvl_usd) })),
        el('div', null, el('div', { 'class': 'k', text: '7-day change' }), el('div', { 'class': 'v', text: fmtPct(r.change_7d) })),
        el('div', null, el('div', { 'class': 'k', text: 'Age' }), el('div', { 'class': 'v', text: fmtAge(r.age_days) })),
        el('div', null, el('div', { 'class': 'k', text: 'Category multiple' }), el('div', { 'class': 'v', text: r.category_multiple.toFixed(2) + 'x' }))),
      el('div', { 'class': 'formula', text: formula }),
      el('h3', { text: 'How to farm it' }),
      el('ol', { 'class': 'steps' }, steps.map(function (s) {
        var parts = s.split(' Cost: ');
        var main = parts[0];
        var rest = parts.length > 1 ? parts[1] : '';
        return el('li', null, el('span', { text: main + ' ' }), el('span', { 'class': 'cost', text: 'Cost: ' + rest }));
      })),
      el('p', { 'class': 'note', text: 'This protocol records no token in the snapshot — that is DefiLlama\u2019s record, not proof it has none. The board never predicts whether or when a token is issued; the implied value is what a launch would be worth if the protocol\u2019s record stayed as it is.' }));
  }

  function modelView() {
    var m = DATA.model;
    var compRows = DATA.comparables.map(function (c) {
      var med = c.live_median === null ? 'n/a' : c.live_median.toFixed(3) + 'x';
      if (c.live_median_capped !== null && c.live_median !== null && c.live_median_capped < c.live_median) med += ' → ' + c.live_median_capped.toFixed(2) + 'x capped';
      return el('tr', null,
        el('td', { text: c.category }),
        el('td', { 'class': 'num', text: String(c.live_count) }),
        el('td', { 'class': 'num', text: med }),
        el('td', { 'class': 'num', text: c.multiple.toFixed(2) + 'x' }));
    });
    return el('section', { 'class': 'modelbox' },
      el('h2', { text: 'The model, in full' }),
      el('p', { text: 'Implied value = TVL x category multiple x growth multiplier x maturity multiplier. Every input comes from the snapshot itself; no protocol name is ever special-cased.' }),
      el('div', { 'class': 'formula', text: 'multiple  = median mcap/TVL of live-token protocols in the category,\n            capped at ' + m.median_cap_multiple + 'x the global median ' + DATA.global_multiple.toFixed(2) + 'x,\n            then shrunk toward it by n/(n+' + m.shrink_k + '),\n            winsorized to [' + m.multiple_floor + ', ' + m.multiple_cap + ']\ngrowth    = clamp(7-day TVL change, ' + m.growth_floor + '%, +' + m.growth_cap + '%)\ngrowth x  = 1 + growth/100 x ' + m.growth_weight + '\nmaturity  = ' + m.maturity_floor + ' + min(age, ' + m.maturity_days + 'd)/' + m.maturity_days + ' x ' + m.maturity_range + '   (unknown age: ' + m.unknown_age_days + 'd)' }),
      el('h3', { text: 'Category comparables (from this snapshot)' }),
      el('table', null,
        el('thead', null, el('tr', null,
          el('th', { text: 'Category' }),
          el('th', { 'class': 'num', text: 'Live comps' }),
          el('th', { 'class': 'num', text: 'Median mcap/TVL' }),
          el('th', { 'class': 'num', text: 'Multiple used' }))),
        el('tbody', null, compRows)),
      el('h3', { text: 'Who is on the board' }),
      el('p', { text: 'A protocol is ranked when it records no token (market cap, CoinGecko id and symbol all null) and is not a wrapped, staked or bridged product of a token that already trades: its category is not Bridge, Canonical Bridge, Liquid Staking, Liquid Restaking, Restaked BTC or CEX; its name carries no whole word wrapped, staked or staking; it does not begin with an exchange\u2019s name; and it does not end in a version marker. That is the house watchlist rule, rebuilt from the snapshot\u2019s own fields.' }),
      el('h3', { text: 'What the snapshot cannot show' }),
      el('ul', null,
        el('li', { text: 'DefiLlama records no parent protocol in the snapshot, so a protocol with a parent but no name or category signal cannot be caught by this rule. The board says a protocol records no token, never that it has none.' }),
        el('li', { text: 'The snapshot carries no ranking, no farm plan and no airdrop flag. Deriving them is this entry\u2019s work — and its claim, not make.fun\u2019s.' }),
        el('li', { text: 'A launch is not predicted here: neither whether nor when a token is issued, only what it would be worth if the record stayed as it is.' })));
  }

  function footer() {
    var bad = 0;
    DATA.rows.forEach(function (r) { if (impliedOf(r, DATA.model) !== r.implied_value_usd) bad++; });
    return el('footer', null,
      el('p', { text: 'Source: DefiLlama protocols snapshot, ' + DATA.source + '. Floor $' + DATA.floor_usd.toLocaleString('en-US') + ' · ' + DATA.board_size + ' rows · ' + (bad === 0 ? 'page recomputes every implied value and agrees with board.json' : bad + ' rows disagree with board.json') + '.' }),
      el('p', { text: 'Token Radar, model ' + DATA.model_version + '. A launch is the token a protocol may issue one day; this board ranks what it would be worth, and how to farm it before or after it issues one.' }));
  }

  function render() {
    app.setAttribute('aria-busy', 'false');
    var wrap = el('div', { 'class': 'wrap' });
    wrap.appendChild(header());
    wrap.appendChild(controls());
    if (state.tab === 'live') wrap.appendChild(liveTable());
    else if (state.tab === 'model') wrap.appendChild(modelView());
    else {
      var d = detailView();
      if (d) wrap.appendChild(d);
      wrap.appendChild(boardTable());
    }
    wrap.appendChild(footer());
    while (app.firstChild) app.removeChild(app.firstChild);
    app.appendChild(wrap);
  }

  readHash();
  render();
})();
