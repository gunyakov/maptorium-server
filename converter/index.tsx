
import sqlite3 from "../DB/sqlite3-promise";
import wait from "../helpers/wait";
//------------------------------------------------------------------------------
//MD5 to store DB file name in list
//------------------------------------------------------------------------------
let md5 = require("md5");
const mbtiles = "/home/goodzon/Projects/maptorium-vectormap/map.mbtiles";

import { Worker } from "worker_threads";

//import TileStorage from "../DB/TileStorage";

const storage = "/media/oleg/Video2/maptorium";

let processID:{[id: number]: boolean} = {};

let objTiles:{[id: string]: Array<Tile>} = {};

let arrTiles:Array<Array<Tile>> = [];
(async () => {
  let tilesInDB = true;
  let offset = 0;
  let step = 100000;
  let processes = 1;
  let processesRun = false;
  let mainProcess = true;
  while(mainProcess) {

    processesRun = false;
    //If no tiles list in Array
    if(arrTiles.length == 0) {
      //Get tiles from DB
      let tiles = await sqlite3.all(mbtiles, "SELECT * FROM tiles LIMIT ? OFFSET ?;", [step, offset]) as [Tile];
      //Set new offset
      offset += step;
      console.log(`New offset ${offset}.`);
      //If tiles was returned by DB
      if(tiles.length > 0) {
        //For all tiles
        for(let a = 0; a < tiles.length; a++) {
          //Get current tile
          let tile = tiles[a];
          //Make for tile DB name hash
          let dbNameHash = md5(await getDBName(tile.zoom_level, tile.tile_column, await tileRow(tile.zoom_level, tile.tile_row), storage)) as string;
          //If no DB name in object, make tile array
          if(!objTiles[dbNameHash]) objTiles[dbNameHash] = [];
          //Insert into array tile
          objTiles[dbNameHash].push(tile);
        }
        //Get tiles arrays from object
        arrTiles = Object.values(objTiles);
        objTiles = {};
      }
      else {
        tilesInDB = false;
      }
    }

    //If have tile arrays
    if(arrTiles.length > 0) {
      //For all threads
      for(let i = 1; i <= processes; i++) {
        //if still have array tiles
        if(arrTiles.length > 0 && !processID[i]) {
          //set that worker is run
          processID[i] = true;
          //make new worker
          const childProcess = new Worker("./converter/func.js");
          //get tiles arrya nd remove from list
          let temp = arrTiles.shift();
          //console.log(temp);
          //process.exit();
          //start worker with only current DB
          childProcess.postMessage({ID: i, tiles: temp});
          //when worker finish work
          childProcess.on("message", ({ID}) => {
            //set that worker is stoped.
            processID[ID] = false;
          });
          childProcess.on("error", (err) => {
            console.log(err);
          })
        }
        else {
          processesRun = true;
        }
      }
    }
    
    if(!processesRun && !tilesInDB) {
      console.log("Completed.");
      process.exit();
    }
    await wait(1000);
  }
  
})();

  //----------------------------------------------------------------------------
  //Function to generate full folder path to DB file
  //----------------------------------------------------------------------------
  async function getDBPath(z:number, x:number, y:number, storage:string) {
    let zoom = z + 1;
    var dbpath = storage + "/z" + zoom + "/" + Math.floor(x / 1024) + "/" + Math.floor(y / 1024) + "/";
    return dbpath;
  }
  //----------------------------------------------------------------------------
  //Function to generate full folder + file name to DB file
  //----------------------------------------------------------------------------
  async function getDBName(z:number, x:number, y:number, storage:string) {
    let dbpath = await getDBPath(z, x, y, storage);
    dbpath = dbpath + Math.floor(x / 256) + "." + Math.floor(y / 256) + ".sqlitedb";
    return dbpath;
  }

  async function tileRow(zoom_level:number, tile_row:number) {
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
