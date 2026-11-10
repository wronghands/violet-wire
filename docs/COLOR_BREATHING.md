# Color Breathing prototype

[Open the pinned English HTTPS build](https://wronghands.github.io/violet-wire-tests/color-breathing-v1/lab/). The stable controller and earlier experiment URLs have their own deployment paths. Static-zone work is paused while this whole-strip effect is tested.

## On the strip

1. Power the strip and disconnect any other app controlling it. Open the prototype directly in Android Chrome. Tap **Connect** and select `GATT--DEMO`.
2. Start with violet `#8029C9`, red `#D3214F`, an 18-second cycle, 55% brightness limit, and **Gentle breathing** on. Tap **Start** and watch a full A → B → A cycle. Check for both target colors, visible steps or stalls, and whether the dimmest point stays lit.
3. Tap **Stop** and check that the strip stops changing after the current write settles. Turn breathing off and start again to compare. Switch apps while running and check that updates stop. Returning to Chrome requires an explicit **Start**.
4. If movement looks too coarse, try a longer cycle, such as 30–45 seconds, and report which duration looks best. Disconnect when finished.

## Frames and pacing

The browser generates cosine-eased RGB samples, then uses the stable app's RGB-to-HSV conversion. HEX contributes hue, saturation and relative brightness. The brightness slider caps the requested level. Gentle breathing applies up to 22% additional dimming during each transition, with a floor of 120 on the 0–1000 brightness scale. The floor also applies to very dark HEX colors. Disabling breathing removes that extra pulse while preserving differences due to the selected colors. Physical brightness and color fidelity remain to be observed.

| Purpose | Separate write to `FFF3` |
| --- | --- |
| Whole-strip color | `BC 04 06 <hue:u16 BE> <saturation:u16 BE> 00 00 55` |
| Whole-strip brightness | `BC 05 06 <level:u16 BE> 00 00 00 00 55` |

At most one write is in flight. The scheduler waits at least 150 ms after a write settles, including across Stop and Start. It takes a fresh sample from elapsed time and never queues a missed animation frame. Changes are sent as paced slots permit. An unchanged value is refreshed after about 1.5 seconds to help recover from silent drops. Three consecutive reported failures for either command type stop the effect. Browser write completion is separate from physical application.

Stop, disconnect, and backgrounding cancel future writes. An in-flight packet may complete. The lab sends no final color or power frame, so the strip stays at its last applied state. Stop does not turn the strip off. There are no effect, speed, length, zone, or firmware commands. The display may visibly step at the conservative write cadence. Both fade quality and the nonzero physical trough need hardware verification.
