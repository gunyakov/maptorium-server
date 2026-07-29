//------------------------------------------------------------------------------
//Logging service
//------------------------------------------------------------------------------
import Log from "./log";
//------------------------------------------------------------------------------
//DB handler
//------------------------------------------------------------------------------
import sqlite3 from "../DB/sqlite3-promise";
import { APP_DB_NAME, ensureAppDB } from "./appDatabase";
//------------------------------------------------------------------------------
//Other imports
//------------------------------------------------------------------------------
import { UserStyleInfo, UserStyleListItem } from "./interface";
import { LogModules } from "./enum";
//------------------------------------------------------------------------------
//Pro mode "User Styles": named, saved full MapLibre style snapshots
//------------------------------------------------------------------------------
class UserStylesHandler {
  private _dbName: string = APP_DB_NAME;

  constructor() {
    this.checkDB();
  }

  async checkDB() {
    await ensureAppDB();
  }

  //------------------------------------------------------------------------------
  //List all saved styles (id/name/dates only - not the style JSON itself)
  //------------------------------------------------------------------------------
  async list(): Promise<false | Array<UserStyleListItem>> {
    return (await sqlite3.all(this._dbName, "SELECT_ALL_STYLES")) as
      | false
      | Array<UserStyleListItem>;
  }

  //------------------------------------------------------------------------------
  //Get one saved style (with its style JSON) by ID
  //------------------------------------------------------------------------------
  async get(ID: number): Promise<false | UserStyleInfo> {
    return (await sqlite3.get(this._dbName, "SELECT_STYLE_BY_ID", [
      ID,
    ])) as false | UserStyleInfo;
  }

  //------------------------------------------------------------------------------
  //Save (insert or overwrite by name) a style snapshot
  //------------------------------------------------------------------------------
  async save(name: string, style: string): Promise<number | false> {
    const now = Math.floor(Date.now() / 1000);
    const existing = (await sqlite3.get(this._dbName, "SELECT_STYLE_BY_NAME", [
      name,
    ])) as false | UserStyleInfo;

    if (existing) {
      const updated = await sqlite3.run(this._dbName, "UPDATE_STYLE_BY_NAME", [
        style,
        now,
        name,
      ]);
      if (!updated) return false;
      Log.success(LogModules.poi, "STYLE UPDATE -> " + name);
      return existing.ID;
    }

    const lastID = (await sqlite3.run(this._dbName, "INSERT_STYLE", [
      name,
      style,
      now,
      now,
    ])) as number | boolean;

    if (typeof lastID !== "number") return false;
    Log.success(LogModules.poi, "STYLE INSERT -> " + name);
    return lastID;
  }

  //------------------------------------------------------------------------------
  //Delete a saved style
  //------------------------------------------------------------------------------
  async delete(ID: number): Promise<boolean> {
    if (ID < 1) return false;
    return (await sqlite3.run(this._dbName, "DELETE_STYLE_BY_ID", [
      ID,
    ])) as boolean;
  }
}

export default new UserStylesHandler();
