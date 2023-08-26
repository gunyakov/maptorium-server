//------------------------------------------------------------------------------
//SQL queries
//------------------------------------------------------------------------------
import queries from "./queries";
//------------------------------------------------------------------------------
//SQLITE3 driver
//------------------------------------------------------------------------------
import sqlite3 from 'sqlite3';
//------------------------------------------------------------------------------
//MD5 to store DB file name in list
//------------------------------------------------------------------------------
let md5 = require('md5');
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
import config from "../config/index";
//------------------------------------------------------------------------------
//Array to store all opened SQLITE DB descriptors
//------------------------------------------------------------------------------
let arrDBSQLITE3:{[id:string]:DBList} = {};
//------------------------------------------------------------------------------
//Init SQLITE3 Promise Wrapper
//------------------------------------------------------------------------------
class SQLite3Promise {

  constructor() {
    this.service();
  }

  async open(dbName:string):Promise<boolean> {
    let dbNameHash = md5(dbName) as string;
    if(typeof arrDBSQLITE3[dbNameHash] === "undefined") {
      //Create DB entry in list
      arrDBSQLITE3[dbNameHash] = {
        name: dbName,
        time: Math.floor(Date.now() / 1000),
        state: DBState.inprogress,
        db: new sqlite3.Database("")
      }
    }
    if(arrDBSQLITE3[dbNameHash].state != DBState.open) {
      return new Promise(function(resolve, reject) {
        arrDBSQLITE3[dbNameHash].db = new sqlite3.Database(dbName,
            function(err) {
                if(err) {
                  Log.error(LogModules.sqlite3, err.message);
				          Log.error(LogModules.sqlite3, dbName);
                  resolve(false);
                }
                else {
                  Log.info(LogModules.sqlite3, "OPEN -> " + dbName);
                  arrDBSQLITE3[dbNameHash].state = DBState.open;
                  arrDBSQLITE3[dbNameHash].time = Math.floor(Date.now() / 1000);
                  resolve(true);
                }
            }
        )
      });
    }
    else {
      return new Promise(function(resolve, reject) {
        arrDBSQLITE3[dbNameHash].time = Math.floor(Date.now() / 1000);
        resolve(true);
      });
    }
  }

  async serialize(dbName:string) {
    let dbNameHash = md5(dbName) as string;
    await this.open(dbName);
    return new Promise(function(resolve, reject) {
      arrDBSQLITE3[dbNameHash].db.serialize(function() {
          Log.success(LogModules.sqlite3, "SERIALIZE -> " + dbName);
          resolve(true);
      });
    });
  }

  // any query: insert/delete/update
  async run(dbName:string, key:string, params:Array<any> = []):Promise<boolean | number> {
    let dbNameHash = md5(dbName) as string;
    await this.open(dbName);
    return new Promise(function(resolve, reject) {
      let sql = queries[key] ? queries[key] : key;
      arrDBSQLITE3[dbNameHash].db.run(sql, params,
        function(err: string, result:any) {
          if(err) {
            Log.error(LogModules.sqlite3, err + " " + dbName);
            resolve(false);
          }
          else {
            Log.success(LogModules.sqlite3, "RUN -> " + dbName);
            //@ts-ignore
            this?.lastID > 0 ? resolve(this.lastID) : resolve(true);
          }
      })
    })
  }

  // first row read
  async get(dbName:string, key:string, params:Array<any> = []) {
    let dbNameHash = md5(dbName) as string;
    await this.open(dbName);
    return new Promise(function(resolve, reject) {
      let sql = queries[key] ? queries[key] : key;
      arrDBSQLITE3[dbNameHash].db.get(sql, params, function(err, row)  {
          if(err) {
            Log.error(LogModules.sqlite3, err.message + " " + dbName);
            resolve(false);
          }
          else {
            Log.success(LogModules.sqlite3, "GET -> " + dbName);
            resolve(row);
          }
      })
    })
  }

  // set of rows read
  async all(dbName:string, key:string, params:Array<any> = []) {
    let dbNameHash = md5(dbName) as string;
    await this.open(dbName);
    return new Promise(function(resolve, reject) {
      let sql = queries[key] ? queries[key] : key;
      arrDBSQLITE3[dbNameHash].db.all(sql, params, function(err, rows)  {
          if(err) {
            Log.error(LogModules.sqlite3, err.message + " " + dbName);
            resolve(false);
          }
          else {
            Log.success(LogModules.sqlite3, "ALL -> " + dbName);
            resolve(rows)
          }
      })
    })
  }

  // each row returned one by one
  async each(dbName:string, key:string, params:Array<any>, action:CallableFunction) {
    let dbNameHash = md5(dbName) as string;
    await this.open(dbName);
    return new Promise(function(resolve, reject) {
      if(params == undefined) params=[]
      var db = arrDBSQLITE3[dbNameHash].db;
      db.serialize(function() {
        let sql = queries[key] ? queries[key] : key;
        db.each(sql, params, function(err, row)  {
            if(err) reject("Read error: " + err.message )
            else {
              if(row) {
                action(row)
              }
            }
        })
        db.get("", function(err, row)  {
            resolve(true)
        })
      })
    })
  }

  async close(dbName:string) {
    let dbNameHash = md5(dbName) as string;
    await this.open(dbName);
    return new Promise(function(resolve, reject) {
      arrDBSQLITE3[dbNameHash].db.close(function(err)  {
          arrDBSQLITE3[dbNameHash].state = DBState.closed;
          if(err) {
            Log.error(LogModules.sqlite3, err.message + " " + dbName);
            resolve(false)
          }
          else {
            Log.info(LogModules.sqlite3, "CLOSE -> " + dbName);
            resolve(true)
          }
      });
    });
  }

  async service() {
    //Run neverended cycle
    while(true) {
      //Go throught DB list
      for (let [key, value] of Object.entries(arrDBSQLITE3)) {
        //Check last DB query time
        let dbTimeOpen = Math.floor(Date.now() / 1000) - value.time;
        //If last query time more then iddle time settings
        if(dbTimeOpen > config.db.OpenTime && arrDBSQLITE3[key].state == DBState.open) {
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
