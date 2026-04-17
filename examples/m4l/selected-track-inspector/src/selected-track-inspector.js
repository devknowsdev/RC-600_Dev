/**
 * selected-track-inspector.js
 *
 * Displays info about the currently selected track:
 *   outlet 0: track name (symbol)
 *   outlet 1: device count (int)
 *   outlet 2: clip slot count with clips (int)
 *
 * Demonstrates:
 *   - Correct LiveAPI initialization (wait for live.thisdevice bang)
 *   - Observer reuse (create once, repoint via .id)
 *   - Initialization guard (prevents observer duplication on repeated bang)
 *   - id == 0 guarding
 *   - getcount() for list iteration
 *   - No writes from inside callbacks (read-only device)
 *
 * Lifecycle:
 *   First bang from [live.thisdevice] calls init() once.
 *   Subsequent bangs trigger a manual refresh without creating new observers.
 *   This prevents observer accumulation, which is the #1 LiveAPI JS mistake.
 *   See DECISIONS.md D3 and docs/principles/observer-architecture.md.
 *
 * Architecture: see DECISIONS.md in this directory.
 */

autowatch = 1;
inlets = 1;
outlets = 3;

// Declare observers at module scope; initialize in init().
var selectionObserver = null;
var nameObserver = null;

// Current bound track id (for display refresh).
var currentTrackId = 0;

// Lifecycle guard: prevents repeated init on multiple bangs.
// [live.thisdevice] should only bang once, but autowatch reloads,
// Max UI interactions, and user-wired bangs can retrigger.
var initialized = false;

/**
 * Called when [live.thisdevice] bangs — safe to use LiveAPI.
 * Also callable manually for a refresh without re-initialization.
 */
function bang() {
    if (!initialized) {
        init();
        initialized = true;
    } else {
        // Already initialized — just refresh the display.
        var track = new LiveAPI("live_set view selected_track");
        if (track.id != 0) {
            refreshDisplay(track);
        }
    }
}

function init() {
    // Observer 1: watch for selection changes on Song.View.
    selectionObserver = new LiveAPI(onSelectionChanged, "live_set view");
    selectionObserver.property = "selected_track";

    // Observer 2: watch the name of whatever track is currently bound.
    // Created once; repointed on each selection change.
    nameObserver = new LiveAPI(onNameChanged);

    // Initial bind.
    bindToSelectedTrack();
}

/**
 * Fired when `selected_track` on `live_set view` changes.
 */
function onSelectionChanged(args) {
    bindToSelectedTrack();
}

/**
 * Fired when the bound track's `name` changes.
 */
function onNameChanged(args) {
    // args typically: ["name", <new_name>]
    if (args.length >= 2) {
        outlet(0, args[1]);
    }
}

/**
 * Resolve the current selected track and rebind observers.
 */
function bindToSelectedTrack() {
    var track = new LiveAPI("live_set view selected_track");

    if (track.id == 0) {
        // No track selected (rare but possible during deletion/startup).
        outlet(0, "(no track)");
        outlet(1, 0);
        outlet(2, 0);
        currentTrackId = 0;
        nameObserver.id = 0;  // detach
        return;
    }

    currentTrackId = track.id;

    // Rebind name observer to the new track.
    nameObserver.id = track.id;
    nameObserver.property = "name";  // re-arm observation

    // Read and output current state.
    refreshDisplay(track);
}

/**
 * Read current track state and send to outlets.
 */
function refreshDisplay(trackApi) {
    // Name
    var name = trackApi.get("name");
    outlet(0, name);

    // Device count
    var deviceCount = trackApi.getcount("devices");
    outlet(1, deviceCount);

    // Clip slots with clips
    var slotCount = trackApi.getcount("clip_slots");
    var clipsPresent = 0;

    for (var i = 0; i < slotCount; i++) {
        var slot = new LiveAPI(
            "live_set view selected_track clip_slots " + i
        );
        if (slot.id == 0) continue;

        var hasClip = slot.get("has_clip");
        // get() returns 1 or 0 for bool properties
        if (hasClip == 1) {
            clipsPresent++;
        }
    }

    outlet(2, clipsPresent);
}
