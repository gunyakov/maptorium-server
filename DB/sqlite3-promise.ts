//------------------------------------------------------------------------------
//SQL queries
//------------------------------------------------------------------------------
import queries from "./queries";
//------------------------------------------------------------------------------
//SQLITE3 driver
//------------------------------------------------------------------------------
//import sqlite3 from "sqlite3";
import Database from "better-sqlite3";
//------------------------------------------------------------------------------
//MD5 to store DB file name in list
//------------------------------------------------------------------------------
let md5 = require("md5");
//------------------------------------------------------------------------------
//Logging service
//------------------------------------------------------------------------------
import Log from "../src/log";
//------------------------------------------------------------------------------
//Wait функция
//------------------------------------------------------------------------------
import wait from "../helpers/wait";
import { DBState, LogModules } from "../src/enum";
import { DBList } from "../src/interface";
//------------------------------------------------------------------------------
//Config
//------------------------------------------------------------------------------
import { isConfigReady } from "../config/shared";
import { config } from "../config/index";
//------------------------------------------------------------------------------
//Array to store all opened SQLITE DB descriptors
//------------------------------------------------------------------------------
let arrDBSQLITE3: { [id: string]: DBList } = {};
//------------------------------------------------------------------------------
//Init SQLITE3 Promise Wrapper
//------------------------------------------------------------------------------
class SQLite3Promise {
  constructor() {
    this.service();
  }

  async open(dbName: string): Promise<boolean> {
    let dbNameHash = md5(dbName) as string;
    if (typeof arrDBSQLITE3[dbNameHash] === "undefined") {
      //Create DB entry in list
      arrDBSQLITE3[dbNameHash] = {
        name: dbName,
        time: Math.floor(Date.now() / 1000),
        state: DBState.inprogress,
        db: new Database(dbName),
      };
    }
    if (arrDBSQLITE3[dbNameHash].state != DBState.open) {
      return new Promise(function (resolve, reject) {
        try {
          arrDBSQLITE3[dbNameHash].db = new Database(dbName);
          arrDBSQLITE3[dbNameHash].db.pragma("journal_mode = WAL");
          arrDBSQLITE3[dbNameHash].state = DBState.open;
          arrDBSQLITE3[dbNameHash].time = Math.floor(Date.now() / 1000);
          Log.info(LogModules.sqlite3, "OPEN -> " + dbName);
          resolve(true);
        } catch (e) {
          Log.error(LogModules.sqlite3, (e as Error)?.message);
          Log.error(LogModules.sqlite3, dbName);
          resolve(false);
        }
      });
    } else {
      return new Promise(function (resolve, reject) {
        arrDBSQLITE3[dbNameHash].time = Math.floor(Date.now() / 1000);
        resolve(true);
      });
    }
  }

  // any query: insert/delete/update
  async run(
    dbName: string,
    key: string,
    params: Array<any> = []
  ): Promise<boolean | number> {
    const stmt = await this.prepare(dbName, key);

    if (stmt) {
      return new Promise(function (resolve, reject) {
        try {
          const info = stmt.run(params);
          Log.success(LogModules.sqlite3, "RUN -> " + dbName);
          resolve(info.lastInsertRowid);
        } catch (e) {
          Log.error(LogModules.sqlite3, (e as Error)?.message + " " + dbName);
          resolve(false);
        }
      });
    } else {
      Log.error(
        LogModules.sqlite3,
        "Statement preparation failed for " + dbName
      );
      return false;
    }
  }

  // first row read
  async get(dbName: string, key: string, params: Array<any> = []) {
    const stmt = await this.prepare(dbName, key);
    if (stmt) {
      return new Promise(function (resolve, reject) {
        try {
          const row = stmt.get(params);
          Log.success(LogModules.sqlite3, "GET -> " + dbName);
          if (typeof row == "undefined") resolve(false);
          else resolve(row);
        } catch (e) {
          Log.error(LogModules.sqlite3, (e as Error)?.message + " " + dbName);
          resolve(false);
        }
      });
    } else {
      return false;
    }
  }

  // set of rows read
  async all(dbName: string, key: string, params: Array<any> = []) {
    const stmt = await this.prepare(dbName, key);
    if (stmt) {
      return new Promise(function (resolve, reject) {
        try {
          const rows = stmt.all(params);
          if (rows.length == 0) {
            resolve(false);
          } else {
            Log.success(LogModules.sqlite3, "ALL -> " + dbName);
            resolve(rows);
          }
        } catch (e) {
          Log.error(LogModules.sqlite3, (e as Error)?.message + " " + dbName);
          resolve(false);
        }
      });
    } else {
      return false;
    }
  }

  //prepare sql for bulk requests
  async prepare(dbName: string, key: string): Promise<any> {
    if (await this.open(dbName)) {
      return new Promise(function (resolve, reject) {
        let dbNameHash = md5(dbName) as string;
        let sql = queries[key] ? queries[key] : key;
        resolve(arrDBSQLITE3[dbNameHash].db.prepare(sql));
      });
    } else {
      return false;
    }
  }
  // each row returned one by one
  async each(
    dbName: string,
    key: string,
    params: Array<any>,
    action: CallableFunction
  ) {
    const stmt = await this.prepare(dbName, key);
    if (stmt) {
      return new Promise(function (resolve, reject) {
        const resultArr = [];
        if (params == undefined) params = [];
        for (const row of stmt.iterate(params)) {
          resultArr.push(action(row));
        }
        if (resultArr.length == 0) resolve(false);
        else resolve(resultArr);
      });
    }
  }

  async close(dbName: string) {
    let dbNameHash = md5(dbName) as string;
    return new Promise(function (resolve, reject) {
      try {
        arrDBSQLITE3[dbNameHash].db.close();
        arrDBSQLITE3[dbNameHash].state = DBState.closed;
        Log.info(LogModules.sqlite3, "CLOSE -> " + dbName);
        resolve(true);
      } catch (e) {
        Log.error(LogModules.sqlite3, (e as Error)?.message + " " + dbName);
        resolve(false);
      }
    });
  }

  async service() {
    while (!isConfigReady()) await wait(1000);
    //Run neverended cycle
    while (true) {
      //Go throught DB list
      for (let [key, value] of Object.entries(arrDBSQLITE3)) {
        //Check last DB query time
        let dbTimeOpen = Math.floor(Date.now() / 1000) - value.time;
        //If last query time more then iddle time settings
        if (
          dbTimeOpen > config.db.OpenTime &&
          arrDBSQLITE3[key].state == DBState.open
        ) {
          //Close DB
          await this.close(value.name);
          //Set DB close state
          arrDBSQLITE3[key].state = DBState.closed;
        }
      }
      //Run function each 5 seconds
      await wait(5000);
    }
  }
}

export default new SQLite3Promise();
