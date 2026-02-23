import JobManager from "../src/jobmanager";
import { CachedTilesList, GPSCoords, TileInfo } from "../src/interface";
//------------------------------------------------------------------------------
//Logging service
//------------------------------------------------------------------------------
import Log from "../src/log";
import { LogModules, TileInCache } from "../src/enum";
//------------------------------------------------------------------------------
//Logging service
//------------------------------------------------------------------------------
import { sendCachedMap, sendCachedMapUpdate } from "../src/io";
import MapHandler from "../src/map";
import wait from "./wait";

import { getMapHandler } from "../maps";
import { tileListByPolygon, tilesListByPOI } from "./tilesList";

let makeTileChecking = true;
let runTileChecking = false;
let timeLastUpdate: number = 0;

export async function getCachedMap(
  mapID: string,
  zoom: number,
  arrTiles: Array<TileInfo>,
) {
  makeTileChecking = true;
  runTileChecking = true;

  let time = (timeLastUpdate = Date.now());

  let mapHandler = getMapHandler(mapID) as MapHandler;

  if (mapHandler) {
    Log.success(LogModules.main, "Start checking tiles in DB for cached map.");

    let tileCachedList: CachedTilesList = {};

    sendCachedMapUpdate({ tiles: 0, total: arrTiles.length });

    for (let i = 0; i < arrTiles.length; i++) {
      //Send each 200ms update to server about checking process
      if (timeLastUpdate + 200 < Date.now()) {
        sendCachedMapUpdate({ tiles: i, total: arrTiles.length });
        timeLastUpdate = Date.now();
        //console.log("Update tile info");
        await wait(50);
      }
      if (makeTileChecking) {
        let [tileInDB, tileInfo] = await mapHandler.checkTile(
          arrTiles[i].z as number,
          arrTiles[i].x,
          arrTiles[i].y,
          false,
        );
        let state = TileInCache.missing;
        if (tileInDB) {
          if (tileInfo.s != 0) {
            state = TileInCache.present;
          } else {
            state = TileInCache.empty;
          }
        }
        if (typeof tileCachedList[arrTiles[i]["x"]] == "undefined") {
          tileCachedList[arrTiles[i]["x"]] = {};
        }
        tileCachedList[arrTiles[i]["x"]][arrTiles[i]["y"]] = state;
      } else break;
    }
    if (makeTileChecking) {
      //Send to user that cached tile finish calculation
      sendCachedMapUpdate({ tiles: arrTiles.length, total: arrTiles.length });

      time = Math.round((Date.now() - time) / 1000);
      Log.success(
        LogModules.main,
        `Finished checking tiles in DB for cached map. Time spend ${time}.`,
      );
      time = Date.now();
      //tileCachedMap = await CachedMap.generateMap(cachedMap);
      //time = Math.round((Date.now() - time) / 1000);
      //Log.info(LogModules.main, `Finished generating tiles for cached map. Time spend ${time}.`);
      await JobManager.setTileCachedMap(mapID, zoom, tileCachedList);
      sendCachedMap({ map: mapID, zoom: zoom, tiles: tileCachedList });
    }
  } else {
    Log.info(LogModules.main, `Cant get map handler by ID: ${mapID}. Skip.`);
  }
  runTileChecking = false;
}

export async function getCachedMapByPolygon(
  polygon: Array<GPSCoords>,
  zoom: number,
  map: string,
  tileSize: number,
) {
  let tileList = await tileListByPolygon(polygon, zoom, tileSize);
  if (tileList.length > 0) {
    getCachedMap(map, zoom, tileList);
  }
}
//------------------------------------------------------------------------------
//Stop tile checking function and wait intil function is finishing execution
//------------------------------------------------------------------------------
export async function abortTileChecking(): Promise<boolean> {
  makeTileChecking = false;
  return new Promise(async (resolve, reject) => {
    while (true) {
      if (!runTileChecking) resolve(true);
      await wait(500);
    }
  });
}

export async function getCachedMapByPOI(
  poiID: number,
  zoom: number,
  map: string,
  tileSize: number,
) {
  let tileList = await tilesListByPOI(poiID, zoom, tileSize);
  if (tileList.length > 0) {
    getCachedMap(map, zoom, tileList);
  }
}

export async function getCachedMapByBBOX(
  bbox: Array<number>,
  zoom: number,
  map: string,
  tileSize: number,
) {
  let points: Array<GPSCoords> = [];
  points.push({ lat: bbox[1], lng: bbox[0] });
  points.push({ lat: bbox[1], lng: bbox[2] });
  points.push({ lat: bbox[3], lng: bbox[2] });
  points.push({ lat: bbox[3], lng: bbox[0] });
  points.push({ lat: bbox[1], lng: bbox[0] });
  let tileList = await tileListByPolygon(points, zoom, tileSize);
  if (tileList.length > 0) {
    getCachedMap(map, zoom, tileList);
  }
}
