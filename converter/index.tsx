import Database from "better-sqlite3";
import wait from "../helpers/wait";
import type { Tile } from "./interface";
//------------------------------------------------------------------------------
//MD5 to store DB file name in list
//------------------------------------------------------------------------------
let md5 = require("md5");
const mbtiles = "/home/oleg/Project/Maptorium/maptorium-vectormap/map.mbtiles";

import { Worker } from "worker_threads";

//import TileStorage from "../DB/TileStorage";

const storage = "/media/oleg/Video2/maptorium";

let processID: { [id: number]: boolean } = {};

let processWorker: { [id: number]: Worker } = {};

let objTiles: { [id: string]: Array<Tile> } = {};

let arrTiles: Array<Array<Tile>> = [];

let tilesInDB = true;
let offset = 0;
let step = 1000000;
let processes = 1;
let processesRun = false;
let mainProcess = true;
const db = new Database(mbtiles);
db.pragma("journal_mode = OFF");
db.pragma("cache_size = 102400");
const stmt = db.prepare("SELECT * FROM tiles LIMIT ? OFFSET ?;");

(async () => {
  //Make workers
  for (let a = 1; a <= processes; a++) {
    processWorker[a] = new Worker("./converter/func.js");
    //when worker finish work
    processWorker[a].on("message", ({ ID }) => {
      //set that worker is stoped.
      processID[ID] = false;
    });
    processWorker[a].on("error", (err) => {
      console.log(err);
    });
  }
  getTiles();
  processTiles();
  while (mainProcess) {
    if (!processesRun && !tilesInDB) {
      console.timeLog(new Date().toLocaleString("en-GB"), "Completed.");
      mainProcess = false;
    }
    await wait(1000);
  }
  db.close();
  process.exit();
})();

async function getTiles() {
  console.log(new Date().toLocaleString("en-GB"), "Start DB service function");
  while (tilesInDB) {
    //If no tiles list in Array
    if (arrTiles.length < processes * 10) {
      console.log(
        new Date().toLocaleString("en-GB"),
        `Start MBTiles request with ${offset} offset.`
      );
      //Get tiles from DB
      let tiles = (await stmt.all([step, offset])) as Array<Tile>;
      //Set new offset
      offset += step;
      console.log(
        new Date().toLocaleString("en-GB"),
        `Request end. New offset is ${offset} tiles.`
      );
      //If tiles was returned by DB
      if (tiles.length > 0) {
        //For all tiles
        for (let a = 0; a < tiles.length; a++) {
          //Get current tile
          let tile = tiles[a];
          //Make for tile DB name hash
          let dbNameHash = md5(
            await getDBName(
              tile.zoom_level,
              tile.tile_column,
              await tileRow(tile.zoom_level, tile.tile_row),
              storage
            )
          ) as string;
          //If no DB name in object, make tile array
          if (!objTiles[dbNameHash]) objTiles[dbNameHash] = [];
          //Insert into array tile
          objTiles[dbNameHash].push(tile);
        }
        //Get tiles arrays from object
        arrTiles = [...arrTiles, ...Object.values(objTiles)];
        console.log(
          new Date().toLocaleString("en-GB"),
          `Tiles sorting is finished.`
        );
        objTiles = {};
      } else {
        tilesInDB = false;
      }
    }
    await wait(100);
  }
}
async function processTiles() {
  console.log(
    new Date().toLocaleString("en-GB"),
    "Start workers service function"
  );
  while (mainProcess) {
    processesRun = false;
    //If have tile arrays
    if (arrTiles.length > 0) {
      //For all threads
      for (let i = 1; i <= processes; i++) {
        //if still have array tiles
        if (arrTiles.length > 0 && !processID[i]) {
          //set that worker is run
          processID[i] = true;
          //get tiles arrya nd remove from list
          const temp = arrTiles.shift();
          //console.log(temp);
          //process.exit();
          //start worker with only current DB
          processWorker[i].postMessage({ ID: i, tiles: temp });
        } else {
          processesRun = true;
        }
      }
    }
    await wait(500);
  }
}
//----------------------------------------------------------------------------
//Function to generate full folder path to DB file
//----------------------------------------------------------------------------
async function getDBPath(z: number, x: number, y: number, storage: string) {
  let zoom = z + 1;
  var dbpath =
    storage +
    "/z" +
    zoom +
    "/" +
    Math.floor(x / 1024) +
    "/" +
    Math.floor(y / 1024) +
    "/";
  return dbpath;
}
//----------------------------------------------------------------------------
//Function to generate full folder + file name to DB file
//----------------------------------------------------------------------------
async function getDBName(z: number, x: number, y: number, storage: string) {
  let dbpath = await getDBPath(z, x, y, storage);
  dbpath =
    dbpath + Math.floor(x / 256) + "." + Math.floor(y / 256) + ".sqlitedb";
  return dbpath;
}

async function tileRow(zoom_level: number, tile_row: number) {
  //Устанавливаем максимальное значение координат тайла
  let maxTileNumber = 1;
  //Изменяем максимальный номер тайла в соответсвии с уровнем увеличения
  for (let a = 1; a <= zoom_level; a++) {
    maxTileNumber = maxTileNumber * 2;
  }
  maxTileNumber--;
  let y = maxTileNumber - tile_row;
  return y;
}
