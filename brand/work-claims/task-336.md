# TASK-336 — studio fork: host-presence for Love — an honest connection count, and "Director is here" ONLY if the fork can actually tell a guest

Claimed: home-crew sub-agent (Sonnet 5), solo. Brief drafted 0018.06.27 · 20:10 a₿ · block 967,513 (research-first, no BFT date math performed by this claim — citing the brief's own stamp only).
Branch: `feat/task-336-host-presence`. Worktree: `~/dev/worktrees/task-336-studio`.
Base: ONECocreation/studio `develop` @ `0a17a5c` (T-302 merge).
Source: Love's ask (host in the room) — (a) know when someone is watching from the director room, (b) a better indicator of how many are watching and listening. Brief: `~/dev/home/inbox/TASK-336-oc-studio-host-presence.md`.

OWNS: `brand/onecocreation.js`, `brand/onecocreation.css`, `brand/work-claims/task-336.md`.
NOT owned / not touched: `main.js`, `lib.js`, `index.html`, `webrtc.js`, `brand/images/**`, `studio/**`, `brand/rooms.json` (no per-room toggle needed).

## Scope
1. A small, text-safe status line in the guest/host view: "N connected" always, sourced from the native `connectionDetails` element the fork already renders when `&showconnections` is set (`lib.js:56884-56886`, `total_outbound_p2p_connections`, DOM class `.rem-con-count`) — mirrored, never reinvented.
2. "Director is here" ONLY if the live two-tab verification (Ground, brief) confirms a real signal a guest's own client can read. See SUMMARY for the live-test result and the honest call made.

No upstream file edit needed — everything lives in `brand/onecocreation.js` + `brand/onecocreation.css`. `brand/rooms.json` left untouched (no per-room toggle needed for this lane).
