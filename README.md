# DOOM Fire Pixel Art Effect

A recreation of the classic **Doom PSX Fire Effect** (originally documented by Fabien Sanglard) implemented in HTML5 Canvas and vanilla JavaScript.

## Features
- **Accurate Fire Simulation**: Uses the original bottom-up probabilistic propagation and decay algorithm with 1D index mapping and horizontal wind wrapping.
- **Pixel Art Aesthetics**: Variable native resolution (`40×30`, `80×60`, `160×120`, `280×210`) scaled up with `image-rendering: pixelated` for crisp retro pixels.
- **High Performance**: Direct 32-bit pixel buffer manipulation (`ImageData.data.buffer` via `Uint32Array`) running smoothly at up to 120 ticks/sec.
- **Mouse-Hover Physical Barrier**: Hovering over the canvas acts as a physical barrier that blocks rising flames, deflects heat around its edges, stops embers, and casts a wind-dependent shadow stopping fire downwind above the cursor.
- **Interactive Painting**: Drag on the canvas to ignite fire, or right-click / Shift+drag to extinguish it, with adjustable brush size.
- **Interactive Controls**:
  - **Ignite / Kill Fire (`K`)**: Toggle the bottom row heat generator.
  - **Wind Effect (`←` / `↓` / `→`)**: Drift flames and barrier shadows left, center/calm, or right.
  - **Playback (`Space`)**: Pause/Resume, Step frame-by-frame, Reset, and adjust tick speed.
  - **Embers, Barrier (`B`), & CRT Scanlines**: Toggle rising spark embers, the hover barrier, and an optional CRT scanline overlay.
  - **Decay & Flame Height**: Adjust cooling rates.
  - **Multiple Palettes**: Classic DOOM (orange/yellow), Soulfire (cyan/blue), Toxic Acid (green), Cyberpunk (magenta), and Ashes (grayscale).
  - **Save PNG (`S`)**: Export the current frame as an 8× upscaled PNG image.

## Quick Start
Open [index.html](file:///c:/Users/User/Documents/Coding%20Projects/pixel-art/index.html) in any modern web browser or run a simple local web server.
