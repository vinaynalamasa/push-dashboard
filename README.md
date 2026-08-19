# GyanTV Push Notification Performance Dashboard

Live: https://vinaynalamasa.github.io/push-dashboard/

A single-page dashboard for MoEngage push exports. Everything runs in the
browser — no server, no database, nothing is uploaded anywhere.

## Files

| File | What it is |
|---|---|
| `index.html` | The dashboard itself (~73 KB). Charts, tables, CSV parser, all of it. |
| `data.js` | **The published dataset.** This is what everyone who opens the URL sees. |
| `tools/csv-to-data.mjs` | Converts a MoEngage CSV export into `data.js`. |

## How the data works

There are three possible data sources, in priority order:

1. **Your own saved upload** — when you click *Upload new CSV*, the file is
   parsed in your browser and saved in that browser's local storage. It
   survives a refresh, but **only you can see it**. A banner says so.
2. **`data.js`** — the published dataset. This is what a teammate opening the
   URL gets. Committing a new `data.js` is what updates the dashboard for
   everybody.
3. Nothing — the page asks you to upload a CSV.

*Reset to published data* clears your local upload and goes back to `data.js`.

## Updating the data for everyone

### Option A — no command line (easiest)

1. Open the dashboard, click **Upload new CSV**, pick the new MoEngage export.
2. Check the numbers look right.
3. Click **Download data.js**. Your browser saves a file called `data.js`.
4. Move that file into this repo folder, replacing the existing `data.js`.
5. Open GitHub Desktop → it shows `data.js` as changed → write a summary
   ("Data refresh <month>") → **Commit to main** → **Push origin**.
6. Wait ~1 minute, then hard-refresh the live URL (`Ctrl` + `Shift` + `R`).

### Option B — command line

```bash
node tools/csv-to-data.mjs "C:\path\to\Report_PUSH_20260818.csv"
```

It prints the column mapping it detected, writes `data.js`, then commit and
push as above.

## Campaign types

The dashboard reads the campaign name to work out language, segment, category
and send hour. Five families are recognised:

| Type | Name shape | Example |
|---|---|---|
| **Manual** | `<date>_<lang>[_<segment>]_<category>_<time>[_<contentSeriesId>]` | `16062026_KA_FreeUsers_Earning(KA)_Parttimeearning_1030AM_9274` |
| **Lifecycle / Recurring** | `[<lang>_]<stage>_<day>_W<n>_<time>` | `TE_NLU_Sun_W2_9PM` |
| **D0 Testing** | `D0_<lang>_<segment>_<category>_<time>` | `D0_KA_FreeUsers_D0(Kannada)_Govtschemes_10AM` |
| **Backend Automated** | `gyantv-t<id>-cs<id>` | `gyantv-t49702-cs28405` |
| **Others** | anything else | `Quiz_Live_Alert` |

Lifecycle stage codes: `NLU` never logged-in · `FU` free · `TU` trial ·
`SU` subscribed · `CU` cancelled · `PU` paid.

The parser tolerates naming drift: `DDMMYYYY` or `YYYYMMDD`, `KA` or `KN` for
Kannada, two-letter codes or spelled-out languages, a missing segment, a
missing content-series ID, and time written as `0930AM` / `330PM` / `07PM` /
`03:30 PM`.

## Columns

Column names and positions are auto-detected, not hard-coded to an index.
Each field has a list of exact names plus a pattern fallback, preferring
`All Platform` > `Total` > `Android`. Only **Campaign Name** and **Sent** are
required; anything else missing is treated as 0.

After each upload the banner has a **Column mapping** panel showing exactly
which CSV column fed which metric.

## Metrics

| Metric | Formula |
|---|---|
| Delivery Rate | `(Sent − Failed) ÷ Sent` |
| Impression Rate | `Impressions ÷ Sent` |
| **Unique CTR** | `Unique Clicks ÷ Unique Impressions` |
| CTR | `Clicks ÷ Sent` |
| CT Conversion % | `CT Converted Users ÷ Unique Clicks` |
| Conv / Sent % | `(CT + VT Converted Users) ÷ Sent` |
| VT Conversion % | `VT Converted Users ÷ Impressions` |

Conversion figures are **Goal 1 only**. Hover any column heading in the app
for a plain-English explanation.
