# Violet Wire

A lightweight, static **Web Bluetooth controller for RGB pixel-neon strips**, designed for Android Chrome. Connect to the existing `GATT--DEMO` controller without the vendor app, choose custom colors, adjust brightness, and save favorites locally.

**Live app:** https://wronghands.github.io/violet-wire/

**Current stable UI:** v0.2.1. The experimental v0.3.0 length-control interface was rolled back after user feedback; it is **not** an available or verified two-zone feature. From the next product release onward, all user-facing interface copy will be **English only**.

## Getting started

1. Power the strip via USB and turn on Bluetooth on your Android phone. Disconnect MR Star, Elkotrol, or nRF Connect if they are currently connected to the controller.
2. Open the [Violet Wire HTTPS app](https://wronghands.github.io/violet-wire/) directly in **Android Chrome**.
3. Tap **Connect** (currently labeled **Bağlan** in v0.2.1), select `GATT--DEMO`, and grant nearby-device permission if prompted.
4. Try a preset, use the inline color editor or enter a `#RRGGBB` value, then press **Apply Color** (currently **Rengi uygula**) to send it to the strip.

The current published UI is still Turkish; the English-only requirement applies to the next Work-built release.

## Features

- **Direct custom-color editor:** an in-page hue slider and saturation/value surface, with accessible sliders and a synchronized six-digit HEX input. There is no Android native eight-swatch intermediate picker.
- **Precise brightness:** custom colors are converted to hue, saturation, and brightness commands. For example, `#804020` requests approximately **50.2%** brightness. `#000000` requests zero brightness without sending a separate power-off command.
- **Up to 12 favorites:** saved in this browser's local storage, with in-session fallback if storage is unavailable.
- **Explicit transmission:** editing a color, choosing a favorite, or reconnecting never automatically writes a color command. Apply sends the color and brightness frames sequentially.
- **Existing controls:** six solid-color presets, power controls, a separate manual brightness slider, and a collapsible diagnostic tool for explicitly sending a single validated `BC … 55` frame.

The web app does not request location, microphone, or music access. Bluetooth discovery may require Chrome and Android system permissions. A browser write completing successfully does not, by itself, confirm the physical LED output.

## Physical-device verification

User-reported observations from **November 10, 2026**:

- The v0.1.0 connection, presets, and brightness worked on the actual strip; brightness control felt more precise than the vendor app.
- Custom HEX colors, favorites, and brightness also worked in the v0.2.x releases. The user produced colors they had not previously seen on this strip.
- The v0.2.1 hue editor occasionally fails to update on the first attempt and works after retrying (**known low-priority issue**).
- The strip has **approximately 150 LEDs** based on manual inspection; the precise original firmware-configured pixel count is unknown.
- In the rolled-back experimental v0.3.0 `SET_LENGTH` trial, approximately **half the strip lit in the selected color while the other half stayed dark**. This indicates length limiting affects the output, **not** that independent stationary color zones work.

These are user observations, not instrumented LED measurements. Two simultaneous independently chosen **stationary** colors remain an open research goal. Built-in multicolor animations demonstrate that the controller can render multiple colors, but do not establish that its BLE protocol exposes individual pixel or zone addressing.

**Active research and Work implementation brief:** [Issue #8](https://github.com/wronghands/violet-wire/issues/8). Do not reintroduce the rejected v0.3.0 interface or present the unproven `SET_LENGTH` approach as a working two-color mode.

## Development and QA

The GitHub repository is the canonical source. GitHub Pages serves static files from the `main` branch; there is no backend, compilation step, or runtime CDN dependency.

Run the automated tests with Node.js:

```sh
npm test
```

Tests cover command encoding, RGB/HSV conversion, favorites, and mocked Bluetooth behavior. Physical strip behavior and Android touch interactions still require device testing. Small releases should be developed in a branch, tested, reviewed for mobile usability, and then deployed through GitHub Pages.

For technical details, see [Protocol notes](docs/PROTOCOL.md), [QA checklist](docs/QA.md), and [Project checkpoint](docs/CHECKPOINT.md). Some older technical documents still contain Turkish and superseded release-gate instructions; Work should migrate and update them as part of the upcoming English-only release.
