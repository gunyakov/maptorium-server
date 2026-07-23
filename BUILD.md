# Building Maptorium

Maptorium ships as an Electron desktop app assembled from two repositories:

- [`maptorium-server`](https://github.com/gunyakov/maptorium-server) — the HTTP/Socket.IO API server and Electron main process.
- [`maptorium-ui`](https://github.com/gunyakov/maptorium-ui) — the Vue/Quasar frontend.

The UI build writes its output straight into `maptorium-server/public_html` (see `distDir` in `maptorium-ui/quasar.config.ts`), so **both repositories must be cloned as sibling folders inside the same parent directory**:

```
Maptorium/
├── maptorium-server/
└── maptorium-ui/
```

## Prerequisites

- Node.js 20 or newer (LTS recommended)
- Git
- System build tools for native modules (`better-sqlite3`, `sharp`, `serialport`):
  - **Windows**: Visual Studio Build Tools (workload "Desktop development with C++"), Python 3
  - **Linux (Debian/Ubuntu)**: `build-essential`, `python3`, `pkg-config`, `libsqlite3-dev`, `libudev-dev`, `libvips-dev`

## Clone

```
mkdir Maptorium && cd Maptorium
git clone https://github.com/gunyakov/maptorium-server.git
git clone https://github.com/gunyakov/maptorium-ui.git
```

## Install dependencies

```
cd maptorium-server
npm install

cd ../maptorium-ui
npm install
```

`npm install` in `maptorium-server` also triggers `postinstall` → `npm run rebuild`, which compiles native modules for Electron via `electron-builder install-app-deps`.

---

## Building for Windows

Run everything below from a Windows machine (PowerShell).

### 1. Build the UI

```powershell
cd Maptorium\maptorium-ui
npx quasar build
```

Compiles the Vue/Quasar frontend and writes it into `Maptorium\maptorium-server\public_html`. Repeat this step whenever you change anything under `maptorium-ui\src`.

### 2. Build the server

```powershell
cd Maptorium\maptorium-server
npm run build
```

Runs `rm -rf server-build && tsc -p .`, compiling `main.ts`, `server.ts`, `routes/`, etc. into `server-build\`. Repeat this step whenever you change anything under `maptorium-server` (`.ts` files).

### 3. Package the Windows installer

```powershell
cd Maptorium\maptorium-server
$env:CSC_IDENTITY_AUTO_DISCOVERY = "false"
npx electron-builder --win nsis
```

- `CSC_IDENTITY_AUTO_DISCOVERY=false` stops electron-builder from trying to auto-discover a macOS signing identity (not relevant on Windows, but avoids noise/errors).
- This also re-runs `@electron/rebuild` first, to recompile native modules (`better-sqlite3`, `serialport`) against the packaged Electron version.
- Output: `dist\win-unpacked\` (unpacked app, runnable directly) and `dist\Maptorium-Setup-<version>.exe` (the installer), plus a `.blockmap` file.

There's also `build-win.ps1` in the project root that wraps step 3 alone (sets the env var, tees output to `dist-win-build.log`) — it assumes `server-build` and `public_html` are already up to date, so run steps 1 and 2 first if you've made changes.

### 4. Verify the build (recommended)

A corrupted `app.asar` fails silently — Electron just exits with no window, no error, no log — so it's worth checking before installing:

```powershell
cd Maptorium\maptorium-server
.\node_modules\.bin\asar extract dist\win-unpacked\resources\app.asar asar-check
type asar-check\package.json   # should print readable JSON, not binary garbage
Remove-Item -Recurse -Force asar-check
```

Or just run the unpacked build directly — if a window opens and stays open, the build is good:

```powershell
Start-Process "Maptorium\maptorium-server\dist\win-unpacked\Maptorium.exe"
```

### 5. Install

Uninstall any existing version first (Settings → Apps, or the installed `Uninstall Maptorium.exe`), then run `dist\Maptorium-Setup-<version>.exe`.

**Quick reference — full rebuild in one go:**

```powershell
cd Maptorium\maptorium-ui
npx quasar build

cd Maptorium\maptorium-server
npm run build
$env:CSC_IDENTITY_AUTO_DISCOVERY = "false"
npx electron-builder --win nsis
```

---

## Building for Linux

Run everything below from a Linux machine (bash).

### 1. Build the UI

```bash
cd Maptorium/maptorium-ui
npx quasar build
```

Same as the Windows step — writes the frontend into `Maptorium/maptorium-server/public_html`.

### 2. Build the server

```bash
cd Maptorium/maptorium-server
npm run build
```

Compiles TypeScript into `server-build/`.

### 3. Package the AppImage

```bash
cd Maptorium/maptorium-server
npm run dist:linux
```

This runs `electron-builder --linux AppImage --x64`, which also re-runs `@electron/rebuild` to recompile native modules for the packaged Electron version. Output: `dist/Maptorium-<version>.AppImage`.

### 4. Verify the build (recommended)

```bash
cd Maptorium/maptorium-server
node_modules/.bin/asar extract dist/linux-unpacked/resources/app.asar asar-check
head -c 200 asar-check/package.json   # should print readable JSON
rm -rf asar-check
```

### 5. Run / install

AppImages are portable — no installer is required, just make the file executable and run it:

```bash
chmod +x dist/Maptorium-<version>.AppImage
./dist/Maptorium-<version>.AppImage
```

On newer distros (Ubuntu 22.04+, Fedora, etc.) you may need `libfuse2` for AppImages to run:

```bash
sudo apt install libfuse2   # Debian/Ubuntu
```

Without `libfuse2` you can still run it directly, extracting on the fly:

```bash
./dist/Maptorium-<version>.AppImage --appimage-extract-and-run
```

For desktop integration (menu entry, icon), use a tool like [AppImageLauncher](https://github.com/TheAssassin/AppImageLauncher) or [Gear Lever](https://github.com/mijorus/gearlever) — this is optional and not required to run the app.

**Quick reference — full rebuild in one go:**

```bash
cd Maptorium/maptorium-ui
npx quasar build

cd Maptorium/maptorium-server
npm run build
npm run dist:linux
```
