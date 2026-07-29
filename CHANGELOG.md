# maptorium-server Changelog

## 4.2.0 (2026-7-29)

### ✨ Features

- Added the Pro mode "User Styles" API (`routes/userStyles.ts`, `src/userStyles.ts`): list/get/save/delete named snapshots of the current map style, so a customized map look can be saved and reapplied later from the UI's new Pro menu.

### 🔧 Workflow

- Merged the POI database into a single shared `app.db` (`src/appDatabase.ts`), migrating the legacy `POI.db3` file in place on first run. Features that used to need their own DB file (like the new saved styles) just get a new table here instead.

## 4.1.2 (2026-07-23)

### 🔧 Bugs

- Fixed the filesystem browser (`routes/fs.ts`) used by the map storage-folder picker on Windows: listing the tree root now returns the available drives (`C:\`, `D:\`, ...) instead of resolving to the wrong location, and client-supplied paths are now validated as proper absolute paths instead of being silently reinterpreted relative to the server's working directory. This fixes "Unable to read folder" errors when browsing any folder on Windows.
- Removed the temporary diagnostic logging in `main.ts` that was added to track down a silent packaged-app startup crash. Root cause turned out to be a corrupted `app.asar` produced by a bad build (not an application bug); a clean rebuild resolved it, so the logging (and its hardcoded dev-machine log path) is no longer needed.

### 📝 Docs

- Added `BUILD.md` with full step-by-step build instructions for Windows and Linux, including the requirement to clone `maptorium-server` and `maptorium-ui` as sibling folders.
- Cleaned up `README.md`: removed the outdated Installation, precompiled-code, and prebuilt-release sections (which pointed at old v3.0.0/v4.0.0 tags) and linked out to `BUILD.md` and the GitHub Releases page instead.

## 3.2.2 (2025-07-28)

### 🔧 Bugs

- Recover bug during adding download job

## 3.2.0 (2025-02-05)

### 🔧 Workflow

- Adding GPS HTTP FOS Bridge 5.03 Support
- Change GPS service flow function to ensure smoth GPS update
- Update some dependency

### 🔧 Bugs

- GPS wrong sample time setting

## 3.1.0 (2024-11-10)

### 🔧 Workflow

- Adding support for USB/Serial GPS
- GPS Core code optimization
- Migrate from sqlite3 to better-sqlite3 module for better DB performance

## 3.0.0 (2024-05-13)

### 🔧 Bugs

- TileList now get tile size from map config instead of 256px standart size
- NMEA Socket Client was transferred to main code, package removed becouse package was abandomed. Implement disconect function, what was missed.

### 🔧 Workflow

- Complete NEW UI with themes support
- UI now write with Vue
- Add MapBox RGB Terraine Map
- UI Changed from Leaflet to MapBox
- Support for Vector maps
- Support for 3D Vector maps
- Now sql statements prepared for SQLITE3.run requests to speed up writing process
- GPS service start automaticaly, if was run before
- API changing for download job

## 2.0.1 (2023-08-29)

### 🔧 Workflow

- GPS start/stop support from UI

## 2.0.0 (2023-08-28)

### 🔧 Workflow

- Convert from JS Common to TypeScript
- Rewrite from 0 half of server code to simplify and make code more readable
- Server [API description](./API.md)
- Very advanced download manager to control all your downloads in any way you like.
- Tile storage now doesnt create empty DB intil first tile insert. Prevent creating a lot of empty DB during checkings and offline map viewing.

## 0.9.7 (2023-06-03)

### 🔧 Workflow

- Split project into 3 parts: [server](https://github.com/gunyakov/maptorium-server), [ui-core](https://github.com/gunyakov/maptorium-ui) and html [UI](https://github.com/gunyakov/maptorium-leaflet) based on [Leaflet](https://github.com/Leaflet/leaflet)
