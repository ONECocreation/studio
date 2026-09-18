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
	// director/view/push/SCENE link. "scene" added here TASK-338 --
	// LIVE-CAUGHT BUG (this lane's own rig screenshot): without it, a
	// scene-viewer URL (`?scene=<n>&room=<r>`, this lane's own preview
	// iframe src) was mis-classified as a bare guest join and got OUR
	// OWN mountJoinDoor() overlay slapped on top of the composited
	// video instead of showing the scene -- `&scene` is every bit as
	// much a real VDO view-mode param as `&view` (already in this
	// list) is (rawdoc.md:9098-9103), it was just missing from this
	// pre-existing array (T-262/T-302, unrelated to this lane's own
	// new code, but this file is this lane's to fix).
	var sourceParams = ["webcam", "wc", "miconly", "screenshare", "ss", "fileshare", "fs", "website", "iframe", "framegrab", "push", "view", "permaid", "scene"];
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

	// ---------------------------------------------------------------
	// Scenes strip (TASK-338), director dashboard ONLY: preview-then-
	// select, browser-only "go live" with no OBS. Love's ask, verbatim:
	// "the director view gives love the ability to change scenes. we
	// want to show her a preview and then allow her to select it and
	// run it live from the vdo site if possible without obs."
	//
	// A "scene" here is the fork's own numbered &scene=N layout
	// (rawdoc.md:9098-9103) — 0 is the always-on auto full mix, 1-8 are
	// director-populated (native buttons: addToScene data-scene="1"/
	// "2" at index.html:1941/1957, the S3..S8 row at index.html:1965-
	// 1986). No scene-count constant exists anywhere in this fork's own
	// JS (grepped: `grep -n "scene" brand/onecocreation.js` before this
	// change returned only an unrelated comment) — "in use" cannot be
	// cheaply detected from the brand layer alone, so a fixed 0-8 strip
	// is the named, honest default (CUT NOTE, 0018.06.28 a₿).
	//
	// A scene's composited output is itself a normal viewable VDO page
	// — verified base, same `&cleanoutput` (studio/app.js:302) and
	// `&password` fold (lib.js:27981-27989, the shape OC's own
	// live-links.ts `withRoomKey` already relies on) this director's
	// OWN url already carries:
	//   index.html?scene=<n>&room=<effectiveRoomId>&cleanoutput&autostart[&password=<key>]
	//
	// "Make this live": the director page cannot reload an arbitrary
	// OTHER tab it doesn't hold a live reference to. window.open(url,
	// "oc-broadcast") is the one call that does open/switch/reopen all
	// at once, natively: the first call with that target name opens a
	// fresh tab; a second call with the SAME name re-navigates that
	// same tab in place if it's still open; if that tab was closed (or
	// the browser's internal reference to it has gone stale) the
	// browser just creates a brand-new one under the same name — so
	// "open the broadcast tab" and "make scene N live" are literally
	// the same one-line call, and the tab-closed fallback needs no
	// special-case code at all. Only the pop-up-BLOCKED case needs an
	// explicit fallback (window.open returns null instead of a window)
	// — handled below with a visible inline notice plus a plain <a
	// href target="oc-broadcast"> the operator can click directly,
	// never a silent no-op.
	// ---------------------------------------------------------------
	var SCENE_IDS = [0, 1, 2, 3, 4, 5, 6, 7, 8];
	var BROADCAST_WINDOW_NAME = "oc-broadcast";

	function sceneUrl(sceneId) {
		var url = new URL("index.html", window.location.href);
		url.searchParams.set("scene", String(sceneId));
		if (effectiveRoomId) url.searchParams.set("room", effectiveRoomId);
		url.searchParams.set("cleanoutput", "");
		url.searchParams.set("autostart", "");
		// same &password this director's own URL carries, if any (TASK-305
		// shape, live-links.ts withRoomKey) -- every door into a keyed
		// room must carry the same key or it lands in a different room.
		var pw = params.get("password");
		if (pw) url.searchParams.set("password", pw);
		return url.href;
	}

	function sceneLabel(sceneId) {
		return sceneId === 0 ? "Scene 0 · full mix" : "Scene " + sceneId;
	}

	// Same-origin iframe (the scene URL shares this page's origin) --
	// its own <video> elements can be reached directly. LIVE-VERIFIED
	// this is load-bearing, not a defensive no-op (rig probe, fine-
	// grain 75ms samples): Chrome never actually BLOCKS autoplay of
	// this fork's WebRTC <video srcObject> elements, muted or not --
	// no documented viewer-side &mute param exists either way (&mute,
	// main.js:2229, is PUBLISH-side only) -- but the fork swaps in its
	// REAL video element (replacing an initial muted placeholder) UN-
	// MUTED by default once the stream attaches, which is wrong for an
	// on-demand PREVIEW thumbnail (the brief's own worry: several of
	// these could be open at once). This loop is what keeps a preview
	// silent: it re-asserts .muted = true within one poll tick of that
	// swap. Measured live: the unmuted instant lasts under one tick
	// (~75ms observed at a 75ms probe cadence) before being caught --
	// polled at 50ms here (tighter than the probe) to keep that gap as
	// small as practical without a MutationObserver, which is a
	// reasonable reach item if a zero-gap guarantee is ever needed.
	function forceMutedAutoplay(iframe) {
		var tries = 120; // ~6s at 50ms
		function tick() {
			tries--;
			var doc = null;
			try { doc = iframe.contentDocument; } catch (e) { /* cross-origin, shouldn't happen -- same host */ }
			if (doc) {
				var vids = doc.querySelectorAll("video");
				for (var i = 0; i < vids.length; i++) {
					var v = vids[i];
					if (!v.muted) v.muted = true;
					if (v.paused) {
						var p = v.play();
						if (p && p.catch) p.catch(function () {});
					}
				}
			}
			if (tries > 0 && iframe.isConnected) setTimeout(tick, 50);
		}
		tick();
	}

	function mountScenesStrip() {
		var dash = byId("directorlayout");
		if (!dash) return;
		if (byId("oc-scenes-strip")) return; // already mounted

		var strip = document.createElement("div");
		strip.id = "oc-scenes-strip";

		var header = document.createElement("div");
		header.id = "oc-scenes-header";
		var title = document.createElement("b");
		title.textContent = "Scenes";
		header.appendChild(title);
		var hint = document.createElement("span");
		hint.className = "oc-scenes-hint";
		hint.textContent = "Preview a scene, then make it live in one browser tab — no OBS.";
		header.appendChild(hint);
		var openBtn = document.createElement("button");
		openBtn.id = "oc-scenes-open-broadcast";
		openBtn.type = "button";
		openBtn.textContent = "Open broadcast tab (scene 0)";
		header.appendChild(openBtn);
		strip.appendChild(header);

		var notice = document.createElement("div");
		notice.id = "oc-scenes-notice";
		notice.hidden = true;
		strip.appendChild(notice);

		var list = document.createElement("div");
		list.id = "oc-scenes-list";
		strip.appendChild(list);

		var liveSceneId = null;
		var openPreviewId = null;
		var previewButtons = {};

		function setNotice(html) {
			notice.innerHTML = html;
			notice.hidden = false;
		}
		function clearNotice() {
			notice.hidden = true;
			notice.innerHTML = "";
		}

		function renderState() {
			SCENE_IDS.forEach(function (id) {
				var liveTag = byId("oc-scene-live-" + id);
				if (liveTag) liveTag.hidden = liveSceneId !== id;
				var btn = previewButtons[id];
				if (btn) btn.textContent = openPreviewId === id ? "Hide preview" : "Preview";
			});
		}

		function goLive(sceneId) {
			var url = sceneUrl(sceneId);
			var win = null;
			try {
				win = window.open(url, BROADCAST_WINDOW_NAME);
			} catch (e) {
				win = null;
			}
			if (!win) {
				setNotice(
					"Your browser blocked the pop-up. <a href=\"" + escapeHtml(url) + "\" target=\"" + BROADCAST_WINDOW_NAME + "\">Click here to open " + escapeHtml(sceneLabel(sceneId)) + " in the broadcast tab</a>, or allow pop-ups for this site and press “Make this live” again."
				);
				return;
			}
			try { win.focus(); } catch (e) { /* cross-window focus can throw in some sandboxes -- non-fatal */ }
			clearNotice();
			liveSceneId = sceneId;
			renderState();
		}

		function togglePreview(sceneId, slotEl) {
			if (openPreviewId === sceneId) {
				slotEl.innerHTML = "";
				openPreviewId = null;
				renderState();
				return;
			}
			// One preview at a time -- "preview cost is real": each
			// iframe is a full viewer pulling every stream in that
			// scene (CUT NOTE). Close whatever else is open first.
			if (openPreviewId !== null) {
				var prevSlot = byId("oc-scene-preview-" + openPreviewId);
				if (prevSlot) prevSlot.innerHTML = "";
			}
			openPreviewId = sceneId;
			var iframe = document.createElement("iframe");
			iframe.className = "oc-scene-preview-frame";
			iframe.setAttribute("allow", "autoplay");
			iframe.src = sceneUrl(sceneId);
			slotEl.innerHTML = "";
			slotEl.appendChild(iframe);
			forceMutedAutoplay(iframe);
			renderState();
		}

		openBtn.addEventListener("click", function () { goLive(0); });

		SCENE_IDS.forEach(function (id) {
			var chip = document.createElement("div");
			chip.className = "oc-scene-chip";
			chip.id = "oc-scene-chip-" + id;

			var row = document.createElement("div");
			row.className = "oc-scene-chip-row";
			var label = document.createElement("span");
			label.className = "oc-scene-label";
			label.textContent = sceneLabel(id);
			row.appendChild(label);
			var liveTag = document.createElement("span");
			liveTag.className = "oc-scene-live-tag";
			liveTag.id = "oc-scene-live-" + id;
			liveTag.textContent = "LIVE";
			liveTag.hidden = true;
			row.appendChild(liveTag);
			chip.appendChild(row);

			var actions = document.createElement("div");
			actions.className = "oc-scene-chip-actions";
			var previewBtn = document.createElement("button");
			previewBtn.type = "button";
			previewBtn.className = "oc-scene-preview-btn";
			previewBtn.textContent = "Preview";
			actions.appendChild(previewBtn);
			var liveBtn = document.createElement("button");
			liveBtn.type = "button";
			liveBtn.className = "oc-scene-golive-btn";
			liveBtn.textContent = "Make this live";
			actions.appendChild(liveBtn);
			chip.appendChild(actions);

			var slot = document.createElement("div");
			slot.className = "oc-scene-preview-slot";
			slot.id = "oc-scene-preview-" + id;
			chip.appendChild(slot);

			previewButtons[id] = previewBtn;
			previewBtn.addEventListener("click", function () { togglePreview(id, slot); });
			liveBtn.addEventListener("click", function () { goLive(id); });

			list.appendChild(chip);
		});

		// Mounted right after the T-302/T-336 banner+hints -- both are
		// inserted earlier in this same pollUntil callback in boot(),
		// so dash.children[2] is the first original (native) child.
		dash.insertBefore(strip, dash.children[2] || null);
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
	// Guest one-click join door (Build #5, extended TASK-302). Bare
	// ?room=<id> only.
	//
	// Primary door — "Join with camera + mic" — BOTH-OFF ARRIVAL
	// (TASK-302 Build #1): continues as
	// &webcam&mute&videomute&hangupbutton&label=<name>:
	//   webcam       — main.js:2037 (session.webcamonly = true; camera
	//                  is the capture source, screenshare button hidden)
	//   mute         — main.js:2229 (urlParams "mute"/"muted"/"m" ->
	//                  session.muted = true; mic is captured but starts
	//                  muted)
	//   videomute    — main.js:2237 (urlParams "videomute"/"videomuted"/
	//                  "vm" -> session.videoMutedFlag = true; camera is
	//                  captured but starts off) — TASK-302 addition so
	//                  the guest arrives with BOTH camera and mic off,
	//                  not mic-only
	//   hangupbutton — main.js:1942-1944 (urlParams "hangupbutton"/"hub"/
	//                  "humb64" -> session.hangupbutton = true) -> shows
	//                  #hangupbutton (index.html:291, onclick="hangup()")
	//                  which was MISSING by default (main.js:1938
	//                  nohangupbutton is also off by default, but so is
	//                  hangupbutton itself unless requested) — the
	//                  Admiral's "join button remained, need a
	//                  disconnect" fix
	//   label        — main.js:3533-3534 (display name)
	//
	// Camera-only door — "Join as a camera only (no mic)" (TASK-302
	// Build #3 — a second device/phone camera, the call #4 item 7
	// feedback-loop rule) — continues as
	// &webcam&audiodevice=0&hangupbutton&label=<name>:
	//   webcam        — main.js:2037, as above. No &videomute here: the
	//                   whole point of this door is a LIVE camera, so it
	//                   arrives ON, not muted.
	//   audiodevice=0 — main.js:4795-4806 (urlParams "audiodevice"/
	//                   "adevice"/"ad"/"device"/"d"/"ado"; value "0" /
	//                   "false" / "no" / "off" -> session.audioDevice =
	//                   0). PROOF this is a true no-mic join (the mic is
	//                   never even requested), not just a muted one:
	//                   previewWebcam() — the same permission-request
	//                   path the primary door's webcam join runs through
	//                   — builds `constraint = { audio: false }` when
	//                   session.audioDevice === 0 (lib.js:49555-49559),
	//                   and that exact constraint object is what reaches
	//                   navigator.mediaDevices.getUserMedia() via
	//                   requestBasicPermissions() (lib.js:49655-49657
	//                   call site, lib.js:48362+ definition, the
	//                   getUserMedia call at lib.js:48548-48549) — no
	//                   microphone permission prompt fires at all.
	//                   (`&miconly`, main.js:2040-2042, is the OPPOSITE
	//                   shape — mic captured, camera hidden/videoDevice
	//                   set to 0 — so it is deliberately NOT used here.)
	//   hangupbutton / label — as above.
	//
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

		// Build #1 — both-off arrival copy (verbatim, brief item 1).
		var note = document.createElement("p");
		note.className = "oc-join-note";
		note.textContent = "You arrive with camera and mic off. Turn them on when you're ready — the host can also unmute you.";
		door.appendChild(note);

		// Build #2 — the permission line (verbatim, brief item 2; one
		// line, phone-browser-safe wording — DuckDuckGo denied the
		// prompt on the call, walk notes item 9).
		var permission = document.createElement("p");
		permission.className = "oc-join-permission";
		permission.textContent = "Allow camera and microphone when your browser asks.";
		door.appendChild(permission);

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
		mutedNote.textContent = "Camera and mic off on arrival · a Leave button stays on screen once you're in";
		door.appendChild(mutedNote);

		// Build #3 — the quieter camera-only door.
		var cameraOnly = document.createElement("button");
		cameraOnly.id = "oc-join-camera-only";
		cameraOnly.type = "button";
		cameraOnly.textContent = "Join as a camera only (no mic)";
		door.appendChild(cameraOnly);

		var more = document.createElement("a");
		more.className = "oc-join-more";
		more.textContent = "More ways to join (screen share, media file, website…)";
		more.addEventListener("click", function () { door.remove(); });
		door.appendChild(more);

		function goPrimary() {
			var url = new URL(window.location.href);
			url.searchParams.set("webcam", "");
			url.searchParams.set("mute", "");
			url.searchParams.set("videomute", "");
			url.searchParams.set("hangupbutton", "");
			var name = nameInput.value.trim();
			if (name) url.searchParams.set("label", name);
			window.location.href = url.toString();
		}
		primary.addEventListener("click", goPrimary);
		nameInput.addEventListener("keyup", function (e) { if (e.key === "Enter") goPrimary(); });

		function goCameraOnly() {
			var url = new URL(window.location.href);
			url.searchParams.set("webcam", "");
			url.searchParams.set("audiodevice", "0");
			url.searchParams.set("hangupbutton", "");
			var name = nameInput.value.trim();
			if (name) url.searchParams.set("label", name);
			window.location.href = url.toString();
		}
		cameraOnly.addEventListener("click", goCameraOnly);

		document.body.appendChild(door);
	}

	// ---------------------------------------------------------------
	// Host-presence status line (TASK-336, revised on Number One's
	// send-back). Love's ask, precisely: "who/how many are connected to
	// ME right now" -- not a reading of the native per-tile viewer
	// badge, which double-counts in a multi-guest room and reads "0"
	// for the common lone-guest case while "Director is here" shows
	// beside it (self-contradicting -- the first cut of this line got
	// this wrong; see brief-lane SUMMARY.md for the full correction).
	//
	// "N others here" / "no one else here yet" / "connecting…" — the
	// count of DISTINCT peer UUIDs in the union of `session.pcs`
	// (peers receiving MY stream) and `session.rpcs` (peers I'm
	// connected to). Both are the fork's own live peer-connection
	// registries, not reinvented: LIVE-VERIFIED (3 tabs -- director +
	// 2 guests, puppeteer, port 4486, TASK-336 SUMMARY.md has the full
	// run) that in this fork's mesh topology `pcs` and `rpcs` hold the
	// IDENTICAL UUID set for every peer relationship observed (each
	// peer counted once in each dict, same UUID key both places) — so
	// summing badge VALUES (the first cut's mistake) double-counts,
	// but a UUID-keyed set union never can, by construction, regardless
	// of whether pcs/rpcs ever diverge (a one-way WHEP-style peer would
	// still only be counted once). Both dicts were verified to PRUNE
	// the UUID entirely on that peer's departure (not just null a
	// property) within ~10s in every run.
	//
	// The general (non-WHEP) creation/deletion of `pcs[UUID]`/
	// `rpcs[UUID]` for ordinary room peers is NOT in lib.js — grepped
	// exhaustively, lib.js only ever manipulates NESTED properties of
	// an already-existing entry (e.g. `delete session.rpcs[UUID].
	// stats[...]`), never the whole top-level UUID key. It lives in the
	// obfuscated `webrtc.js` (also brand-layer READ-ONLY, never
	// touched): `webrtc.js:9` (the entire bundle is one minified line)
	// near the `onGuestLeftMixMinus(...)` call does `delete _0x235e3c[
	// 'rpcs'][UUID]` on a peer's departure, and a `pcs[UUID]` deletion
	// sits nearby in the same departure cleanup; creation is two `=
	// new RTCPeerConnection(...)` assignments into `pcs[UUID]` and
	// `rpcs[UUID]` respectively, found via the shared hex string-table
	// index each site reuses for the literal 'pcs'/'rpcs' property
	// name. This is a live-code-reading citation, not a hand-trace —
	// the actual proof this lane relies on is the runtime behaviour
	// above (Object.keys(...) before/after each departure), not this
	// source dig, since the file cannot be meaningfully line-cited
	// beyond "the one line it all lives on."
	//
	// `session.rpcs[UUID].director === true` for the SAME shared
	// director-tagging as before (unchanged from the prior cut, still
	// live-verified in the 3-tab run: the two guests' own `rpcs` each
	// correctly tag ONLY the director's UUID `true` and the other
	// guest's UUID `null`/absent -- never mistags a fellow guest as the
	// director). `session.rpcs` is still the one keyed off for THIS,
	// not `session.directorList` (still verified NOT pruned on
	// departure -- unchanged finding from the prior cut).
	//
	// No longer gated on `&showconnections` / `window.session.
	// showConnections` -- this line no longer reads anything that flag
	// controls (the native `.rem-con-count` DOM badge is untouched by
	// this fork now; TASK-336's OC-site half correspondingly drops
	// `&showconnections` from both links -- see that repo's SUMMARY).
	// Only gated on `window.session` existing at all, so a guest never
	// sees a fabricated "0" in the brief instant before `session` is
	// even constructed.
	// ---------------------------------------------------------------
	function mountStatusLine() {
		pollUntil(function () {
			if (byId("oc-status-line")) return true;

			var header = byId("header"); // index.html:102, present in every room/call view (director dashboard and guest in-call alike)
			if (!header) return false;

			var line = document.createElement("div");
			line.id = "oc-status-line";
			var countEl = document.createElement("span");
			countEl.id = "oc-status-count";
			countEl.className = "oc-status-count";
			countEl.textContent = "connecting…";
			line.appendChild(countEl);

			var directorEl = document.createElement("span");
			directorEl.id = "oc-status-director";
			directorEl.className = "oc-status-director";
			directorEl.textContent = "Director is here";
			directorEl.hidden = true;
			line.appendChild(directorEl);

			header.appendChild(line);

			function distinctPeerCount() {
				if (!window.session) return null; // session not constructed yet -- never guess
				var seen = {};
				Object.keys(window.session.pcs || {}).forEach(function (u) { seen[u] = true; });
				Object.keys(window.session.rpcs || {}).forEach(function (u) { seen[u] = true; });
				return Object.keys(seen).length;
			}

			function directorPresent() {
				if (!(window.session && window.session.rpcs)) return false;
				var uuids = Object.keys(window.session.rpcs);
				for (var i = 0; i < uuids.length; i++) {
					if (window.session.rpcs[uuids[i]] && window.session.rpcs[uuids[i]].director === true) return true;
				}
				return false;
			}

			function updateStatus() {
				var n = distinctPeerCount();
				if (n === null) {
					countEl.textContent = "connecting…";
				} else if (n === 0) {
					countEl.textContent = "no one else here yet";
				} else {
					countEl.textContent = n + (n === 1 ? " other here" : " others here");
				}
				directorEl.hidden = !directorPresent();
			}
			updateStatus();
			setInterval(updateStatus, 1000);
			return true;
		}, 20, 250);
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
					mountScenesStrip(); // TASK-338, director dashboard only -- never a guest view
					return true;
				}, 30, 200);
				mountStatusLine();
			} else if (isBareGuestJoin) {
				mountJoinDoor(roomInfo);
			} else if (effectiveRoomId) {
				// in-call guest view (post-join-door redirect, a source
				// param like &webcam is now present) -- the join door
				// itself never shows a live count before a connection
				// exists, so this branch is the guest's actual call view.
				mountStatusLine();
			}
		});
	}

	if (document.readyState === "complete") {
		boot();
	} else {
		window.addEventListener("load", boot, { once: true });
	}
})();
