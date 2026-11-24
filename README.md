# devaware-os

A KDE Plasma 6 / Kubuntu-inspired interactive web desktop for Australia-wide property development mini-apps, connected over a hardened, typed cross-app `postMessage` bridge (`@devaware/os-bridge`).

## Architecture

- **Desktop Shell & Window Manager (`React + TypeScript + Tailwind CSS + Zustand + react-rnd`)**
  - Lock screen with dark Australian topographic relief wallpaper, live Australian clock & timezone abbreviation, GDA2020 status pill, and `?unlocked=1` auto-skip support.
  - Floating, resizable windows with **Snap Left / Snap Right**, **Source Repo** links, **Iframe Drag Shield** (`pointer-events: none` during active drag/resize), and **Unfocused Click-Catcher** overlays.
  - Responsive `<768px` full-screen tabbed mobile app switcher.
  - Versioned workspace persistence (`schemaVersion: 1`) with **Reset Workspace** in the App Launcher.
- **Locked Australia-Wide Schema (`src/bridge/types.ts`)**
  - `SiteProject` contract supporting all 8 states & territories (`NSW`, `VIC`, `QLD`, `WA`, `SA`, `TAS`, `ACT`, `NT`), metric units (`m²`, `ha`, `m³`, `AUD`), and automatic `getMga2020FromLng(lng)` GDA2020 MGA2020 zone resolution (Zones 49–56 / `EPSG:7849`–`EPSG:7856`).
- **Hardened `@devaware/os-bridge` Host (`src/bridge/osMessageRouter.ts`)**
  - Strict origin allowlist (`window.location.origin`, registered production origins, `http://localhost:*` in dev, optional `VITE_ALLOWED_ORIGIN_REGEX`). Rejected origins are logged visibly in **Project Inspector**.
  - Typed handshake (`APP_READY` → `OS_INIT`, `APP_FOCUS`, `OPEN_APP`, 200ms debounced `PROJECT_PATCH` → `OS_PROJECT_SYNC`, `NOTIFY`, `OS_RENDER_STATE`).
  - Single-instance enforcement for heavy WebGL/3D apps (`cutsheet-au`, `formgen-au`, `enviro-sim-au`) with automatic `OS_RENDER_STATE` pausing on blur/minimize.

## Registered Apps

| App ID | Name | Category | Status / Entry URL |
| :--- | :--- | :--- | :--- |
| `cutsheet-au` | CutSheet AU | Terrain & Civil | Live (`VITE_CUTSHEET_URL` or `/mock-apps/cutsheet.html`) |
| `feaso-os` | Feaso OS | Feasibility | Live (`VITE_FEASO_URL` or `/mock-apps/feaso.html`) |
| `formgen-au` | FormGen AU | Massing & Yield | Live when `VITE_FORMGEN_URL` is set, else Coming Soon Spec |
| `enviro-sim-au` | EnviroSim AU | Environment & Risk | Live when `VITE_ENVIRO_URL` is set, else Coming Soon Spec |
| `file-explorer` | Projects (AU) | System | Built-in React |
| `project-inspector` | Project Inspector | System | Built-in React |

## Verification & Scripts

```bash
npm run dev        # Local Vite dev server
npm run typecheck  # Strict TypeScript checking
npm run test       # Vitest unit test suite
npm run build      # Production Vite bundle
npm run test:e2e   # Playwright headless Chromium E2E tests (desktop + mobile)
```
