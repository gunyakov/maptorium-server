# maptorium-server

[Join Telegram Groupe to contribute or ask questions](https://t.me/maptorium)

Not all features tested in real life. Thats why as much people contribute to testing, as fast I will make stable release.

### Description

This is HTTP + Socket.IO API server what can do next:

1. Make any tiles cache to use such cache offline.
    - Rasted tiles support (JPEG/PNG).
    - Vector tiles support (MapBox, ArcGis[^1]).
    - Any other types what can be rendered by UI.
    - Cache DB is fully compatible with [SAS Planet](https://sasgis.org) sqlite storage.
2. Records GPS routes from different sources.
    - Custom GPS HTML server[^3].
    - TCP NMEA Server.
    - USB/COM NMEA devices[^4].
3. Store POI (polyline, polygon, point) in DB.
4. Make mass tiles downloads with reach options.
    - HTTP/HTTPS/Socks support
    - TOR support including New ID getting.
    - Different options to check tile age, state and so one.
5. Generate from downloaded tiles upper zoom levels.
6. Generate cached map info (info about missed/downloaded/empty tiles) for selected area.
7. Next maps support from box:
    - ArcGis Elevation (rasted)
    - ArcGis Satelite (rasted)
    - ArcGis Vector as hybrid overlay (vector)[^1]
    - Google Satelite (rasted)
    - Google Hybrid Ru version (rasted)
    - Google Hybrid Eng version (rasted)
    - MapBox as Hybrid overlay (vector)[^2]
    - MapBox Terraine (rasted)
    - OSM (rasted)
    - OSM Marine as overlay.
    - Yandex Satelite (rasted)
    - Yandex Hybrid (rasted)
    - Any other maps what you can imagine and add.

This is a part of Maptorium project. Must work with
Maptorium HTML UI to have all this features avaliable.

### Installation

#### Linux / Windows users

You must have NodeJS 16 version minimum installed in system to run this server.

```
git clone https://github.com/gunyakov/maptorium-server.git

cd maptorium-server

npm install

npm run prepare

npm run start
```

<details>

<summary>SQLite3 module compilation error</summary>

If you have any problems during SQLite3 module compilation, run next command

```
npm install https://github.com/mapbox/node-sqlite3/tarball/master
```

</details>

#### UI Installation

If you run `npm run prepare` before, you already have Leaflet UI installed and ready to use. But you can select another UI in list and install it manualy. Installation same as static folder for Express.

| Engine | Link | Descirption |
| - | - | - |
| Leaflet | [Download](https://github.com/gunyakov/maptorium-leaflet) | Based on Leaflet engine. 2D map. very close to [SAS Planet](https://sasgis.org) |
| Cesium  | [Download](https://github.com/gunyakov/maptorium-cesium) | Based on Cesium engine. 3D map, very close to Google Earth[^5]. |

You can write your own UI using server [API](./API.md) to get data and tiles.

#### Windows users

Available v1.0.0-beta-win-x64 portable version with Lealfet UI for Windows users. You can download it [here](https://github.com/gunyakov/maptorium-server/releases/tag/1.0.0)

## To Do

- [ ] COM Nmea devices support for Win and Linux
- [ ] POI Categories Support
- [ ] Ability to set all server config from UI
- [ ] Multi language support

[^1]: Server can download tiles but Leaflet UI still cant render ArcGis vector tiles as I cant find proper library for this map type to be compatible with last Leaflet release.

[^2]: Possible to use as main map and not like overlay. But proper style must be connected to Leaflet UI. May be I will implement this in future release.

[^3]: You must change code to get properly data from such server. Open file `gps/gps_core.ts`, find `getGPSCoords()` function and implement there your logic.

[^4]: Not yet tested as i have no such device.

[^5]: Limited functionality as I still didn`t finish this part.
