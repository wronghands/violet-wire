# Two stationary colors on the GATT--DEMO strip

## Evidence as of 10 November 2026

| Status | Observation |
| --- | --- |
| Confirmed by the owner on the target strip | The v0.2.1 app controls global color and brightness. `BC 04 06 00 00 03 E8 00 00 55` produced solid red. Built-in presets render multiple colors. |
| Confirmed by the owner on the target strip | In the withdrawn v0.3.0 length experiment with `SET_LENGTH=75`, the first roughly half lit in the requested color and the rest went dark. The full packet sequence and timing were not recorded. The tail-retention hypothesis failed in the observed run. |
| Physical estimate | 146 LEDs visible plus an estimated 4–6 under tape, so about 150–152 total. Use 150 when describing the strip for this test. |
| Unknown | The configured LED count, exactly how the controller darkened the tail, whether speed zero freezes a pattern, and whether the firmware exposes independent zone or pixel writes. |

The observed prefix and dark tail are consistent with a controller-wide length limit. The published length packet carries a total count with no start index, color, or zone identifier. The observation cannot distinguish a deliberate clear, a renderer reset, or other firmware behavior. This experiment leaves the count alone. [Issue #8 hardware record](https://github.com/wronghands/violet-wire/issues/8) · [mr-star-ble length encoding](https://github.com/mishamyrt/mr-star-ble/blob/main/mr_star_ble/commands.py#L48-L54)

## What the sources support

- The compatible Python client defines whole-strip hue/saturation, brightness, LED count, built-in effect ID, direction, and speed. Findn independently lists the red/green and green/blue running-water preset IDs. The code inspected exposes no packet for a pixel buffer, start/end address, independent color slots, or a pause command. That leaves device-specific firmware capabilities open. [mr-star-ble command IDs](https://github.com/mishamyrt/mr-star-ble/blob/main/mr_star_ble/const.py#L10-L18) · [mr-star-ble effect IDs](https://github.com/mishamyrt/mr-star-ble/blob/main/mr_star_ble/const.py#L61-L69) · [Findn effect table](https://github.com/hirotasoshu/ha-findn-led-ble/blob/main/custom_components/findn_led_ble/device_protocol.py#L40-L47)
- An UltraLux manual for related MR Star-compatible products shows one static color in Adjust and six dynamic effect groups in Mode, with speed, brightness and direction controls. Its PIXELS setting adjusts the total controlled count. Its IR C7 preset splits the strip into equal halves for outward-moving color waves. The manual gives no BLE effect ID for C7 and no stop or speed-zero semantics. This is evidence about those products and their client UI. [UltraLux controller manual, pp. 8–10](https://www.ultralux.bg/downloads/upotreba/2708_LSG510USB_LSG520USB_Instruction.pdf#page=8)
- Android clients with similar names have separate identities. The Findn project identifies `com.findn.mrstar` as its upstream client, while Play listings identify `com.frok.mrstar` and the older `com.weifeng.lightbar`. Elkotrol uses `com.leet.elkotrol` and advertises pattern and speed control and `GATT--DEMO` compatibility. These listings describe user-facing controls. The proprietary APK code and a capture from the owner's installed versions were unavailable for this investigation. [Findn integration](https://github.com/hirotasoshu/ha-findn-led-ble#readme) · [MR Star](https://play.google.com/store/apps/details?id=com.frok.mrstar) · [Miracles Star](https://play.google.com/store/apps/details?id=com.weifeng.lightbar) · [Elkotrol](https://play.google.com/store/apps/details?hl=en-GB&id=com.leet.elkotrol)

## Running-water speed test

The goal of this test is to see whether one built-in pattern can show simultaneous stationary colors. Red and green come from the published preset. The layout, actual colors and behavior at minimum speed depend on the target controller. The reviewed catalogues did not show a red/blue-only running-water preset.

Use the [pinned HTTPS test](https://wronghands.github.io/violet-wire-tests/effect-58-v2/lab/). The [deployment mirror](https://github.com/wronghands/violet-wire-tests) keeps the page and its transport modules together under `effect-58-v2/`. Preserve that directory when publishing further experiments. The canonical source is `lab/` in `wronghands/violet-wire`. A rollback of the stable app does not remove the pinned test.

| Action | Separate write to `FFF3` | Evidence |
| --- | --- | --- |
| Try, first write | `BC 06 02 00 3A 55` | Built-in red/green running water, effect 58. |
| Try, second write | `BC 08 01 00 55` | Published speed encoder accepts 0 as its minimum. Whether the firmware freezes, slows, ignores or interprets it differently is unknown. |
| Return to solid red | `BC 04 06 00 00 03 E8 00 00 55` | Owner-verified global red packet. GlowBridge reports that a global color exits effect mode on compatible units. Prior color, effect and speed are not read back. |

The lab writes the two Try frames in order, once each. Connection and page load should send no light commands. Restore is a separate action and does not recover the exact previous settings. The browser reporting a write does not establish that the controller applied it. [Effect and speed encoding](https://github.com/mishamyrt/mr-star-ble/blob/main/mr_star_ble/commands.py#L38-L47) · [GlowBridge effect handling](https://github.com/ronnygeo/GlowBridge/blob/main/docs/PROTOCOL.md#L95-L120)

1. Verify the full strip lights solid red in [v0.2.1](https://wronghands.github.io/violet-wire/). If only the prefix lights, report that baseline and leave the count untouched. Disconnect v0.2.1 and close any MR Star, Elkotrol or nRF Connect connection to the strip.
2. Open the pinned lab in Android Chrome. Tap **Connect**, select `GATT--DEMO` and tap **Try** once. If the pattern is uncomfortable, tap **Return to solid red** to send the solid-red command.
3. Observe the entire strip for at least 30 seconds after the second write. Compare the same fixed points at 0, 10, 20 and 30 seconds. Record each region's color, movement or brightness pulsing, and whether a region went dark. Open the log to see write status and exact bytes. If the pattern looks stationary, keep watching for another 30–90 seconds to catch slow motion. Video can show both ends against fixed reference points.
4. Tap **Return to solid red** and verify solid red. If disconnected, reconnect before restoring. Tap **Disconnect** when finished. If you notice a changed effect speed later, choose your usual setting in the controller app. The previous speed is unknown to Violet Wire.

Stationary test passes only if distinct physical colors appear simultaneously and their positions and appearance hold for at least 30 seconds with no further writes. Slow or alternating animation, a single color, and a colored prefix plus a dark tail do not meet that criterion. A stationary preset would establish a constrained renderer behavior. Independent addressing still requires evidence that changing one requested region leaves the other unchanged.

## If the effect does not hold

Capture a short session on the owner's Android device while using the already-installed MR Star or Elkotrol with this strip. Record the installed package and version and timestamps for connect, selecting a visibly two-color preset, moving its speed control to minimum, 30 seconds idle, and returning to a known solid color. Use Android Bluetooth HCI snoop logging only for that session, with unrelated Bluetooth devices disconnected. Restart Bluetooth as Android directs after enabling logging, then disable logging when done. Keep full logs and bug reports local.

In Wireshark, identify the target connection and map the `FFF3` UUID to its actual ATT characteristic value handle in that connection. Inspect write request (`0x12`) and write command (`0x52`) rows at that handle and compare time, payload and physical behavior. Optional `FFF4` notifications can be retained separately. Share or commit only the relevant redacted byte rows and observations. If the pattern keeps moving during the idle window with no further color writes, that supports a firmware-driven renderer. If an app actually exposes a custom spatial control, capture a controlled comparison that changes only one region or pixel. No unknown payload should be replayed just because it appears in the trace. [Android Bluetooth debugging](https://source.android.com/docs/core/connect/bluetooth/verifying_debugging) · [Wireshark ATT fields](https://www.wireshark.org/docs/dfref/b/btatt.html)
