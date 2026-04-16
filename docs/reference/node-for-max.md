---
id: ref-node-for-max
title: Node for Max — primer
surface: m4l
live_version: "12.x"
max_version: "8.6"
evidence: official
confidence: medium
source: "https://docs.cycling74.com/apiref/nodeformax/"
last_verified: 2026-04-16
related: [ref-liveapi-js-notes, ref-threading-and-deferral]
---

# Node for Max

Node for Max runs a Node.js process alongside a Max patch, letting you use
the npm ecosystem, make network calls, hit a filesystem, run long-lived
servers, and do anything else Node does — within a Max for Live device.

This enables categories of M4L tools that are awkward or impossible in
patch-only or `[js]`-only code.

## When Node for Max is the right tool

- **HTTP / REST / WebSocket.** OSC is fine for local sync; HTTP needs Node.
- **File I/O beyond Max's reach.** Bulk file operations, watching directories.
- **Third-party libraries.** Anything on npm, including ML runtimes,
  database drivers, audio analysis tools.
- **Long-lived processes.** A server that stays up for the life of the
  device, accepting messages from Max and responding.
- **Spawning child processes.** Running external executables (command-line
  tools, ffmpeg, etc.).

## When it's NOT the right tool

- **Real-time audio.** Node runs in a separate OS process. Round-trip
  latency to Max is not zero; it's not for per-sample work.
- **Simple computation.** Use `[js]` (in-process) for anything that doesn't
  need npm or OS-level access. Cheaper, simpler, lower latency.
- **LiveAPI from Node.** Node for Max code does **not** have direct access
  to `LiveAPI`. You bridge through Max messages: Node sends a message, the
  patch uses `[live.object]` / `[js]` to interact with LiveAPI, then sends
  a message back.

## Architecture

```
Max patch          Node script          External world
─────────────      ────────────         ──────────────
[node.script]  ⇄   max-api messages  ⇄
      ↕                                  npm modules,
   patch ops                             HTTP, files, etc.
      ↕
[live.object]
      ↕
  LiveAPI
```

Communication between Max and Node uses the `max-api` module on the Node
side and `[node.script]` on the Max side. Messages flow in both directions.

## Minimal example

Max patch has `[node.script my-script.js]`.

`my-script.js`:

```javascript
const maxApi = require('max-api');

maxApi.addHandler('ping', () => {
  maxApi.outlet('pong');
});

maxApi.addHandler('fetch', async (url) => {
  const res = await fetch(url);
  const text = await res.text();
  maxApi.outlet('data', text);
});
```

From the patch, sending `ping` to `[node.script]` results in `pong` at
the outlet. Sending `fetch https://example.com` makes the HTTP call.

## Packaging constraints

When distributing a Max for Live device that uses Node for Max:

- **Dependencies must be vendored.** The user's machine won't have your
  npm packages. Run `npm install` before freezing; the `node_modules`
  directory is included in the frozen `.amxd`.
- **The device becomes significantly larger.** A single npm dependency
  can add 100 MB of `node_modules`.
- **Node version matters.** Max bundles its own Node runtime. Check the
  version (Max 8.6's Node version) and test against that — not against
  whatever version is on your dev machine.
- **Platform-specific binaries are a trap.** Packages that have native
  modules (e.g. `better-sqlite3`, `sharp`) ship prebuilt binaries per
  platform. If your user is on a different OS or architecture than you,
  the binary may not load. Test on macOS and Windows, both Intel and
  Apple Silicon where relevant.

## Threading implications

Node for Max runs in a **separate OS process**, not a separate Max thread.
This has consequences:

- No direct memory sharing with the Max patcher.
- IPC overhead per message. Not for high-rate traffic; batch where you can.
- Node is not bound by Max's thread-priority rules. But the messages it
  sends back into Max arrive on Max's main thread (or scheduler, depending
  on your outlet configuration).
- Crashes in Node do not take down Max. Useful for isolation.

## What's missing from this note

- A worked M4L + Node example device in this repo's `examples/`.
- Documented version of Max's bundled Node across Max 8.x releases.
- Tested patterns for bidirectional LiveAPI access from Node via bridge.

## References

- Node for Max API reference: https://docs.cycling74.com/apiref/nodeformax/
- `max-api` module: https://www.npmjs.com/package/max-api
- Node for Max tutorial: https://docs.cycling74.com/userguide/m4l/node_for_max/
  (verify path; Cycling '74 restructures its docs periodically)
