# TASK-302 — studio fork: the join door tells you which room, asks for permissions in one line, arrives both-off, and offers a camera-only door

Claimed: home-crew sub-agent (Sonnet 5), solo. 0018.06.25 a₿.
Branch: `feat/task-302-join-door`. Worktree: `~/dev/worktrees/task-302`.
Base: ONECocreation/studio `develop` @ `ce27928` (T-262 brand layer merge).
Source: Love call #4 items 4, 6, 7, 9; T-292 DESIGN.md §1 (params pinned with fork lines) + §3 lane 5.

OWNS: `brand/onecocreation.js`, `brand/onecocreation.css`, `brand/rooms.json`, `brand/work-claims/task-302.md`.
NOT owned / not touched: `main.js`, `lib.js`, `index.html`, `webrtc.js`, `brand/images/**`.

## Scope
1. Both-off arrival on the primary join door (`&videomute&mute`) + copy.
2. Permission line above/near the join button.
3. A second, quieter camera-only door (no mic) using a verified no-mic param.
4. Room name/title stays on the door (already read from `rooms.json`); add the underscore-native room-id key.
5. `node --check` + JSON-parse gates; door shots at 1440/390 for a known and an unknown room id.

No upstream file edit was needed — everything lives in `brand/onecocreation.js`, `brand/onecocreation.css`, `brand/rooms.json`.
