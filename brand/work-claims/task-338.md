# TASK-338 — studio fork: scene preview + go-live from the director's desk, browser-only, no OBS (Phase A only)

Claimed: home-crew sub-agent (Sonnet 5), solo. Brief: `~/dev/home/inbox/TASK-338-oc-studio-scene-go-live.md`, superseded by its own CUT NOTE (Number One, 0018.06.28 a₿, block 967,605).
Branch: `feat/task-338-scene-preview-golive`. Worktree: `~/dev/worktrees/task-338`.
Base: ONECocreation/studio fork tip `3cc70b5` (`feat/task-336-host-presence`, open as PR #1) — NOT bare `develop`, per the CUT NOTE (T-336 added `mountStatusLine()` to the same two files this lane edits; that function is not touched here).
Source: the Admiral's ask, verbatim — "the director view gives love the ability to change scenes. we want to show her a preview and then allow her to select it and run it live from the vdo site if possible without obs."

OWNS: `brand/onecocreation.js`, `brand/onecocreation.css`, `brand/work-claims/task-338.md`.
NOT owned / not touched: `main.js`, `lib.js`, `index.html`, `webrtc.js`, `studio/**`, `brand/images/**`, `brand/rooms.json`. T-336's `mountStatusLine()` inside `brand/onecocreation.js` is READ-ONLY within this file too.

## Scope — Phase A only (browser-only, no VPS, no OBS)

A "Scenes" strip mounted in the fork's director dashboard (`#directorlayout`) only — never in guest views:
1. A chip per scene 0–8 (0 = the fork's always-on auto full mix; 1–8 = the native director-populated layouts, `rawdoc.md:9098-9103`). No scene-count detection exists anywhere in this fork's own JS (verified, grepped) — the fixed 0–8 strip is the named, honest default.
2. An on-demand preview per chip: tapping "Preview" loads a small iframe at that scene's own viewable VDO URL (`index.html?scene=<n>&room=<room>&cleanoutput&autostart[&password=<key>]`) — never auto-loaded, one at a time (preview cost is real, per the CUT NOTE).
3. "Make this live": a NAMED window (`window.open(url, "oc-broadcast")`) — first press opens the broadcast tab; a later press on any scene re-navigates that same tab; a closed/blocked tab falls back to opening (or offering to open) a fresh one. This is a URL swap, not an in-place scene switch — the in-place `postMessage({scene:...})` path (`main.js:9797-9802`) is a documented reach item, not built here.
4. Which scene is live is shown with the word "LIVE" on its chip — never colour alone.

Phase B (MediaMTX/WHIP push to YouTube) is explicitly NOT built here — a note only, per the brief and the CUT NOTE. No VPS work, no deploy, no env, no `src/lib/live-links.ts` change (T-336's own finding — no OC-site param was needed — still holds; this lane doesn't open an OC-site half at all, per the CUT NOTE).

## Gates

No `package.json` in this fork (static site) — `node --check brand/onecocreation.js` only.

## Rig

Live-verified on the puppeteer/fake-media rig (director + publishing guest), same recipe as T-336 (`~/dev/home/outbox/task-336/SUMMARY.md`), ports 4494–4497. Rig scripts live in `~/dev/home/outbox/task-338/rig/` — outside this repo, never committed here.
