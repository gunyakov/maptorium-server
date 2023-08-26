maptorium-server Changelog
=================

## 1.0.0 (2023-09-03)

### 🔧 Workflow
* Convert from JS Common to TypeScript
* Rewrite from 0 half of server code to simplify and make code more readable
* Server [API description](./API.md)
* Very advanced download manager to control all your downloads in any way you like.
* Tile storage now doesnt create empty DB intil first tile insert. Prevent creating a lot of empty DB during checkings and offline map viewing.

## 0.9.7 (2023-06-03)

### 🔧 Workflow
* Split project into 3 parts: [server](https://github.com/gunyakov/maptorium-server), [ui-core](https://github.com/gunyakov/maptorium-ui) and html [UI](https://github.com/gunyakov/maptorium-leaflet) based on [Leaflet](https://github.com/Leaflet/leaflet)
