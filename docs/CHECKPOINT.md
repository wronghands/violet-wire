# Violet Wire | Canonical checkpoint

10 November 2026 · Issue #8 · Preset 58 renders red and green together. Speed `0` did not freeze it.

The active [speed comparison and custom-color research](SPEED_CONTRAST.md) tests speeds `0` and `100` in the same preset session. The owner observed roughly 130–135 movements per minute at `0`, with an unspecified counting unit. Independent custom-color addressing remains unverified. [Pinned English comparison](https://wronghands.github.io/violet-wire-tests/effect-58-v3/lab/) · [Owner report](https://github.com/wronghands/violet-wire/issues/8#issuecomment-6763627326)

## Active goal and releases

Show two user-selected stationary colors simultaneously on one 5 m RGB pixel neon strip, with roughly 75 LEDs per color. The current experiment compares motion in a known red–green preset. The separate protocol track investigates independent addressing.

- Canonical source is [wronghands/violet-wire](https://github.com/wronghands/violet-wire). [Issue #8](https://github.com/wronghands/violet-wire/issues/8) owns this investigation.
- [Normal controls, v0.2.1](https://wronghands.github.io/violet-wire/) are the hardware-verified baseline. The v0.3.0 split experiment was rolled back at [commit `cfb05d8`](https://github.com/wronghands/violet-wire/commit/cfb05d8ec72e47b4fa862582b05f9966e552f8fb).
- The [original test](https://wronghands.github.io/violet-wire-tests/effect-58-v2/lab/) and [current speed comparison](https://wronghands.github.io/violet-wire-tests/effect-58-v3/lab/) have separate version directories on the deployment mirror. [Original research](STATIONARY_COLORS.md) · [Protocol](PROTOCOL.md) · [Stable QA](QA.md)

## Hardware and evidence

- **Owner-reported.** USB supplies power only. MR Star and Elkotrol control the strip. BLE name `GATT--DEMO`, service `FFF0`, characteristic `FFF3` (`WRITE` and `WRITE_NO_RESPONSE`), notifications `FFF4`. The owner counted 146 visible LEDs and estimates another 4–6 beneath tape. Use about 150 physical LEDs. The estimate is 150–152 and the configured firmware count is unknown.
- **Owner-verified on hardware.** The Android Chrome v0.2.1 baseline works for BLE, custom HEX, favorites, and brightness. The hue picker sometimes needs a second attempt. The full-strip red frame `BC 04 06 00 00 03 E8 00 00 55` worked in nRF Connect. Separate case-by-case results for power, reconnection, raw HEX and notifications were not recorded.
- **Owner-verified on hardware.** In the withdrawn `SET_LENGTH=75` experiment, the first roughly half showed the requested color and the rest went dark. The exact packet sequence and timing are unknown. The prior-color tail retention hypothesis failed in that run. Built-in presets demonstrate multicolor rendering. Independent zone addressing and the mechanism that darkened the tail remain unknown.
- **Source-backed protocol.** Commands use `BC <opcode> <payload length> <payload> 55`. Global color uses `BC 04 06 <hue:u16 BE> <sat:u16 BE> 00 00 55` and brightness uses `BC 05 06 <level:u16 BE> 00 00 00 00 55`, 0–1000 in Violet Wire. Upstream length `BC 03 02 <count:u16 BE> 55` carries a total count without a start address.
- **Unknown.** Target firmware revision, stored LED count, meaning of `FFF4` notifications, response to speed `100`, and whether any external pixel, hold, or independent zone command exists.

## Exact test and next step

1. Open the speed comparison in Android Chrome. Run speed `0` first. It sends `BC 06 02 00 3A 55`, then `BC 08 01 00 55` as separate writes. Keep the same connection and preset for speed `100`, which sends only `BC 08 01 64 55`.
2. Count the same color boundary at the same fixed point in each 30-second window and note direction. A stationary result requires two colors at fixed positions throughout. Return sends `BC 04 06 00 00 03 E8 00 00 55`. Prior speed is unknown.
3. For a real hold or custom A/B command, compare a passive HCI capture of the installed MR Star or Elkotrol with physical output. Record app package/version and exact controls. Test Pause or DIY only when the app offers it. If it exposes palette editing, vary one color per observation. Keep full logs local and retain only redacted target bytes. [Capture steps](SPEED_CONTRAST.md#track-b--independently-chosen-colors-a-and-b)

No blind opcode testing, repeated length-tail experiment, hardware changes, controller opening, or firmware flashing.
