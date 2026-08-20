# Publishing and access control

## The model

`data.js` is the published dataset. Replacing it in the repo is the only thing
that changes what other people see. GitHub Pages serves the repo root, so a push
to `main` goes live in about a minute.

The dashboard is read-only unless a GitHub token is present in that browser's
localStorage, or `?admin=1` is in the URL. `?admin=1` only reveals the admin box
— without a valid token the Publish button refuses. **The token is the access
control, not the URL.** It is never in the repo and never in `index.html`.

## Four ways to refresh the data

**A — Admin Publish button.** Upload CSV in the dashboard, check the numbers,
click *Publish loaded data to everyone*. It reads the current file SHA from the
GitHub Contents API, then PUTs the new `data.js`. Best route, because you see
the numbers before they go live.

**B — `incoming/` folder + Action.** A repo collaborator drops a CSV into
`incoming/` on github.com. The *Refresh dashboard data* workflow converts it,
commits `data.js`, and deletes the CSV. No token needed. Requires repo →
Settings → Actions → General → Workflow permissions → **Read and write**.

**C — Command line.** `node tools/csv-to-data.mjs "<export>.csv"`, then commit
and push. Prints the detected column mapping first.

**D — Download and commit.** Admin mode's *Download data.js*, drop the file in,
commit in GitHub Desktop.

## Setting up an admin

Fine-grained token, generated from the person's **account** settings (avatar →
Settings → Developer settings, at the bottom of the sidebar — *not* the repo's
Settings page, which is a common wrong turn):

- Repository access: Only select repositories → `push-dashboard`
- Permissions: Repository permissions → **Contents: Read and write**. Nothing else.
- Set an expiry.

Then open the dashboard with `?admin=1`, paste, **Save token**. After that the
admin box appears on the plain URL too. *Sign out* wipes it.

Revoke by deleting the token on github.com — effective immediately, everywhere.

### The fine-grained token limitation

A fine-grained PAT only works for repositories owned by the person who created
it. A collaborator on someone else's **personal** repo cannot create one for it
— the repo won't even appear in their picker. So for anyone other than the repo
owner, use route B (`incoming/` + collaborator access), or move the repo to a
GitHub Organization, where each member can mint their own scoped token.

## Gotchas

- **Publishing twice with identical data creates an empty commit.** Harmless,
  just history noise.
- **Publishing commits on the server**, so your local clone falls behind. `git
  pull` before doing any local work or you'll hit a merge conflict in a large
  generated file.
- **Pages caches hard.** Verify with a hard refresh — Ctrl+Shift+R on
  Windows/Linux, Cmd+Shift+R on macOS — not a plain reload.
- **`incoming/` is empty by design** after a Publish-button refresh — that route
  never touches it. To confirm a publish landed, look at `data.js` → History.
- **Size ceiling.** The Publish button refuses above 3 MB and tells you to use
  the download-and-commit route. ~800 KB for 9,745 campaigns is the current
  baseline, so there's plenty of headroom.

## data.js shape

```js
window.PUSH_DATA = {
  generated: "2026-08-19",   // latest send date inside the data
  published: "2026-08-19",   // when this file was written
  source: "Report-from-June-to-aug18_PUSH_20260818.csv",
  cols: [ ...10 canonical column names... ],
  rows: [ [name, sentTime, sent, failed, impr, clicks, uimpr, uclicks, ctconv, vtconv], ... ]
};
```

The header chip reads `published` (falling back to `generated` for older files)
and shows it as "Last updated". Those are genuinely different facts — don't
collapse them.
