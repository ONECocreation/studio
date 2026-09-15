# WORK-CLAIM — TASK-262 — StudioPac for ONE Cocreation: the studio wears Love's brand

CLAIMED-BY: Number One (home crew, sonnet)
CLAIMED-AT: 0018.06.24 a₿ · block 967,044
BRANCH: feat/task-262-oc-brand
WORKTREE: /home/pac/dev/worktrees/task-262
BASE: develop @ e703f37 (pure upstream steveseguin/vdo.ninja, zero house commits)
REPO: ONECocreation/studio (~/dev/apps/onecocreation-studio) — NOT the OC Next.js repo, NOT the VPS

## Scope (OWNS)
Everything under `brand/`, `index.html`, `main.js`, `main.css`, `manifest.json`/favicons if present,
`README.md` (short "ONE Cocreation brand layer" section on top). Static site — no npm, no build step.

## Plan
1. Brand layer: `brand/onecocreation.css`, `brand/onecocreation.js`, `brand/rooms.json`, `brand/images/*`
   (copied read-only from ~/dev/onecocreation — colours/fonts from src/lib/brand-onecocreation.ts +
   src/brand/cartridge.ts, logo/lockup from public/brand/).
2. Minimal marked edits to index.html/main.js/main.css to load the brand layer, each edit gets
   `/* ONE Cocreation brand layer — TASK-262 */`.
3. Room identity banner (rooms.json → director view + join page), one-click guest join door,
   default-visible layout/scene hint strip, muted-guest join, leave/hangup control, chat default off
   for guests — every native hook verified by line number in main.js before relying on it.
4. Static serve + puppeteer shots (landing, ?room=, ?director=, 1440 + 390).
5. SUMMARY.md with Seams, Operator runbook, VDO param/hook line citations, LANE-DONE <sha>.

Standing clauses: never push, never touch VPS, never archive, derive-or-dash, no secrets, moving base
(git merge develop before final gates), worktree clean at end.
