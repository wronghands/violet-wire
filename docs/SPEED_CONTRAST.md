# Preset 58 speed comparison and custom-color research

The owner saw red and green simultaneously with preset 58 on November 10, 2026. With speed `0`, the pattern continued at roughly 130–135 observed movements per minute. The counting unit was unspecified, so this is neither a frame rate nor directly comparable with the new boundary-crossing count. `SET_LENGTH=75` previously lit roughly half and left the tail dark. The physical strip has approximately 150 LEDs. The stored count and how the firmware darkens the tail remain unknown. [Issue #8 hardware report](https://github.com/wronghands/violet-wire/issues/8#issuecomment-6763627326)

## Track A · Compare two documented speed inputs

`mr-star-ble` encodes one speed byte in `0–100` and identifies effect 58 as red/green running water. Its source specifies no pause value. The observed run rules out speed `0` as a freeze for that test. No source reviewed documented a hold for this firmware. The related UltraLux manual shows moving half-strip patterns but gives no BLE mapping for its C7 split-wave preset. A D&KO 5 m manual identifies MR Star and `GATT--DEMO` for its own model and describes color and mode controls. These manuals do not identify the owner's firmware. [Speed encoder](https://github.com/mishamyrt/mr-star-ble/blob/main/mr_star_ble/commands.py#L38-L47) · [Preset catalog](https://github.com/mishamyrt/mr-star-ble/blob/main/mr_star_ble/const.py#L61-L69) · [UltraLux manual](https://www.ultralux.bg/downloads/upotreba/2708_LSG510USB_LSG520USB_Instruction.pdf#page=8) · [D&KO manual](https://asset.action.com/image/upload/v1757493871/Final/Documents/Quality%20Product%20Documents/3219080_UserManual_5_meter_LED_strip.pdf#page=4)

| Action | Separate `FFF3` writes, in order |
| --- | --- |
| First run at speed 0 | `BC 06 02 00 3A 55`, then `BC 08 01 00 55` |
| Second run at speed 100, same connection | `BC 08 01 64 55` |
| Optional repeat at speed 0, same connection | `BC 08 01 00 55` |
| Return to solid red | `BC 04 06 00 00 03 E8 00 00 55` |

1. Verify the full strip lights red in [v0.2.1](https://wronghands.github.io/violet-wire/). If the baseline has a dark tail, report it and leave the count alone. Disconnect v0.2.1 and any vendor app.
2. Open the [pinned speed lab](https://wronghands.github.io/violet-wire-tests/effect-58-v3/lab/) in Android Chrome and connect to `GATT--DEMO`. Pick one fixed point and one recognizable boundary, such as a red-to-green transition.
3. Select **0 Minimum** and tap **Start 30-second run**. Keep the tab visible and count the same type of boundary crossing that point. Record count and direction. Then select **100 Maximum** and repeat without disconnecting or returning to red. If the results are close, repeat speed 0 to check repeatability.
4. Report counts, directions, whether both colors remained visible, and any errors or dark sections. The log shows browser writes and exact bytes. Tap **Return to solid red**, verify it, then **Disconnect**. The prior effect speed is unknown and may need to be set back in the vendor app.

A repeatable difference supports speed control for this preset. Similar counts leave firmware clamping, ignored inputs, preset behavior and counting variation open. Browser write completion does not establish physical behavior. Stationarity requires both colors to hold the same physical positions for at least 30 seconds. No LED count, direction or firmware settings are written by the lab.

## Track B · Independently chosen colors A and B

The reviewed compatible clients encode one global hue/saturation, one built-in effect ID, or a separate speed or direction value. `SET_LENGTH` carries a total count. None of these layouts carries a region address or two colors. Global `BC 04` is used to return from effect mode to solid color. MR Star advertises built-in modes and Elkotrol lists `GATT--DEMO` and pattern selection. An older Elkotrol developer reply limits its custom patterns to LED-DMX, without identifying the firmware in this strip. No target-version APK source or target HCI capture was available. Independent custom palette or segment writes remain unverified. [Findn protocol](https://github.com/hirotasoshu/ha-findn-led-ble/blob/main/custom_components/findn_led_ble/device_protocol.py) · [GlowBridge mode handling](https://github.com/ronnygeo/GlowBridge/blob/main/docs/PROTOCOL.md#L95-L120) · [MR Star listing](https://play.google.com/store/apps/details?id=com.frok.mrstar) · [Elkotrol listing](https://play.google.com/store/apps/details?hl=en-GB&id=com.leet.elkotrol)

A public `com.frok.mrstar` APK analysis on a related corner lamp reports the same `FFF0`/`FFF3`/`FFF4` layout and independently corroborates speed `0–100`. Its table includes whole-strip color temperature and additional animated families, but provides no pause or palette-slot packet. This is evidence for the analysed app and lamp. The direction polarity differs from GlowBridge's table, so neither direction mapping is assumed here. [APK-analysis command table](https://github.com/labsensacional/mrstar-ble-light/blob/main/docs/ble_reverse_engineering.md#6-command-table)

The next evidence is a passive capture from the owner's installed MR Star or Elkotrol. Record the app package, version, selected preset and actual control labels. Capture minimum and maximum speed as separate actions. Use Pause or DIY only if the app offers it for this device. If there is a palette or segment editor, change one color with the other held fixed, then repeat with the other color changed. Compare physical output and target `FFF3` writes. Record `FFF4` notifications separately. Keep the full phone trace local and share only redacted target frames and timestamps. [Android HCI guide](https://source.android.com/docs/core/connect/bluetooth/verifying_debugging) · [Capture workflow](STATIONARY_COLORS.md#if-the-effect-does-not-hold)

The goal remains approximately 75 LEDs in each chosen color, simultaneously still for at least 30 seconds. Independent addressing requires changing one side while the other remains fixed.
