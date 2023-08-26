
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
    points: Array<GPSCoords>
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