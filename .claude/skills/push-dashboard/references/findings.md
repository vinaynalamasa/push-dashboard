# What the data said

Baseline from `Report-from-June-to-aug18_PUSH_20260818.csv`
(9,745 campaigns, 1 Jun – 19 Aug 2026). Re-derive rather than trusting these
numbers once new data is published — they are here as orientation and as a
regression check on the parser.

## Campaign mix

| Type | Campaigns | Sent | Uniq CTR | Conv/Sent |
|---|---|---|---|---|
| Manual | 2,201 | 13.91 cr | 0.411% | 0.104% |
| Lifecycle / Recurring | 1,299 | 9.51 cr | 0.355% | 0.052% |
| Backend Automated | 5,552 | 10.62 cr | 0.417% | 0.077% |
| D0 Testing | 28 | 0.08 cr | **3.843%** | **1.793%** |
| Others | 665 | 8.11 cr | 0.489% | 2.595% |

If a future parser change moves campaigns out of Manual / Lifecycle back into
Others in bulk, that is a regression, not new data.

## Manual campaigns — headline

99.63% delivery · 68.43% impression rate · **0.411% Unique CTR** · 0.284% CTR ·
0.95% CT conversion · 0.104% conv/sent

## The findings that mattered

**Volume is in the wrong categories.** Share Market + English + Social Media take
4.12 crore sends at ~0.32% Unique CTR. Horror/Crime + History + India Untold take
1.06 crore at ~0.51% — 60% better engagement on a quarter of the volume.

**10 AM is the weak slot.** 350 campaigns, 1.59 crore sends, 0.363% — third
heaviest slot, second worst performer. 9 PM (0.470%) and 10 PM (0.493%) are the
best high-volume hours.

**Hindi takes the most volume and returns the least.** 5.23 cr at 0.394%. Telugu
is best at 0.450% on 2.97 cr.

**Segmentation isn't paying off on clicks.** The un-split FreeUsers General blast
out-clicks both targeted splits (0.457% vs 0.412% Earning, 0.395% Non-Earning) —
but Earning converts best (0.119% conv/sent vs 0.092% for Non-Earning).

**Volume down, engagement up.** Jun 7.33 cr @ 0.322% → Jul 4.18 cr @ 0.516% →
Aug (partial) 2.40 cr @ 0.530%. A frequency-fatigue signature worth testing
deliberately.

**D0 is the best-performing and most under-invested channel.** 9.3× Manual on
Unique CTR, 17× on conv/sent, from 28 campaigns. Its delivery rate is only 86.7%
though — day-0 tokens go stale fast.

**Trial Users click 4.9× better than Free Users** in the lifecycle track (1.237%
vs 0.251%) on a twelfth of the volume.

**All 506 Cancelled-User campaigns sent zero notifications.** The whole win-back
track is silently dead. Worth re-checking whenever new data lands.

**32% of sends never reach a screen.** Delivery rate is 99.6% but impression rate
is 68%, so the loss is OS/user-side — killed apps, battery savers, notifications
switched off. Recovering 5 points here is worth more than any copy test.

## Open questions

**`Quiz_Live_Alert`.** One campaign, 4.88 crore sends, 20.73 lakh converted users
— **87% of every converted user in the export**, at 4.256% conv/sent versus
0.104% for Manual. Either it is the most valuable push GyanTV runs, or it is
attributed against a much looser Goal 1 than everything else. Until that is
settled, treat any blended conversion number that includes "Others" with
suspicion.

**1,123 campaigns sent zero** — 506 Cancelled Users, 441 backend, 78 others, 44
manual. Worth a periodic check.

**Naming drift at source.** `KA` vs `KN`, `DDMMYYYY` vs `YYYYMMDD`,
`Free_Users (Hindi)` vs `FreeUsers`, `Govtschemes` vs `Governmentschemes`,
`03:30 PM` vs `0330PM`, missing segment tokens (272 Manual campaigns), missing
content-series IDs. The parser absorbs all of it, but fixing it at source is what
makes segment analysis trustworthy.

## Suggested next moves

1. Move 10 AM volume to 9–10 PM — ~30% engagement lift on 1.59 crore sends, no new content
2. Fix the Cancelled Users track
3. Confirm `Quiz_Live_Alert`'s Goal 1
4. Shift volume from Share Market / English / Social Media to Horror / History / India Untold
5. Scale D0, and fix its 86.7% delivery
6. Chase the 32% impression gap — notification channel config, TTL, priority, collapse keys
7. Give Trial Users more volume
8. Turn on control groups and read Uplift — without it none of the above is causal
