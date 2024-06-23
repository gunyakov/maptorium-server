const storagePath = "/media/oleg/Video21/maptorium";

//------------------------------------------------------------------------------
//CRC32 to store tiles hash in DB
//------------------------------------------------------------------------------
import { bstr } from "crc-32";
//------------------------------------------------------------------------------
//NodeJS core file system functions
//------------------------------------------------------------------------------
import { existsSync, mkdirSync } from "fs";

import { parentPort } from "worker_threads";

import wait from "../helpers/wait";

import Database from "better-sqlite3";

parentPort?.on("message", async ({ ID, tiles }) => {
  tilesProcess(ID, tiles);
});

export async function tilesProcess(ID, rawTiles) {
  // console.log(
  //   new Date().toLocaleString("en-GB"),
  //   `Start worker #${ID} with ${rawTiles.length} tiles.`
  // );
  if (rawTiles) {
    let newDB = false;

    let dbPath = await getDBPath(
      rawTiles[0].zoom_level,
      rawTiles[0].tile_column,
      tileRow(rawTiles[0].zoom_level, rawTiles[0].tile_row),
      storagePath
    );
    //Check if folders for DB storage is present
    if (!existsSync(dbPath)) {
      //Make full folders parh in recursive mode
      mkdirSync(dbPath, { recursive: true });
    }
    //Check if DB file is not present andnot require to make DB
    let dbName = await getDBName(
      rawTiles[0].zoom_level,
      rawTiles[0].tile_column,
      tileRow(rawTiles[0].zoom_level, rawTiles[0].tile_row),
      storagePath
    );
    if (!existsSync(dbName)) newDB = true;

    let db = null;
    //while (dbBusy) {
    db = new Database(dbName);
    await db.pragma("journal_mode = WAL");
    //await db.pragma("cache_size = 51200");
    //await wait(1000);
    //}
    if (newDB) {
      await db
        .prepare(
          "CREATE TABLE IF NOT EXISTS t (x INTEGER NOT NULL,y INTEGER NOT NULL,v INTEGER DEFAULT 0 NOT NULL,c TEXT,s INTEGER DEFAULT 0 NOT NULL,h INTEGER DEFAULT 0 NOT NULL,d INTEGER NOT NULL,b BLOB,constraint PK_TB primary key (x,y,v));"
        )
        .run();
      await db.prepare("CREATE INDEX IF NOT EXISTS t_v_idx on t (v);").run();
    }
    const stmt = await db.prepare(
      "INSERT INTO t VALUES (?, ?, ?, ?, ?, ?, ?, ?);"
    );

    const transaction = db.transaction(
      (tiles) => {
        for (const tile of tiles) {
          const y = tileRow(tile.zoom_level, tile.tile_row);
          try {
            stmt.run(
              tile.tile_column,
              y,
              1,
              "",
              Buffer.byteLength(tile.tile_data),
              Math.abs(bstr(tile.tile_data.toString())),
              Math.floor(Date.now() / 1000),
              tile.tile_data
            );
          } catch (err) {
            if (err.code !== "SQLITE_CONSTRAINT_PRIMARYKEY") console.log(err);
          }
        }
      },
      { complete: true }
    );

    await transaction(rawTiles);
    //await transaction.commit();

    await db.close((err) => {
      if (err) console.log(err);
    });
    db = null;
    rawTiles = null;
  }
  //console.log(new Date().toLocaleString("en-GB"), `Stop worker #${ID}.`);
  parentPort?.postMessage({ ID: ID });
}
//----------------------------------------------------------------------------
//Function to generate full folder path to DB file
//----------------------------------------------------------------------------
async function getDBPath(z, x, y, storage) {
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
async function getDBName(z, x, y, storage) {
  let dbpath = await getDBPath(z, x, y, storage);
  dbpath =
    dbpath + Math.floor(x / 256) + "." + Math.floor(y / 256) + ".sqlitedb";
  return dbpath;
}

function tileRow(zoom_level, tile_row) {
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
