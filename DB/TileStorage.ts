//------------------------------------------------------------------------------
//NodeJS Buffer
//------------------------------------------------------------------------------
import { Buffer } from "node:buffer";
//------------------------------------------------------------------------------
//MD5 to store DB file name in list
//------------------------------------------------------------------------------
let md5 = require("md5");
//------------------------------------------------------------------------------
//NodeJS core file system functions
//------------------------------------------------------------------------------
import { existsSync, mkdirSync } from "fs";
//------------------------------------------------------------------------------
//CRC32 to store tiles hash in DB
//------------------------------------------------------------------------------
import { bstr } from "crc-32";
//------------------------------------------------------------------------------
//Sqlite3 Promise wrapper
//------------------------------------------------------------------------------
import DB from "./sqlite3-promise";
//------------------------------------------------------------------------------
//Logging service
//------------------------------------------------------------------------------
import Log from "../src/log";
//------------------------------------------------------------------------------
//Config
//------------------------------------------------------------------------------
import { config } from "../config/index";
//------------------------------------------------------------------------------
//Wait функция
//------------------------------------------------------------------------------
import wait from "../helpers/wait";
import { DBState, LogModules } from "../src/enum";
import { Tile } from "../src/interface";
//------------------------------------------------------------------------------
//Tile storage based on sqlite3 promise version
//------------------------------------------------------------------------------
class TileStorage {
  private arrDB: { [id: string]: { name: string; state: DBState } };
  //----------------------------------------------------------------------------
  //Constructor
  //----------------------------------------------------------------------------
  constructor() {
    this.arrDB = {};
  }
  //----------------------------------------------------------------------------
  //Function to generate full folder path to DB file
  //----------------------------------------------------------------------------
  async getDBPath(z: number, x: number, y: number, storage: string) {
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
  async getDBName(z: number, x: number, y: number, storage: string) {
    let dbpath = await this.getDBPath(z, x, y, storage);
    dbpath =
      dbpath + Math.floor(x / 256) + "." + Math.floor(y / 256) + ".sqlitedb";
    return dbpath;
  }
  //----------------------------------------------------------------------------
  //General function, handle DB file opening / creating tables by request
  //----------------------------------------------------------------------------
  async getDB(
    z: number,
    x: number,
    y: number,
    storage: string,
    createDB: boolean = false
  ) {
    //Get full folder + file name path to DB file
    let dbName = await this.getDBName(z, x, y, storage);
    //Generate DB name hash
    let dbNameHash = md5(dbName);
    //Reset inner working state for DB
    let dbState = false;
    //Generate full path to DB file
    var dbPath = await this.getDBPath(z, x, y, storage);
    //Check if folders for DB storage is present
    if (!existsSync(dbPath)) {
      //If not require to make DB just exit from DB
      if (!createDB) return false;
      //Make full folders parh in recursive mode
      mkdirSync(dbPath, { recursive: true });
    }
    //Check if DB file is not present andnot require to make DB
    if (!existsSync(dbName) && !createDB) return false;
    //If DB is missing in list
    if (typeof this.arrDB[dbNameHash] === "undefined") {
      //Create DB entry in list
      this.arrDB[dbNameHash] = {
        name: dbName,
        state: DBState.closed,
      };
    }
    //Run wait cycle while state of DB 'inprogress' - mean DB is opened/created tables in another thread
    while (this.arrDB[dbNameHash].state == DBState.inprogress) {
      //Wait 1 secont to next try
      await wait(1000);
    }
    //If DB state isn`t 'open' - mean DB still not opened/tables still not created
    if (this.arrDB[dbNameHash].state == DBState.closed) {
      this.arrDB[dbNameHash].state = DBState.inprogress;

      //Check if DB file is not present
      if (!existsSync(dbName)) {
        //If not require to make DB
        if (!createDB) return false;
        //Create new DB file
        dbState = await DB.open(dbName);
        if (dbState) {
          //Create table to store tiles
          await DB.run(dbName, "CREATE_STORAGE_TABLE");
          //Create index for tiles table
          await DB.run(dbName, "CREATE_INDEX");
          Log.info(LogModules.tstor, "CREATE -> " + dbName);
        }
      }
      //If DB file is present
      else {
        //Open DB only
        dbState = await DB.open(dbName);
        //If we open DB successfully
        if (dbState) {
          //Make log
          Log.info(LogModules.tstor, "OPEN-> " + dbName);
        }
      }
      //If DB file opened/created successfully
      if (dbState) {
        //Set DB state
        this.arrDB[dbNameHash].state = DBState.open;
      }
      //Exit
      return dbState;
    }
    return true;
  }
  //----------------------------------------------------------------------------
  //Get tile from DB
  //----------------------------------------------------------------------------
  async getTile(
    z: number,
    x: number,
    y: number,
    storage: string,
    getFull: boolean = false
  ) {
    //Get folder + file name of DB
    let dbName = await this.getDBName(z, x, y, storage);
    //Try to get DB and return in DB missing
    if (!(await this.getDB(z, x, y, storage))) return false;
    //SQL request to DB
    let sql = getFull ? "SELECT_TILE_FULL" : "SELECT_TILE_INFO";
    //Request tile from DB
    let results = (await DB.get(dbName, sql, [x, y])) as boolean | Tile;
    //If tile is missing in DB
    if (!results) {
      return false;
    }
    //If tile is present in DB
    else {
      return results as Tile;
    }
  }
  //----------------------------------------------------------------------------
  //Save tile in DB
  //----------------------------------------------------------------------------
  async insert(
    z: number,
    x: number,
    y: number,
    storage: string,
    blob: Buffer,
    size: number,
    mapVersion = 0
  ) {
    //If enable to write into DB
    if (config.db.ReadOnly === false) {
      //Получаем полный путь к базе
      let dbName = await this.getDBName(z, x, y, storage);
      //Open DB or Create if missing
      await this.getDB(z, x, y, storage, true);
      //Получаем время запроса
      let timeStamp = await this.time();
      //Заносим изображение в базу
      let results = await DB.run(dbName, "INSERT_TILE", [
        x,
        y,
        mapVersion,
        "",
        size,
        Math.abs(bstr(blob.toString("utf8"))),
        timeStamp,
        blob,
      ]);
      //Если запрос вернул результат
      if (results) return true;
      //Если запрос вернул пустой результат, значит база была закрыта
      else return false;
    } else {
      return true;
    }
  }
  //----------------------------------------------------------------------------
  //Update tile in DB
  //----------------------------------------------------------------------------
  async update(
    z: number,
    x: number,
    y: number,
    storage: string,
    blob: Buffer,
    size: number,
    mapVersion: number = 0
  ): Promise<boolean> {
    //Get folder + file name of DB
    let dbName = await this.getDBName(z, x, y, storage);
    //Open DB
    await this.getDB(z, x, y, storage);
    //Get current UNIX Timestamp
    let timeStamp = await this.time();
    //Get tile from DB
    let tile = await this.getTile(z, x, y, storage);
    //Update tile in DB
    let results = (await DB.run(dbName, "UPDATE_TILE", [
      mapVersion,
      size,
      Math.abs(bstr(blob.toString("utf8"))),
      timeStamp,
      blob,
      x,
      y,
    ])) as boolean;
    //Если запрос вернул результат
    if (results) {
      //Make log
      Log.success(LogModules.tstor, "UPDATE -> " + dbName);
      return true;
    }
    //Если запрос вернул пустой результат, значит база была закрыта
    else {
      //Make log
      Log.error(LogModules.tstor, "UPDATE -> " + dbName);
      return false;
    }
  }
  //----------------------------------------------------------------------------
  //UNIX TIMESTAMP
  //----------------------------------------------------------------------------
  async time(): Promise<number> {
    return Math.floor(Date.now() / 1000);
  }
}

export default new TileStorage();
