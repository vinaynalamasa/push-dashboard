# Data model

## Campaign name grammar

Language, audience segment, content category and send hour are all read out of
the campaign name. Five families are recognised, in this order:

### 1. Backend Automated
```
gyantv-t49702-cs28405
```
`^gyantv[-_]t\d+[-_]cs\d+$`. No dimensions parsed — these are system-triggered.

### 2. D0 Testing
```
D0_KA_FreeUsers_D0(Kannada)_Govtschemes_10AM
D0_TA_FreeUsers_D0(Tamil)_Parttimeearning_11AM_3844
```
`D0` _ language _ segment… _ category _ time [_ contentSeriesId]

### 3. Manual
```
16062026_KA_FreeUsers_Earning(KA)_Parttimeearning_1030AM_9274
20260106_Telugu_ShareMarket_0930AM
```
date _ language [_ segment…] _ category _ time [_ contentSeriesId]

Tolerances that matter — each of these exists in the real data:
- **Date**: `DDMMYYYY` (the documented convention) **or** `YYYYMMDD`. Try
  day-first; if the month lands above 12, fall back to year-first.
- **Language**: two-letter code or spelled out. `KA` **and** `KN` both mean
  Kannada. Codes: TA/TAM/TAMIL, TE/TEL/TELUGU, KA/KN/KAN/KANNADA, HI/HIN/HINDI.
- **Segment**: may be absent entirely → "Not specified".
- **Content series ID**: may be absent.
- **Time**: `0930AM`, `1030PM`, `330PM`, `9PM`, `07PM`, `10AM`, `03:30 PM`.

The time token is the gate — a name only classifies as Manual if the
second-to-last token parses as a time. That is what stops arbitrary
underscore-separated names being misread.

### 4. Lifecycle / Recurring
```
TE_NLU_Sun_W2_9PM
NLU_Mon_W1_330PM
CU_Wed_W1_12PM
```
`[language _] stage _ day _ W<n> _ time`. Recognised when a lifecycle stage code
is present **and** some token matches `W\d+` **and** some token is a weekday.

Stage codes: `NLU` never logged-in · `FU` free · `TU` trial · `SU` subscribed ·
`CU` cancelled · `PU` paid. No category in these names.

### 5. Others
Everything else — one-off blasts like `Quiz_Live_Alert`, `Daily Astrology 3 july`,
`Side income Masterclass sub users`, `Test_campaign_V1`.

### Why the tolerance matters

Before the parser was widened, "Others" held **47.5% of all volume** — 1,299
lifecycle campaigns and 294 date-prefixed manual campaigns were invisible
because of a spelled-out language, a `YYYYMMDD` date, or a `KN` instead of `KA`.
Tightening this parser will silently hide data rather than throw an error, so
change it only with a before/after campaign-class count.

## Column auto-detection

`FIELD_SPECS` maps ten logical fields onto whatever the export calls them.
Each spec has:

- `exact` — normalised names seen in real exports, tried in priority order
- `any` — a loose regex fallback
- `not` — a veto regex, which is what stops `Sent` matching `Sent Rate` or
  `Campaign Sent Time`, and `Clicks` matching `Unique Clicks` or
  `Goal 1 Click Through Converted Users`
- `required` — only `name` and `sent` are

Fallback scoring prefers `All Platform` (+300) > `Total` (+200) > `Android`
(+100), then shorter names. A column already claimed by an earlier spec can't be
reused.

Headers are normalised by stripping BOM and quotes, collapsing `_ - .` and
whitespace to single spaces, and lowercasing.

Values go through `num()`, which survives `"12,345"`, `" 1234 "`, `"12.5%"` and
empty strings.

The ten fields: `name`, `sentTime`, `sent`, `failed`, `impr`, `uimpr`, `clicks`,
`uclicks`, `ctconv`, `vtconv`.

A typical export is **209 columns**; the dashboard keeps only these ten, which
is why `data.js` is ~800 KB rather than 10 MB.

## Metric formulas

| Metric | Formula | Why it exists |
|---|---|---|
| Delivery Rate | `(Sent − Failed) ÷ Sent` | Token health. ~99.6% is normal; below 98% means dead tokens. |
| Impression Rate | `Impressions ÷ Sent` | Reached a screen. ~68% here — the gap to Delivery Rate is phones that never surfaced it. |
| **Unique CTR** | `Unique Clicks ÷ Unique Impressions` | The honest creative signal. Not punished by undelivered pushes. **This is the headline metric.** |
| CTR | `Clicks ÷ Sent` | Volume planning only — conflates creative with delivery. |
| CT Conversion % | `CT Converted Users ÷ Unique Clicks` | Measures the landing content, not the notification. |
| Conv / Sent % | `(CT + VT Converted Users) ÷ Sent` | End-to-end worth of one send. |
| VT Conversion % | `VT Converted Users ÷ Impressions` | The assist — saw it, didn't tap, converted anyway. |

Conversion figures are **Goal 1 only**. Goal 2, revenue, AOV, and the control-group
columns exist in the export but are not read.

## Send hour

Taken from the time token in the campaign name; when a name has no time, falls
back to the hour in MoEngage's `Campaign Sent Time`. That fallback is what lets
the Hourly tab work for Backend Automated campaigns too.

## Unused columns worth knowing about

The export carries `Control Group CVR`, `Global Control Group CVR` and their
Uplift columns. Those are the only columns that answer *"did the push cause the
conversion?"* — everything currently shown is correlation. Wiring them up is the
single highest-value addition to this dashboard.
