# Selected Track Inspector

A minimal Max for Live utility device that displays information about
the currently selected track. Intended as both a useful debugging tool
and the repo's first end-to-end example.

## Status

**Skeleton only.** The README, decisions log, test plan, and JS
scaffolding are committed. The `.maxpat` and `.amxd` files must be
built in Max by a human with the software.

## What the device should do

When loaded on any track:

1. Display the **name** of the currently selected track.
2. Display the **number of devices** on that track.
3. Display the **number of clip slots** with clips in them.
4. Update all three when selection changes.

That's it. Deliberately minimal — the point is to demonstrate correct
LiveAPI patterns, not to do anything musically useful.

## Architecture decisions

See `DECISIONS.md` in this directory.

## Files

| File | Status | Purpose |
| --- | --- | --- |
| `README.md` | ✅ Written | This file |
| `DECISIONS.md` | ✅ Written | Architecture choices |
| `TEST-PLAN.md` | ✅ Written | How to test the device |
| `src/selected-track-inspector.js` | ✅ Written | JS logic |
| `src/selected-track-inspector.maxpat` | ❌ Build in Max | Max patcher |
| `release/selected-track-inspector.amxd` | ❌ Freeze in Max | Frozen release |

## How to build

1. Open Max (8.6+).
2. Create a new Max for Live Audio Effect.
3. Add a `[js selected-track-inspector.js]` object. Place the `.js`
   file from `src/` in the same directory as the patcher.
4. Add three `[live.text]` objects for display (track name, device
   count, clip count). Set them to display-only mode.
5. Wire `[live.thisdevice]` → `[js]` inlet for initialization.
6. Enter Presentation mode. Lay out the three text displays.
7. Save as `selected-track-inspector.maxpat`.
8. Test (see `TEST-PLAN.md`).
9. Freeze → save frozen to `release/`.
