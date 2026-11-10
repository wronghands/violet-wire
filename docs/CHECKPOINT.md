# Violet Wire | Canonical checkpoint

10 November 2026 · Issue #8 · Physical effect test pending

## Active goal and releases

Show two different stationary colors simultaneously on one 5 m RGB pixel neon strip. The target is roughly 75 red and 75 blue LEDs. The current experiment uses a fixed red–green preset to test stationarity. Independent addressing remains unverified.

- Canonical source is [wronghands/violet-wire](https://github.com/wronghands/violet-wire). [Issue #8](https://github.com/wronghands/violet-wire/issues/8) owns this investigation.
- [Normal controls, v0.2.1](https://wronghands.github.io/violet-wire/) are the hardware-verified baseline. The v0.3.0 split experiment was rolled back at [commit `cfb05d8`](https://github.com/wronghands/violet-wire/commit/cfb05d8ec72e47b4fa862582b05f9966e552f8fb).
- [Pinned HTTPS experiment](https://wronghands.github.io/violet-wire-tests/effect-58-v2/lab/) uses a separate versioned deployment so main releases do not displace the test. [Research and hardware test](STATIONARY_COLORS.md) · [Protocol](PROTOCOL.md) · [QA plan](QA.md)

## Hardware and evidence

- **Owner-reported.** USB supplies power only. MR Star and Elkotrol control the strip. BLE name `GATT--DEMO`, service `FFF0`, characteristic `FFF3` (`WRITE` and `WRITE_NO_RESPONSE`), notifications `FFF4`. The owner counted 146 visible LEDs and estimates another 4–6 beneath tape. Use about 150 physical LEDs. The estimate is 150–152 and the configured firmware count is unknown.
- **Owner-verified on hardware.** The Android Chrome v0.2.1 baseline works for BLE, custom HEX, favorites, and brightness. The hue picker sometimes needs a second attempt. The full-strip red frame `BC 04 06 00 00 03 E8 00 00 55` worked in nRF Connect. Separate case-by-case results for power, reconnection, raw HEX and notifications were not recorded.
- **Owner-verified on hardware.** In the withdrawn `SET_LENGTH=75` experiment, the first roughly half showed the requested color and the rest went dark. The exact packet sequence and timing are unknown. The prior-color tail retention hypothesis failed in that run. Built-in presets demonstrate multicolor rendering. Independent zone addressing and the mechanism that darkened the tail remain unknown.
- **Source-backed protocol.** Commands use `BC <opcode> <payload length> <payload> 55`. Global color uses `BC 04 06 <hue:u16 BE> <sat:u16 BE> 00 00 55` and brightness uses `BC 05 06 <level:u16 BE> 00 00 00 00 55`, 0–1000 in Violet Wire. Upstream length `BC 03 02 <count:u16 BE> 55` carries a total count without a start address.
- **Unknown.** Target firmware revision, stored LED count, meaning of `FFF4` notifications, speed-zero behavior, and whether any external pixel or independent zone command exists.

## Exact test and next step

1. Open the pinned test in Android Chrome and connect to `GATT--DEMO`. Trigger the test once. It writes `BC 06 02 00 3A 55` (published red–green running water, effect 58), then `BC 08 01 00 55` (published minimum speed), as two separate writes. A speed of zero may still move or behave differently on this firmware. No length write is part of the test.
2. Observe the entire strip for at least 30 seconds with no further writes. Record whether different colors are visible at the same time and whether their boundaries move. A moving pattern, single color, or colored prefix with a dark tail fails the stationary test. A stationary preset verifies only that preset. Independent control requires changing one region while the other stays fixed.
3. Restore solid red with `BC 04 06 00 00 03 E8 00 00 55`. This writes a known color and does not restore the previous animation speed or settings. The browser write log and physical behavior are separate evidence.
4. If the effect fails or is inconclusive, capture a short passive Android HCI trace of the owner's installed MR Star or Elkotrol on this strip. Record app package/version, connect, two-color preset selection, minimum speed, 30 seconds idle, then solid red. Map the actual `FFF3` value handle and compare the writes. Keep the full trace local and retain only redacted target rows and observations.

No blind opcode testing, repeated length-tail experiment, hardware changes, controller opening, or firmware flashing.
