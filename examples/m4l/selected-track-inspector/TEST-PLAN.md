# Test plan — Selected Track Inspector

## Environment

- Live: 12.1+ (our target)
- Max: 8.6
- OS: macOS and Windows

## Setup

A Live Set with:

- 4 audio tracks with varying device counts (0, 1, 3, 8 devices).
- 2 MIDI tracks with clips in some slots.
- 1 return track.
- 1 group track containing 2 of the audio tracks.
- The device loaded on any one of the tracks.

## Test cases

### T1: Basic display

1. Select a track with known name, device count, clip count.
2. Verify all three values display correctly in the device.

**Pass:** All three correct.

### T2: Selection change

1. Click through each track in sequence.
2. Verify the display updates for each.

**Pass:** Correct values for every track, including return and master.

### T3: Rapid selection change

1. Hold arrow keys to cycle through tracks rapidly for 10 seconds.
2. Verify no Max console errors.
3. Verify the final displayed values match the final selected track.

**Pass:** No errors, correct final state.

### T4: Track with zero devices

1. Select a track with no devices (except the inspector itself — it
   won't be on this track since it's loaded elsewhere).
2. Verify device count shows 0.

**Pass:** Displays "0" without error.

### T5: Master track

1. Select the master track.
2. Verify name, device count, clip count display.

**Pass:** Name shows "Master", device count is correct, clip count
is 0 or correct for master (master has no clip slots).

### T6: Track deletion during observation

1. Select track 2.
2. Delete track 2 while the device is displaying its info.
3. Verify no crash, no console error. The display should update to
   whatever track is now selected (or show a "no selection" state).

**Pass:** No crash. Display updates gracefully.

### T7: Save and reload

1. Note the currently displayed values.
2. Save the set. Close Live. Reopen the set.
3. Verify the device loads without console errors.
4. Verify the display shows correct values for the initially
   selected track after reload.

**Pass:** Clean load, correct display.

### T8: Duplicate device

1. Duplicate the device (Cmd-D / Ctrl-D).
2. Verify both instances show the same values and update
   independently.

**Pass:** Both show correct, identical values. No interference.

### T9: Multiple instances on different tracks

1. Load a second instance on a different track.
2. Switch selection. Both should update.

**Pass:** Both reflect the same selected track.

### T10: Group track fold/unfold

1. Select a group track. Note the displayed name.
2. Fold the group track.
3. Verify the display still works (the device is on a different
   track, but the selected track may change when folding).

**Pass:** No crash. Display reflects whatever track Live considers
selected after the fold.

## Console noise check

After running all tests, review the Max Window / Console. The device
should produce:

- Zero errors.
- Zero warnings.
- Optional: `post()` output from the JS script prefixed with
  `[TrackInspector]` for identification.
