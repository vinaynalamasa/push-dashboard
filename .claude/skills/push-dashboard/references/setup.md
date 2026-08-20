# Working on this project — Windows and macOS

The repo is developed from two machines. Nothing in it is platform-specific
(plain HTML/CSS/JS plus one Node script), but the shell, the paths and the
keyboard differ. Use whichever column matches the machine you are on.

## Quick reference

| | Windows | macOS |
|---|---|---|
| Shell | PowerShell, or Git Bash for POSIX syntax | Terminal (zsh) |
| Repo path | `C:\Users\arjun\OneDrive\Desktop\Moengage Automations\push-dashboard` | `~/Documents/GitHub/push-dashboard` |
| Hard refresh | Ctrl+Shift+R | **Cmd+Shift+R** |
| Copy / paste in terminal | Ctrl+C / Ctrl+V | Cmd+C / Cmd+V |
| Open a folder in terminal | Shift+right-click → "Open in Terminal" | drag the folder onto the Terminal window |

`git`, `node` and `npx serve .` behave identically on both. Prefer POSIX shell
syntax in anything committed to the repo — PowerShell has no `&&` chaining and
different redirection, so a POSIX one-liner is the portable choice.

## First-time setup

### Windows

1. **Git** — https://git-scm.com/download/win, accept the defaults.
2. **Node.js LTS** — https://nodejs.org, run the `.msi`.
3. **GitHub Desktop** — https://desktop.github.com, sign in.
4. **Claude Code** — https://claude.com/claude-code.

Verify in Git Bash or PowerShell:

```bash
git --version
node --version
```

### macOS

1. **Git** — already present, but the first run triggers the developer tools
   install. Run `git --version` in Terminal; if a dialog appears, click
   **Install** and wait.
2. **Node.js LTS** — https://nodejs.org, run the `.pkg`. (Or `brew install node`
   if Homebrew is already set up.)
3. **GitHub Desktop** — https://desktop.github.com, drag to Applications, sign in.
4. **Claude Code** — https://claude.com/claude-code.

### Both — clone and configure

```bash
git clone https://github.com/vinaynalamasa/push-dashboard.git
cd push-dashboard
git config --global user.name "Vinay"
git config --global user.email "social@gyantv.in"
```

Opening Claude Code from this folder — or from its parent — picks up this skill
automatically, because it lives at `.claude/skills/` inside the repo.

## Previewing locally

There is no build step. `index.html` is the source of truth; edit it directly.
`data.js` loads through a `<script>` tag rather than `fetch`, so opening the file
directly does work — but serving it is closer to production and avoids surprises:

```bash
npx serve .
```

Then open the URL it prints. Same command on both platforms.

## What travels between machines, and what does not

Everything in the repo travels: `index.html`, `data.js`, `tools/`, the Action,
the README, and this skill.

These live in the browser's localStorage and must be set up again per machine
**and per browser**:

- the GitHub admin token (see `publishing.md`)
- any locally saved CSV upload
- the light/dark theme choice

Multiple fine-grained tokens can exist at once, so generating a fresh one on a
second machine does not break the first.

## Session habits

**Pull before you start.** Publishing happens from the browser and commits
straight to the remote, so the remote moves without either clone knowing. Working
on a stale clone means a merge conflict in `data.js`, which is a large generated
file and unpleasant to resolve.

```bash
git pull
```

**Verify in a real browser, not by reading the diff.** Load the page, check the
console is clean, and confirm there is no horizontal overflow at a narrow width:

```js
document.documentElement.scrollWidth - document.documentElement.clientWidth   // want 0
```

Two real bugs here — all five tabs rendering stacked, and 31 px of overflow —
were invisible in the source and obvious in the DOM.

**Hard-refresh when checking the live site.** GitHub Pages caches hard; a plain
reload will show you the old file and waste ten minutes.
