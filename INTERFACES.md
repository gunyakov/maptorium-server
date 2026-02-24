## Interfaces

### DBList

```
{
    name: string,
    time: number,
    state: DBState,
    db: Database
}
```

### Tile

```
{
    x: number,
    y: number,
    s: number,
    h: number,
    d: number,
    b: ArrayBuffer,
    method: string
}
```

### TileInfo

```
{
    map: string,
    x: number,
    y: number,
    z: number,
    response: Response | boolean,
    mode?: {
        mode: DownloadMode,
        getFull: boolean
    }
}
```

### TileDownloaded

```
{
    data: string,
    byteLength: number
}
```

### GPSCoords

```
{
    lat: number,
    lng: number
}
```

Note: some endpoints (e.g. `/gps/now`) may also include `dir` in the returned object when direction is available from GPS source.

### POIInfo

```
{
    ID: number,
    categoryID: number,
    name:string,
    type: POIType,
    color: string,
    width: number,
    fillColor:string,
    fillOpacity: number,
    points: Array<GPSCoords>,
    visible: number
}
```

### POICategory

```
{
    ID: number,
    name: string,
    parentID: number,
    order: number
}
```

### ROUTE

```
{
    ID: number,
    name: string
}
```

### MapInfo

```
{
    id: string,
    type: string,
    name: string,
    submenu: string,
    tileSize: number,
    attribution: string,
    content: string,
    format: string
}
```

Note: actual `MapInfo` objects may include additional optional fields used by handlers: `encoding` ("gzip"|"none"), `apiKey`, `headers`, and `storagePath`.

### JobInfo

```
{
    ID: number,
    polygonID: number,
    mapID: string,
    randomDownload: boolean,
    updateTiles: boolean,
    updateDifferent: boolean,
    updateDateTiles: boolean,
    dateTiles: number,
    emptyTiles: boolean,
    checkEmptyTiles: boolean,
    updateDateEmpty: boolean,
    dateEmpty: number,
        zoom: Array<number>,
        running: boolean
}
```

### Additional server-side interfaces (used in codebase)

```
// Network / user config
{
    state: DownloadMode,
    request: { userAgent: string, timeout: number, delay: number },
    banTimeMode: boolean,
    proxy: { enable: boolean, server: { protocol: ProxyProtocol, host: string, port: number }, authRequired: boolean, auth: { username: string, password: string }, tor: { enable: boolean, HashedControlPassword: string, ControlPort: number } }
}

// iJobInfo
{
    ID: string,
    mapID: string,
    randomDownload: boolean,
    updateTiles: boolean,
    updateDifferent: boolean,
    updateDateTiles: boolean,
    dateTiles: string,
    emptyTiles: boolean,
    checkEmptyTiles: boolean,
    updateDateEmpty: boolean,
    dateEmpty: string,
    zoom: { [id: number]: boolean },
    threadsCounter: number
}

// iJobConfig
{
    polygonID: number,
    polygon: Array<GPSCoords>,
    customNetworkConfig: boolean,
    network?: iNetworkConfig,
    download: iJobInfo
}

// GenJobInfo
{
    ID: string,
    mapID: string,
    polygonID: number,
    polygon: Array<GPSCoords>,
    zoom: Array<string>,
    updateTiles: boolean,
    completeTiles: boolean,
    fromZoom: string,
    previousZoom: boolean
}

// UserConfig (partial)
{
    map: string,
    layers: Array<string>,
    lat: number,
    lng: number,
    zoom: number,
    showRoute: boolean,
    recordRoute: boolean,
    gpsSampleTime: number,
    mode: DownloadMode,
    jobManager: boolean,
    gpsServiceRun?: boolean,
    gpsServer?: GPSConfig,
    apiKeys?: { [id: string]: string },
    mapStoragePaths?: { [id: string]: string }
}

// GPSConfig
{
    host: string,
    port: number,
    type: GPSType,
    device: string
}
```
