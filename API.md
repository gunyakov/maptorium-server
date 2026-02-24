### API Version 4.0.0

HTTP API to make your own UI. Version according to maptorium-server 1.0.0. Subject to change in future according needs.

#### Description

All requests return a JSON object with the following shape:

```
{
    result: "success" | "info" | "warning" | "error",
    message?: string,
    data?: any
}
```

`result` — `success`/`info` generally means the request completed without errors. `warning`/`error` indicate issues (warnings for non-critical cases like empty results, errors for validation/DB failures).

`message` — human-readable message or localization key. `data` — payload for the request when applicable.

#### Core

`http://[server:port]/core/[path]`

| PATH           | Method | Params                                         | Return                                    | Description                                                                               |
| -------------- | ------ | ---------------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------- |
| `/default`     | `get`  | none                                           | `DefaultConfig`                           | Return current `config/config.user.json` contents                                         |
| `/default`     | `post` | Partial `DefaultConfig`                        | none                                      | Update default config. Some keys trigger additional actions (e.g. `gpsServer`, `apiKeys`) |
| `/updates`     | `get`  | none                                           | object                                    | Return server statistics and status (memory, queue, downloads, etc.)                      |
| `/maps`        | `get`  | none                                           | Array<[MapInfo](./INTERFACES.md#mapinfo)> | Return list of available map handlers and their info                                      |
| `/map-storage` | `post` | `mapID`, `path`                                | none                                      | Set storage path for a map handler (must be an existing directory)                        |
| `/mode`        | `post` | `mode`: [DownloadMode](./ENUM.md#downloadmode) | none                                      | Set global download/network mode (`enable`/`disable`/`force`)                             |

#### Filesystem (Dialog)

`http://[server:port]/fs/[path]`

| PATH       | Method | Params            | Return                  | Description                               |
| ---------- | ------ | ----------------- | ----------------------- | ----------------------------------------- |
| `/current` | `get`  | none              | `{ path: string }`      | Return current server working directory   |
| `/list`    | `post` | `path`            | Array<{name,path,type}> | List files/folders in specified directory |
| `/create`  | `post` | `path`, `name`    | `{ path }`              | Create folder inside `path` with `name`   |
| `/rename`  | `post` | `path`, `newName` | `{ path }`              | Rename file or folder                     |

#### GPS

`http://[server:port]/gps/[path]`

| PATH              | Method | Params        | Return                                        | Description                                      |
| ----------------- | ------ | ------------- | --------------------------------------------- | ------------------------------------------------ |
| `/now`            | `get`  | none          | [GPSCoords](./INTERFACES.md#gpscoords)        | Return current GPS position (lat, lng, dir)      |
| `/point`          | `get`  | none          | [GPSCoords](./INTERFACES.md#gpscoords)        | Return last route point stored in DB             |
| `/route/:routeID` | `get`  | none          | Array<[GPSCoords](./INTERFACES.md#gpscoords)> | Return route points (use `0` for current route)  |
| `/stoprecord`     | `get`  | none          | none                                          | Disable recording route points to DB             |
| `/startrecord`    | `get`  | none          | none                                          | Enable recording route points to DB              |
| `/routenew`       | `post` | `name:string` | none                                          | Create and start a new route                     |
| `/routelist`      | `get`  | none          | Array<[ROUTE](./INTERFACES.md#route)>         | Return list of recorded routes                   |
| `/sample`         | `post` | `time:number` | none/info                                     | Set GPS sample rate (in seconds)                 |
| `/start`          | `get`  | none          | none                                          | Start GPS service                                |
| `/stop`           | `get`  | none          | none                                          | Stop GPS service                                 |
| `/list`           | `get`  | none          | Array<object>                                 | List available serial/USB devices (added v3.1.0) |

#### Jobs (Downloader / Generator)

`http://[server:port]/job/[path]`

| PATH             | Method | Params               | Return         | Description                                            |
| ---------------- | ------ | -------------------- | -------------- | ------------------------------------------------------ |
| `/list`          | `get`  | none                 | Array<jobInfo> | Return queued and stored jobs                          |
| `/download`      | `post` | `iJobConfig` payload | none           | Add new download job (validates request before adding) |
| `/generate`      | `post` | `GenJobInfo` payload | none           | Add new generate job (create upper zooms)              |
| `/start/:jobID`  | `get`  | none                 | none           | Start job by ID                                        |
| `/stop/:jobID`   | `get`  | none                 | none           | Stop job by ID                                         |
| `/up/:jobID`     | `get`  | none                 | none           | Move job up in queue                                   |
| `/down/:jobID`   | `get`  | none                 | none           | Move job down in queue                                 |
| `/delete/:jobID` | `get`  | none                 | none           | Delete job from queue                                  |

#### Map helper endpoints

`http://[server:port]/map/[path]`

| PATH             | Method | Params                   | Return | Description                                                  |
| ---------------- | ------ | ------------------------ | ------ | ------------------------------------------------------------ |
| `/cached/poi`    | `post` | `map`, `zoom`, `polygon` | none   | Start cached map check for a polygon (build cached map info) |
| `/cached/bbox`   | `post` | `map`, `zoom`, `bbox`    | none   | Start cached map check for bbox                              |
| `/cached/cancel` | `get`  | none                     | none   | Cancel cached map building                                   |
| `/cached/clean`  | `get`  | none                     | none   | Clean cached map state                                       |

#### Styles (static)

`http://[server:port]/style/:name/:style`

| PATH            | Method | Params          | Return | Description                                                      |
| --------------- | ------ | --------------- | ------ | ---------------------------------------------------------------- |
| `/:name/:style` | `post` | `name`, `style` | file   | Serve MapLibre style JSON (reads from maptorium-maplibre/styles) |

#### Tile

`http://[server:port]/tile/[path]`

| PATH               | Method | Params                             | Return | Description                                                                                      |
| ------------------ | ------ | ---------------------------------- | ------ | ------------------------------------------------------------------------------------------------ |
| `/:mapID/:z/:x/:y` | `get`  | none                               | Blob   | Return tile image or blob according map handler (supports tile checks, DB cache, download modes) |
| `/`                | `get`  | query `map`, `z`, `x`, `y`, `mode` | Blob   | Tile as query parameters (`mode` can be `enable`/`disable`/`force`)                              |

#### POI

`http://[server:port]/poi/[path]`

| PATH                    | Method | Params                                            | Return                                            | Description                          |
| ----------------------- | ------ | ------------------------------------------------- | ------------------------------------------------- | ------------------------------------ |
| `/`                     | `get`  | none                                              | GeoJSON FeatureCollection                         | Return all visible POIs in DB        |
| `/list/:categoryID`     | `get`  | none                                              | GeoJSON FeatureCollection                         | Return POIs for specified category   |
| `/info/:poiID`          | `get`  | none                                              | GeoJSON Feature                                   | Return single POI by ID              |
| `/add`                  | `post` | [POIInfo](./INTERFACES.md#poiinfo)                | `{ ID:number }`                                   | Add POI to DB and return inserted ID |
| `/addMark`              | `post` | mark properties (name, categoryID, lat, lng, ...) | `{ ID:number }`                                   | Add a simple mark and return ID      |
| `/delete`               | `post` | `ID:number`                                       | none                                              | Delete POI by ID                     |
| `/update`               | `post` | [POIInfo] or `{ points:Array<GPSCoords> }`        | boolean                                           | Update POI or update only points     |
| `/category`             | `get`  | none                                              | Array<[POICategory](./INTERFACES.md#poicategory)> | Return POI categories                |
| `/category/:categoryID` | `get`  | none                                              | POI category                                      | Return specific category info        |
| `/category/add`         | `post` | `name:string`, `parentID:number`                  | `{ ID:number }`                                   | Add category and return ID           |
| `/category/update`      | `post` | category object                                   | none                                              | Update category                      |
| `/category/delete`      | `post` | `ID:number`                                       | none                                              | Delete category                      |

#### GPS

`http://[server:port]/gps/[path]`

| PATH              | Method | Params      | Return                                        | Description                                                             |
| ----------------- | ------ | ----------- | --------------------------------------------- | ----------------------------------------------------------------------- |
| `/now`            | `get`  | none        | [GPSCoords](./INTERFACES.md#gpscoords)        | Return current GPS Position                                             |
| `/point`          | `get`  | none        | [GPSCoords](./INTERFACES.md#gpscoords)        | Return last route point what was inserted in DB.                        |
| `/route/:routeID` | `get`  | none        | Array<[GPSCoords](./INTERFACES.md#gpscoords)> | Return route points. If routeID set to 0 - return current route points. |
| `/stoprecord`     | `get`  | none        | none                                          | Disable route points record to DB.                                      |
| `/startrecord`    | `get`  | none        | none                                          | Enable route points record to DB.                                       |
| `/routenew`       | `post` | name:string | none                                          | Start new route                                                         |
| `/routelist`      | `get`  | none        | Array<[ROUTE](./INTERFACES.md#route)>         | Return Array what contain previous routes information.                  |

#### Tile

`http://[server:port]/tile/[path]`

| PATH                                         | Method | Params | Return | Description                                  |
| -------------------------------------------- | ------ | ------ | ------ | -------------------------------------------- |
| `/{mapID}/{z}/{x}/{y}.{format}`              | `get`  | none   | Blob   | Return image or blob file according map type |
| `/?map={mapID}&z={z}&x={x}&={y}&mode={mode}` | `get`  | none   | Blob   | Return image or blob file according map type |

#### POI

`http://[server:port]/poi/[path]`

| PATH                | Method | Params                                                                                         | Return                                            | Description                                                                                  |
| ------------------- | ------ | ---------------------------------------------------------------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `/`                 | `get`  | none                                                                                           | GeoJSON `FeatureCollection`                       | Return all visible POIs in DB as GeoJSON FeatureCollection                                   |
| `/list/:categoryID` | `get`  | none                                                                                           | GeoJSON `FeatureCollection`                       | Return POIs from specified category as GeoJSON FeatureCollection                             |
| `/info/:poiID`      | `get`  | none                                                                                           | GeoJSON `Feature`                                 | Return POI by poiID in GeoJSON Feature format                                                |
| `/add`              | `post` | [POIInfo](./INTERFACES.md#poiinfo)                                                             | ID:number                                         | Add POI to database and return inserted POI ID                                               |
| `/delete`           | `post` | ID:number                                                                                      | none                                              | Delete POI from DB                                                                           |
| `/update`           | `post` | [POIInfo](./INTERFACES.md#poiinfo) or <br>points:Array<[GPSCoords](./INTERFACES.md#gpscoords)> | boolean                                           | Update POI in DB. Possible to send only `points` to update GPS coords instead of properties. |
| `/category`         | `get`  | none                                                                                           | Array<[POICategory](./INTERFACES.md#poicategory)> | Return Array contain POI categories                                                          |
| `/category/add`     | `post` | name:string <br> parentID:number                                                               | none                                              | Add new POI category to DB                                                                   |
