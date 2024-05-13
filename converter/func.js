const storagePath = "/media/oleg/Video2/maptorium";

//------------------------------------------------------------------------------
//CRC32 to store tiles hash in DB
//------------------------------------------------------------------------------
import { bstr } from "crc-32";
//------------------------------------------------------------------------------
//NodeJS core file system functions
//------------------------------------------------------------------------------
import { existsSync, mkdirSync } from 'fs';

import  { parentPort } from "worker_threads";

import wait from "../helpers/wait";

const sqlite3 = require('sqlite3').verbose();

parentPort?.on("message", async ({ID, tiles}) => {
  await tilesProcess(ID, tiles);
  
  parentPort?.postMessage({ID: ID});
});

export async function tilesProcess(ID, tiles) {
  console.log(`Start worker #${ID} with ${tiles.length} tiles.`);
  if(tiles) {
    let newDB = false;

    let dbPath = await getDBPath(tiles[0].zoom_level, tiles[0].tile_column, await tileRow(tiles[0].zoom_level, tiles[0].tile_row), storagePath);
    //Check if folders for DB storage is present
    if(!existsSync(dbPath)) {
      //Make full folders parh in recursive mode
      mkdirSync(dbPath, { recursive: true });
    }
    //Check if DB file is not present andnot require to make DB
    let dbName = await getDBName(tiles[0].zoom_level, tiles[0].tile_column, await tileRow(tiles[0].zoom_level, tiles[0].tile_row), storagePath);
    if(!existsSync(dbName)) newDB = true;

    let dbBusy = true;
    let db = null;
    while(dbBusy) {
      db = new sqlite3.Database(dbName, async(err) => {
        if(!err) dbBusy = false;
      });
      await wait(1000);
    }
    
    
    db.serialize(async () => {

      if(newDB) {
        db.run("CREATE TABLE IF NOT EXISTS t (x INTEGER NOT NULL,y INTEGER NOT NULL,v INTEGER DEFAULT 0 NOT NULL,c TEXT,s INTEGER DEFAULT 0 NOT NULL,h INTEGER DEFAULT 0 NOT NULL,d INTEGER NOT NULL,b BLOB,constraint PK_TB primary key (x,y,v));");
        db.run("CREATE INDEX IF NOT EXISTS t_v_idx on t (v);");
      }

      const stmt = db.prepare("INSERT INTO t VALUES (?, ?, ?, ?, ?, ?, ?, ?);");
      for(let i = 0; i < tiles.length; i++) {
        let tile = tiles[i];
        //if(tile.zoom_level > 10) {
          let y = await tileRow(tile.zoom_level, tile.tile_row);
          stmt.run([
            tile.tile_column,
            y,
            1,
            "",
            Buffer.byteLength(tile.tile_data),
            Math.abs(bstr(tile.tile_data.toString())),
            Math.floor(Date.now() / 1000),
            tile.tile_data],
          (res, err) => {
            if(err) {
              console.log(err);
            }
          });
        //}
      }
      stmt.finalize();
    });

    db.close((err) => {if(err) console.log(err)});
    
  }
  console.log(`Stop worker #${ID}.`);
}
//----------------------------------------------------------------------------
  //Function to generate full folder path to DB file
  //----------------------------------------------------------------------------
  async function getDBPath(z, x, y, storage) {
    let zoom = z + 1;
    var dbpath = storage + "/z" + zoom + "/" + Math.floor(x / 1024) + "/" + Math.floor(y / 1024) + "/";
    return dbpath;
  }
  //----------------------------------------------------------------------------
  //Function to generate full folder + file name to DB file
  //----------------------------------------------------------------------------
  async function getDBName(z, x, y, storage) {
    let dbpath = await getDBPath(z, x, y, storage);
    dbpath = dbpath + Math.floor(x / 256) + "." + Math.floor(y / 256) + ".sqlitedb";
    return dbpath;
  }

  async function tileRow(zoom_level, tile_row) {
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
    



