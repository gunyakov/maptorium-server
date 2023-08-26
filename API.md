### API Version 1.0.0

HTTP API to make your own UI. Version according maptoruim-server 1.0.0. Subject to change in future according needs.

#### Description

All requests return JSON object with next interface:

```
{
    result<string>: "success"|"info"|"warning"|"error",
    message<string>: "[Code exucution result description]",
    data<any>: [Data according request can be there]
}
```
`result` - Success and Info state consider as true state (mean code finish execution without errors). Warning and Error state consider false state (mean code finish execution with some errors. Warning used commonly in cases if search data is empty or non critical errors. Error state is used in problems with input data verification, DB write/read errors and so one).

`message` - contain description of code execution result. In case of success state can be empty or missed in return json. Maptorium UI show this text in pop up windows usialy.

`data` - contain data, what returned by script. Missed in all `error`|`warning` cases and can be empty in case `success`|`info` script execution isnt return any data. 

#### Core

`http://[server:port]/core/[path]`

| PATH | Method | Params | Return | Description |
|-|-|-|-|-|
| `/default` | `get` | none | <DefaultConfig>| Return content of config/config.user.json |
| `/default` | `post` | | | Save new default config to server |
| `/updates` | `get` | none | | Return changes on server from last update request|
| `/maps` | `get` | none | Array<[MapInfo](./INTERFACES.md#mapinfo)> | Return Array what contain maps info available on server |
| `/mode` | `post` | mode: [DownloadMode](./ENUM.md#downloadmode) | none | Set download mode. <br>"enable" - get tiles from internet if missed in DB.<br>"disable" - prohibit any internet activity.<br>"force" - get tiles from internet even they are present in DB.|

#### GPS

`http://[server:port]/gps/[path]`

| PATH | Method | Params | Return | Description |
|-|-|-|-|-|
| `/now` | `get` | none | [GPSCoords](./INTERFACES.md#gpscoords) | Return current GPS Position |
| `/point` | `get` | none | [GPSCoords](./INTERFACES.md#gpscoords) | Return last route point what was inserted in DB. |
| `/route/:routeID` | `get` | none | Array<[GPSCoords](./INTERFACES.md#gpscoords)> | Return route points. If routeID set to 0 - return current route points. |
| `/stoprecord` | `get` | none | none | Disable route points record to DB. |
| `/startrecord` | `get` | none | none | Enable route points record to DB. |
| `/routenew` | `post` | name:string | none | Start new route |
| `/routelist` | `get` | none | Array<[ROUTE](./INTERFACES.md#route)> | Return Array what contain previous routes information. |

#### Tile

`http://[server:port]/tile/[path]`

| PATH | Method | Params | Return | Description |
|-|-|-|-|-|
| `/{mapID}/{z}/{x}/{y}.{format}` | `get` | none | Blob | Return image or blob file according map type |
| `/?map={mapID}&z={z}&x={x}&={y}&mode={mode}` | `get` | none | Blob | Return image or blob file according map type |

#### POI

`http://[server:port]/poi/[path]`

| PATH | Method | Params | Return | Description |
|-|-|-|-|-|
| `/` | `get` | none | Array<[POIInfo](./INTERFACES.md#poiinfo)> | Return Array what contain ALL POI in DB. Can be big data ammount, use with careful |
| `/list/:categoryID` | `get` | none | Array<[POIInfo](./INTERFACES.md#poiinfo)> | Return POIs what included in specified category |
| `/info/:poiID` | `get` | none | [POIInfo](./INTERFACES.md#poiinfo) | Return all data about POI by poiID |
| `/add` | `post` | [POIInfo](./INTERFACES.md#poiinfo) | ID:number | Add POI to database and return inserted POI ID |
| `/delete` | `post` | ID:number | none | Delete POI from DB |
| `/update` | `post` | [POIInfo](./INTERFACES.md#poiinfo) or <br>points:Array<[GPSCoords](./INTERFACES.md#gpscoords)> | boolean | Update POI in DB. Possible to send only `points` to update GPS coords instead of properties. |
| `/category` | `get` | none | Array<[POICategory](./INTERFACES.md#poicategory)> | Return Array contain POI categories |
| `/category/add` | `post` | name:string <br> parentID:number | none | Add new POI category to DB |