---
name: push-dashboard
description: Working knowledge of the GyanTV push notification performance dashboard — a single-file HTML dashboard that reads MoEngage push CSV exports, published to GitHub Pages at vinaynalamasa.github.io/push-dashboard. Use this skill whenever the user mentions the push dashboard, MoEngage exports, push notification performance, campaign name parsing, Unique CTR / delivery rate / conversion metrics for pushes, refreshing or publishing data.js, the admin publish flow, or asks to change anything in index.html in this repo. Also use it when the user pastes a MoEngage CSV, asks why an upload failed, asks what a metric means, or wants analysis of push performance by language, category, audience segment or send hour — even if they never say the word "dashboard".
---

# GyanTV Push Notification Dashboard

A zero-dependency, single-page dashboard for MoEngage Android push exports.
Everything runs in the browser: no server, no build step, no npm install.

- **Live:** https://vinaynalamasa.github.io/push-dashboard/
- **Repo:** `vinaynalamasa/push-dashboard`, branch `main`, GitHub Pages from root

## Files

| File | Role |
|---|---|
| `index.html` | **The entire app** (~100 KB). Markup, CSS, and all JS inline. This is the source of truth — edit it directly. There is no build step and no template file. |
| `data.js` | The published dataset (~800 KB). Sets `window.PUSH_DATA`. Replacing this is what updates the dashboard for everyone. |
| `tools/csv-to-data.mjs` | Node script: MoEngage CSV → `data.js`. |
| `.github/workflows/refresh-data.yml` | Action: a CSV dropped in `incoming/` becomes `data.js`. |
| `README.md` | User-facing instructions for admins. |

Working on it locally means serving the folder over HTTP — `file://` breaks
nothing here (data.js is a `<script>` tag, not a fetch), but serving is closer
to production:

```bash
npx serve .        # or any static server, then open the printed URL
```

This repo is developed from both a Windows machine and a Mac. The code is
identical on both; the shell, paths and shortcuts are not. See
`references/setup.md` for the per-platform commands, and prefer POSIX shell
syntax in anything committed — PowerShell has no `&&` chaining.

## The three things that are easy to get wrong

**1. The CSV parser must stay RFC-4180 correct.** MoEngage exports contain
commas inside quoted header names, escaped `""` quotes, and — the killer — real
newlines inside quoted message-body fields. A typical export has ~9,900 `\n`
characters but only ~9,750 rows. Anything that splits on `\n` or `,` before
handling quotes silently desyncs the whole file and reports "missing columns".
The bundled `parseCSV()` is a character-by-character state machine; keep it that
way. Never reintroduce a CDN parser — a strict CSP blocks external scripts when
the page is viewed as an artifact, and it dies offline.

**2. Columns are matched by name, never by index.** Exports vary. Each field in
`FIELD_SPECS` declares exact names it has been seen under plus a loose pattern
and a veto pattern, scored to prefer `All Platform` > `Total` > `Android` and
shorter names. Only Campaign Name and Sent are required; everything else missing
becomes 0 so the page still loads. If you add a metric, add a spec — don't index
into the row.

**3. Campaign names carry the dimensions.** Language, segment, category and send
hour all come from parsing the campaign name. The grammar has drifted over time
and the parser deliberately tolerates that. See `references/data-model.md` before
touching `classifyAndParse()` — a stricter parser silently dumps millions of
sends into "Others", which is exactly the bug that was fixed here.

## How data gets published

Three sources, checked in this order:

1. **The viewer's own upload** (localStorage) — admins only, never leaves their browser
2. **`data.js`** — what everyone sees
3. Nothing — the page asks for a CSV

The dashboard is **read-only by default**. Upload / Download / Reset render only
when a GitHub token is present, or when `?admin=1` is in the URL. The token is
the access control, not the URL — it lives in the admin's own localStorage and
must never appear in the repo.

To publish: admin uploads a CSV → clicks **Publish loaded data to everyone** →
the page commits `data.js` via the GitHub Contents API → Pages rebuilds in ~1 min.

Details and the token-free alternative are in `references/publishing.md`.

## Metrics

The dashboard leads with **Unique CTR** (`Unique Clicks ÷ Unique Impressions`),
not CTR, because CTR divides by Sent and so mixes creative quality with delivery
problems. Full formulas and the plain-English explanations shown in the hover
tooltips are in `references/data-model.md`.

Every metric name in a table heading or KPI tile has a `data-tip-key` pointing
into `METRIC_HELP`. If you add a metric, add its help entry too — the tooltips
are the only place a non-specialist learns what `VT Conv %` means.

## Charts

Hand-rolled inline SVG, no chart library. Series colours come from CSS custom
properties (`--series-1..7`) so they can be stepped per theme, and both the dark
and light sets were validated for colour-vision deficiency against their own
surface. If you change a series colour, re-validate rather than eyeballing it.
The light set carries a contrast warning on three hues, which is acceptable only
because every chart here sits directly above or below its own data table.

Never use two y-axes. Two measures of different scale get two charts — that's
why engagement, conversion and delivery are three separate cards.

## Conventions worth keeping

- **Verify in a browser, not by reading the diff.** Load the page, check the
  console is clean, and confirm `document.documentElement.scrollWidth ===
  clientWidth` at a narrow width. Two real bugs here (all five tabs rendering
  stacked; 31 px of horizontal overflow) were invisible in the source and obvious
  in the DOM.
- **`git pull` before you start.** Publishing commits from the browser, so the
  remote moves without your local clone knowing. Editing `index.html` on a stale
  clone means a merge conflict in a large generated file.
- **Hard-refresh to check the live site** — Ctrl+Shift+R on Windows/Linux,
  Cmd+Shift+R on macOS. Pages caches hard and a plain reload lies to you.
- Numbers are formatted `en-IN` (lakh/crore grouping) — that is deliberate.
- Percentages use varying decimal places by metric; the `dec` field in `COLS`
  controls it. Unique CTR runs ~0.4%, so 3 decimals matter.

## Reference files

- `references/setup.md` — Windows and macOS setup, local preview, per-platform differences
- `references/data-model.md` — campaign name grammar, column detection specs, metric formulas
- `references/publishing.md` — admin setup, tokens, the Action route, gotchas
- `references/findings.md` — what the data actually said, and the open questions
