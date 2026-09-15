/* ============================================================
   ONE Cocreation brand layer — TASK-262
   StudioPac for vdo.onecocreation.com (Love's studio fork of VDO.Ninja).

   Loaded as a plain script (no bundler — this is a static site) after
   lib.js/main.js. Runs on window 'load' so `main()` (index.html:84,
   `<body onload="main()">`, main.js:10 `async function main()`) has
   already parsed the URL params it cares about. main() is async and
   some of its work (camera permission prompts, etc.) continues after
   'load' fires, so title/DOM edits below are re-applied a couple of
   times on a short delay as a safety net against main.js's own later
   writes (main.js sets document.title at lines 3550/3573/8081/8210;
   lib.js sets it at 2599/2601/6920/28458) — see reapplyTitle() below.

   Every native VDO.Ninja param/hook this file relies on was verified
   by grep against THIS fork's main.js/lib.js before use; the exact
   line is cited next to each use. Nothing here is invented.
   ============================================================ */
(function () {
	"use strict";

	var params = new URLSearchParams(window.location.search);

	// -- room id resolution, mirroring main.js's own precedence --------
	// director/dir wins over room/roomid/r (main.js:664-665 sets
	// session.director from director||dir; main.js:2059-2068 then
	// clears session.roomid when a director value is present).
	var directorId = params.get("director") || params.get("dir") || null;
	var roomId = params.get("room") || params.get("roomid") || params.get("r") || null;
	var isDirectorMode = !!directorId;
	var effectiveRoomId = directorId || roomId || null;

	// A "bare" guest join: a room id with none of the source-picker
	// params VDO recognises (main.js:2037 webcam/wc/miconly,
	// main.js:2058 screenshare/ss, main.js:2065 fileshare/fs,
	// main.js:2076 website/iframe, main.js:2085 framegrab) and not a
	// director/view/push link.
	var sourceParams = ["webcam", "wc", "miconly", "screenshare", "ss", "fileshare", "fs", "website", "iframe", "framegrab", "push", "view", "permaid"];
	var hasSourceParam = sourceParams.some(function (p) { return params.has(p); });
	var isBareGuestJoin = !isDirectorMode && !!roomId && !hasSourceParam;

	var PRODUCT_NAME = "ONE Cocreation";
	var STUDIO_LABEL = "Studio";

	function byId(id) { return document.getElementById(id); }

	// Mirrors the fork's own sanitizeRoomName() EXACTLY (lib.js:3747-3757:
	// `roomid.replace(/[\W]+/g, "_")`, 30-char cap) — confirmed live: the
	// director dashboard's own "Invite a guest" / "Capture a group scene"
	// copy-links (index.html directorLinks block) render the SANITIZED
	// id (e.g. a seeded "onecocreation-studio" shows there as
	// "onecocreation_studio"). If we matched rooms.json on the raw param
	// only, a guest following Love's own copied link would miss the
	// banner. Both the incoming param and the rooms.json keys are run
	// through this before comparing, so "-" and "_" forms of the same
	// id always resolve to the same entry.
	function normalizeRoomId(id) {
		if (!id) return id;
		return id.trim().replace(/[\W]+/g, "_").substring(0, 30);
	}

	// ---------------------------------------------------------------
	// rooms.json — id -> { title, note }. Unknown id: derive-or-dash,
	// never invented.
	// ---------------------------------------------------------------
	function loadRoomInfo(id, cb) {
		if (!id) { cb(null); return; }
		var normId = normalizeRoomId(id);
		fetch("./brand/rooms.json", { cache: "no-store" })
			.then(function (r) { return r.json(); })
			.then(function (rooms) {
				var entry = null;
				for (var key in rooms) {
					if (key === "_comment") continue;
					if (normalizeRoomId(key) === normId) { entry = rooms[key]; break; }
				}
				cb(entry ? { title: entry.title, note: entry.note, id: id, known: true }
					: { title: id, note: "—", id: id, known: false });
			})
			.catch(function () {
				cb({ title: id, note: "—", id: id, known: false });
			});
	}

	// ---------------------------------------------------------------
	// Chrome: lockup top-left, <title>, quiet AGPL/source credit line.
	// ---------------------------------------------------------------
	function brandChrome(roomInfo) {
		var logo = byId("logoname"); // index.html:99
		if (logo && !byId("oc-lockup")) {
			logo.innerHTML =
				'<span id="oc-lockup">' +
				'<img src="./brand/images/onecocreation-mark.svg" alt="" />' +
				'<span>' + PRODUCT_NAME + '<small>' + STUDIO_LABEL + '</small></span>' +
				'</span>';
			// main.js:517-582 — on any hostname other than vdo.ninja /
			// backup / proxy / alt / obs.ninja (i.e. every real
			// deployment of this fork, including vdo.onecocreation.com),
			// that block replaces #logoname's content with a bare "plug"
			// icon and then sets style.display/margin inline (line
			// 581-582), which runs AFTER us if main.js's own load work
			// lands late and BEFORE us otherwise — either way it can
			// leave our lockup hidden. Clear its inline overrides so the
			// lockup is guaranteed visible regardless of load order.
			logo.style.display = "";
			logo.style.margin = "";
		}

		var titleSuffix = roomInfo ? (" — " + roomInfo.title) : " — " + STUDIO_LABEL;
		var fullTitle = PRODUCT_NAME + titleSuffix;
		function applyTitle() {
			document.title = fullTitle;
			var mt = byId("metaTitle"); // index.html:44
			if (mt) mt.setAttribute("content", fullTitle);
		}
		applyTitle();
		// main.js/lib.js keep rewriting document.title as the room/view
		// state resolves (see file header) — reassert ours a couple of
		// times after main() has had a chance to run its own logic.
		setTimeout(applyTitle, 800);
		setTimeout(applyTitle, 2500);

		// Quiet AGPL/source line. #credits (index.html:1242) is emptied
		// or filled by main.js only for the bare landing page — append
		// rather than own it, and never remove the LICENCE/source link.
		var credits = byId("credits");
		if (credits && !credits.querySelector(".oc-quiet-credit")) {
			var line = document.createElement("div");
			line.className = "oc-quiet-credit";
			line.innerHTML = 'Studio by ONE Cocreation, built on <a href="https://github.com/steveseguin/vdo.ninja" target="_blank" rel="noopener">VDO.Ninja</a> (AGPLv3) · <a href="./LICENCE.md" target="_blank" rel="noopener">source</a>';
			credits.appendChild(line);
		}
	}

	// ---------------------------------------------------------------
	// Room banner — "which room am I opening" (Build #2). Same markup
	// mounted in the director dashboard and on the guest join door.
	// ---------------------------------------------------------------
	function makeBannerEl(roomInfo) {
		var el = document.createElement("div");
		el.id = "oc-room-banner";
		var eyebrow = roomInfo ? roomInfo.title : "—";
		var note = roomInfo && roomInfo.note ? roomInfo.note : "";
		el.innerHTML =
			'<span class="oc-room-dot"></span>' +
			'<span class="oc-room-eyebrow">' + escapeHtml(eyebrow) + '</span>' +
			(note ? '<span class="oc-room-note">' + escapeHtml(note) + '</span>' : '');
		return el;
	}

	function escapeHtml(s) {
		return String(s).replace(/[&<>"']/g, function (c) {
			return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
		});
	}

	// ---------------------------------------------------------------
	// Director view: banner + "Layouts · Scenes · Mute all" hint strip
	// (Build #3). Every control named here is verified to exist in
	// THIS fork; nothing is invented.
	// ---------------------------------------------------------------
	function mountDirectorExtras(roomInfo) {
		var dash = byId("directorlayout"); // index.html:1247, the whole director dashboard
		if (!dash) return;
		if (byId("oc-room-banner")) return; // already mounted

		dash.insertBefore(makeBannerEl(roomInfo), dash.firstChild);

		var hints = document.createElement("div");
		hints.id = "oc-director-hints";
		hints.innerHTML =
			'<b>Layouts · Scenes · Mute all</b>' +
			'<span class="oc-hint" id="oc-hint-links">Guest links &amp; scene buttons — open the Links panel</span>' +
			'<span class="oc-hint" id="oc-hint-muteall">Mute all guests — now in the control bar</span>' +
			'<span class="oc-hint" id="oc-hint-focus">Director focus — makes your camera the only one guests see</span>';
		dash.insertBefore(hints, dash.children[1] || null);

		// -- "Layouts / Scenes": the switcher lives inside the
		// collapsible "LINKS (GUEST INVITES & SCENES)" panel
		// (index.html:1248-1301, id="directorLinksButton" /
		// "directorLinks1" / "directorLinks2"), which starts
		// collapsed (style="display:none") and is toggled by
		// hideDirectorinvites() (lib.js:28077-28096). We expand it
		// once by default so the switcher is visible without a click,
		// per the brief ("make it visible by default").
		function expandLinksPanelOnce() {
			var btn = byId("directorLinksButton");
			var panel = byId("directorLinks2");
			if (!btn || !panel) return false;
			if (panel.style.display === "none" || panel.style.display === "") {
				btn.click(); // runs hideDirectorinvites(this) natively, lib.js:28077
			}
			return true;
		}
		pollUntil(expandLinksPanelOnce, 20, 250);

		byId("oc-hint-links").addEventListener("click", function () {
			expandLinksPanelOnce();
			var panel = byId("directorLinks2");
			if (panel) panel.scrollIntoView({ behavior: "smooth", block: "center" });
		});

		// -- "Mute all guests": #muteAllGuests (index.html:214) is
		// hidden by default and only unhidden natively when the URL
		// carries &muteall/&muteallguests/&muteguests (main.js:2342-
		// 2346). We reproduce that same unhide directly so directors
		// always have it, without forcing the URL param on guests.
		function showMuteAll() {
			var cb = byId("controlButtons");
			var mb = byId("muteAllGuests");
			if (cb) cb.classList.remove("hidden");
			if (mb) { mb.classList.remove("hidden"); return true; }
			return false;
		}
		pollUntil(showMuteAll, 20, 250);
		byId("oc-hint-muteall").addEventListener("click", function () {
			var mb = byId("muteAllGuests");
			if (mb) { mb.scrollIntoView({ behavior: "smooth", block: "center" }); flash(mb); }
		});

		// -- "Director focus": #highlightDirector (index.html:2852),
		// wired to requestInfocus() (lib.js:28928, "if (ele.id ===
		// 'highlightDirector')") via the "solo-video" action. Its own
		// title text is exact: "Only the director's video will be
		// visible to guests and within group scenes." We surface it,
		// we do NOT auto-check it — whether Love is on camera at all
		// is her live choice, not ours to force. See SUMMARY for the
		// honest limitation here (Build #4).
		byId("oc-hint-focus").addEventListener("click", function () {
			var span = byId("highlightDirectorSpan"); // index.html:2851
			if (span) { span.scrollIntoView({ behavior: "smooth", block: "center" }); flash(span); }
		});
	}

	function flash(el) {
		el.style.outline = "2px solid #C56E8B";
		el.style.outlineOffset = "2px";
		setTimeout(function () { el.style.outline = ""; el.style.outlineOffset = ""; }, 1600);
	}

	function pollUntil(fn, tries, delay) {
		if (fn() || tries <= 0) return;
		setTimeout(function () { pollUntil(fn, tries - 1, delay); }, delay);
	}

	// ---------------------------------------------------------------
	// Guest one-click join door (Build #5). Bare ?room=<id> only.
	// Continues as &webcam&mute&hangupbutton&label=<name>:
	//   webcam  — main.js:2037 (session.webcamonly)
	//   mute    — main.js:2229 (guest joins muted; director unmutes)
	//   hangupbutton — main.js:1943-1944 -> shows #hangupbutton
	//                  (index.html:291, onclick="hangup()") which was
	//                  MISSING by default (main.js:1938 nohangupbutton
	//                  is also off by default, but so is hangupbutton
	//                  itself unless requested) — this is the Admiral's
	//                  "join button remained, need a disconnect" fix.
	//   label   — main.js:3533-3534 (display name)
	// The five-source picker underneath (container-1..container-6,
	// index.html:369+) is native and untouched; "More ways to join"
	// just removes this overlay so it shows through.
	// ---------------------------------------------------------------
	function mountJoinDoor(roomInfo) {
		if (byId("oc-join-door")) return;

		var door = document.createElement("div");
		door.id = "oc-join-door";

		var banner = makeBannerEl(roomInfo);
		banner.style.position = "absolute";
		banner.style.top = "0";
		banner.style.left = "0";
		banner.style.right = "0";
		banner.style.justifyContent = "center";
		door.appendChild(banner);

		var mark = document.createElement("img");
		mark.className = "oc-join-mark";
		mark.src = "./brand/images/onecocreation-mark.svg";
		mark.alt = "";
		door.appendChild(mark);

		var h1 = document.createElement("h1");
		h1.textContent = "Join " + (roomInfo ? roomInfo.title : PRODUCT_NAME);
		door.appendChild(h1);

		var note = document.createElement("p");
		note.className = "oc-join-note";
		note.textContent = "One door in: camera + mic. You'll join muted — Love unmutes you when it's your turn.";
		door.appendChild(note);

		var nameInput = document.createElement("input");
		nameInput.id = "oc-join-name";
		nameInput.type = "text";
		nameInput.placeholder = "Your name (shown to Love)";
		nameInput.autocomplete = "off";
		door.appendChild(nameInput);

		var primary = document.createElement("button");
		primary.id = "oc-join-primary";
		primary.type = "button";
		primary.textContent = "Join with camera + mic";
		door.appendChild(primary);

		var mutedNote = document.createElement("div");
		mutedNote.className = "oc-join-muted-note";
		mutedNote.textContent = "Muted on arrival · a Leave button stays on screen once you're in";
		door.appendChild(mutedNote);

		var more = document.createElement("a");
		more.className = "oc-join-more";
		more.textContent = "More ways to join (screen share, media file, website…)";
		more.addEventListener("click", function () { door.remove(); });
		door.appendChild(more);

		function go() {
			var url = new URL(window.location.href);
			url.searchParams.set("webcam", "");
			url.searchParams.set("mute", "");
			url.searchParams.set("hangupbutton", "");
			var name = nameInput.value.trim();
			if (name) url.searchParams.set("label", name);
			window.location.href = url.toString();
		}
		primary.addEventListener("click", go);
		nameInput.addEventListener("keyup", function (e) { if (e.key === "Enter") go(); });

		document.body.appendChild(door);
	}

	// ---------------------------------------------------------------
	// boot
	// ---------------------------------------------------------------
	function boot() {
		loadRoomInfo(effectiveRoomId, function (roomInfo) {
			brandChrome(roomInfo);
			if (isDirectorMode) {
				pollUntil(function () {
					if (!byId("directorlayout")) return false;
					mountDirectorExtras(roomInfo);
					return true;
				}, 30, 200);
			} else if (isBareGuestJoin) {
				mountJoinDoor(roomInfo);
			}
		});
	}

	if (document.readyState === "complete") {
		boot();
	} else {
		window.addEventListener("load", boot, { once: true });
	}
})();
