---
id: research-live-as-plugin-host
title: Live as plugin host — scope and what we need to verify
surface: plugin-host
live_version: "12.x"
max_version: "8.6"
evidence: inference
confidence: low
last_verified: 2026-04-16
related: [ref-lom-plugindevice]
---

# Live as plugin host

If this repo is to support expert judgment across all the surfaces in
scope, external-plugin-in-Live reasoning must be part of it. But we
cannot claim authority we don't have: our grounding on the Ableton plugin
developer portal is thin, and we have not shipped a plugin through Live
validation in this repo. This note frames the territory honestly so
future work can build on it rather than replace it.

Marked `evidence: inference`, `confidence: low`.

---

## What's clearly in scope

External plugins — VST2, VST3, Audio Unit (on macOS) — hosted by Live.
The plugin is built outside of Live (in a plugin SDK, framework, or DSP
toolchain) and validated inside Live as a host.

What a user / developer needs to know about Live-as-host specifically,
separate from generic cross-DAW plugin development:

- **Parameter handling.** How Live exposes plugin parameters for
  automation. Which parameters become LOM-visible (see
  `ref-lom-plugindevice`). The "Configure" button's role in exposing
  parameters.
- **MPE support in Live 11+.** What plugins need to do to receive MPE
  note-per-channel data correctly.
- **Latency reporting and PDC.** Live's plugin delay compensation
  handling.
- **Sidechaining.** How Live routes audio into a plugin's sidechain
  input and which plugin metadata exposes the input for routing.
- **Freeze and flatten behavior.** What happens to plugins during
  track freeze. State preservation, determinism expectations.
- **Device chain ordering constraints.** Which plugin types can go
  where (MIDI effect → instrument → audio effect).
- **Plugin crash sandboxing.** Live's behavior when a plugin crashes.
- **Push integration for plugins.** How Live banks plugin parameters
  for Push display.

## What requires official source we don't yet have

- The specific metadata fields Live reads from a plugin's
  description/factory. VST3's `Steinberg::Vst::ParameterInfo`,
  AU's parameter info struct, VST2's legacy params — which fields
  Live cares about, which it ignores, which it overrides.
- Live's rules for parameter automation curve interpretation.
- Live's preset-browser integration — how Live discovers and
  categorizes plugin presets.
- The Ableton Plugin Developer Portal's current content — access
  requirements, document scope, update frequency.
- Live's behavior around plugin crash recovery, sandbox boundaries,
  and crash-report content specific to plugin crashes (vs Live core).

## What can be said responsibly right now

From community knowledge and general plugin-hosting understanding:

1. **Plugin parameters must be exposed** (user-configured in Live's
   Configure dialog) to appear in the automation chooser and the LOM's
   `parameters` list on `PluginDevice`. This is unlike Max for Live,
   where all `[live.*]` UI parameters are exposed automatically.

2. **Not every plugin parameter is automatable in Live.** Plugins can
   mark parameters as non-automatable; Live respects this.

3. **Live supports VST2, VST3, and AU** — AU macOS-only. VST2 support
   has been deprecated upstream by Steinberg but Live (as of 12.x)
   continues hosting VST2 plugins.

4. **MPE plugins in Live 11+** receive per-note expression via
   standard MIDI on per-note channels. Plugins that were MPE-aware in
   other hosts before Live's MPE support should largely work without
   modification. Verification in Live specifically is still required.

5. **Latency reporting** — plugins that correctly report latency get
   PDC-corrected. Plugins that misreport cause visible timing
   problems — users blame Live, but the plugin is wrong.

## What we must not say right now

- The exact APIs a VST3 plugin should call to integrate with Live's
  Configure dialog (we haven't verified).
- Specific version-to-version changes in Live's plugin hosting
  (we haven't researched the 12.0 → 12.1 → 12.2 → 12.3 changelog with
  this question in mind).
- Which plugin frameworks (JUCE, iPlug2, C74 RNBO, etc.) have
  particular quirks with Live as host.
- How Ableton Live differs from Live Suite/Standard/Intro in plugin
  support scope.
- The mechanics of Ableton's own commercial plugin certification /
  partnership process.

Any claim in the above categories would need fresh research and probably
contact with Ableton's plugin developer program.

## Experiments that would raise confidence

1. **Parameter visibility round-trip.** Build a trivial test plugin
   with (say) 16 parameters of varying types. Load in Live. Use the
   Configure dialog to expose parameters. Read back what appears in
   the LOM's `parameters` list for the `PluginDevice`. Document
   which parameter types are exposed cleanly, which fail, and what
   the `name` / `original_name` / `is_quantized` fields look like.

2. **Latency reporting behavior.** Plugin that reports
   `kLatencyInSamples = 256`. Verify `Device.latency_in_samples`
   reflects this. Check that PDC works in an Arrangement with the
   plugin in a send chain.

3. **Freeze / flatten preservation.** Non-deterministic plugin
   (uses its own random seed). Freeze a track containing it. Verify
   the frozen audio is deterministic after subsequent unfreezes.

4. **MPE passthrough.** MIDI clip with MPE data. Plugin marketed as
   MPE-aware. Verify the plugin receives the per-note expression
   data correctly, verify recording MPE from a Push 3 into a clip
   routed through the plugin.

None of these are trivial — each requires a buildable plugin and
iteration in Live. Writing up even one of them would turn this note
from a research-map into a grounded reference.

## Decision rule for this surface

Until the experiments above happen, when a user asks about Live as
plugin host:

- Answer generic plugin-development questions normally.
- For Live-specific claims, cite what we have or acknowledge the gap.
- Direct them to Ableton's plugin developer portal and to their
  plugin framework's Ableton Live integration documentation (JUCE,
  iPlug2, etc.).
- Do not invent specific APIs, flags, or behavior we haven't
  verified.

## References to pursue

- Ableton Plugin Developer Portal (requires application).
- Steinberg VST3 SDK documentation — host integration chapter.
- Apple Audio Unit Programming Guide.
- JUCE's Ableton Live integration documentation and community forum
  threads.
- `PluginDevice` LOM page:
  https://docs.cycling74.com/apiref/lom/plugindevice/
