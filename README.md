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

## Viewers vs admins

**By default the dashboard is read-only.** Someone opening the link sees the
published data and nothing else — no *Upload new CSV*, no *Download data.js*,
no *Reset*. They cannot change what anyone sees.

**Admin mode** appears only for someone holding a GitHub token for this repo.
The token is the access control: it lives in that person's own browser
(localStorage) and is never in this repo or in `index.html`. Adding
`?admin=1` to the URL reveals the admin box, but without a valid token the
Publish button just refuses.

### Setting someone up as an admin

1. That person signs in to GitHub and goes to
   **Settings → Developer settings → Personal access tokens → Fine-grained tokens
   → Generate new token**.
2. **Repository access:** Only select repositories → this repo.
   **Permissions:** Repository permissions → **Contents: Read and write**.
   Nothing else. Set an expiry (90 days is sensible).
3. They open `https://vinaynalamasa.github.io/push-dashboard/?admin=1`, paste
   the token, click **Save token**. From then on the admin box appears for them
   on the plain URL too.
4. *Sign out* in the admin box wipes the token from that browser.

To revoke someone: delete their token on github.com. It stops working
immediately, everywhere.

## Updating the data for everyone

### Option A — admin Publish button (one click)

1. Open the dashboard as an admin, click **Upload new CSV**, pick the export.
2. Check the numbers.
3. Click **Publish loaded data to everyone**. It commits `data.js` to the repo
   over the GitHub API.
4. GitHub Pages rebuilds in about a minute. Hard-refresh (`Ctrl + Shift + R`).

### Option B — upload the CSV on github.com (no token)

Give the person **Write** access to the repo (Settings → Collaborators), then:

1. On github.com, open the `incoming/` folder → **Add file → Upload files**.
2. Drag the MoEngage CSV in, commit it.
3. The **Refresh dashboard data** Action converts it to `data.js`, commits
   that, and deletes the raw CSV. Nothing else to do.

### Option C — command line

```bash
node tools/csv-to-data.mjs "C:\path\to\Report_PUSH_20260818.csv"
```

It prints the column mapping it detected and writes `data.js`; commit and push
with GitHub Desktop.

### Option D — download and commit by hand

Admin mode also has **Download data.js**. Save it, drop it into this folder
replacing the old one, then commit and push in GitHub Desktop.

## Local uploads (admins only)

An admin's upload is also saved in their own browser so it survives a refresh,
with a banner saying it is not yet public. *Reset to published data* clears it.
Publishing clears it too, so the admin ends up seeing exactly what everyone
else sees.

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
