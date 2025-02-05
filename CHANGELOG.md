# maptorium-server Changelog

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
