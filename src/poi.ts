//------------------------------------------------------------------------------
//Logging service
//------------------------------------------------------------------------------
import Log from "./log";
//------------------------------------------------------------------------------
//DB handler
//------------------------------------------------------------------------------
import sqlite3 from "../DB/sqlite3-promise";
//------------------------------------------------------------------------------
//Other imports
//------------------------------------------------------------------------------
import { GPSCoords, POIInfo, POICategory, ROUTE, MarkInfo } from "./interface";
import { LogModules } from "./enum";
import { sendRoutePoint } from "./io";
import { POIType } from "./enum";
//------------------------------------------------------------------------------
//NodeJS core file system functions
//------------------------------------------------------------------------------
import { existsSync } from "fs";
import path from "path";
const ExecFolder = process.cwd();
//------------------------------------------------------------------------------
//General POI storage
//------------------------------------------------------------------------------
class POIHandler {
  private _dbName: string = path.join(ExecFolder, "POI.db3");
  private _routeID: number = 0;

  constructor() {
    this.checkDB();
  }

  async checkDB() {
    if (!existsSync(this._dbName)) {
      if (await sqlite3.open(this._dbName)) {
        await sqlite3.run(this._dbName, "CREATE_DB_1");
        await sqlite3.run(this._dbName, "CREATE_DB_2");
        await sqlite3.run(this._dbName, "CREATE_DB_3");
        await sqlite3.run(this._dbName, "CREATE_DB_4");
        await sqlite3.run(this._dbName, "CREATE_DB_5");
        await sqlite3.run(this._dbName, "CREATE_DB_6");
        Log.success(LogModules.poi, "POI DB was created.");
      } else {
        Log.error(LogModules.poi, "Cant make POI DB. Pls check location.");
      }
    }
    this.routeGetID();
  }
  //------------------------------------------------------------------------------
  //Check if POI present in DB
  //------------------------------------------------------------------------------
  async checkPOI(ID: number) {
    let result = (await sqlite3.get(this._dbName, "SELECT_POI_BY_ID", [
      ID,
    ])) as boolean;
    if (result) return true;
    else return false;
  }
  //------------------------------------------------------------------------------
  //Get POI by ID/by Category ID/ALL from DB/Vissible on map
  //------------------------------------------------------------------------------
  async get(
    ID: number = 0,
    categoryID: number = 0,
    visible: number = 1
  ): Promise<false | Array<POIInfo>> {
    let result: false | Array<POIInfo> = false;
    if (ID == 0 && categoryID == 0) {
      result = (await sqlite3.all(
        this._dbName,
        "SELECT_ALL_POI",
        []
      )) as Array<POIInfo>;
    } else {
      if (ID > 0 && categoryID == 0) {
        result = (await sqlite3.all(this._dbName, "SELECT_POI_BY_ID", [
          ID,
        ])) as Array<POIInfo>;
      }
      if (ID == 0 && categoryID > 0) {
        result = (await sqlite3.all(this._dbName, "SELECT_POI_BY_CATEGORY", [
          categoryID,
        ])) as Array<POIInfo>;
      }
      if (ID > 0 && categoryID > 0) {
        result = (await sqlite3.all(this._dbName, "SELECT_POI_BY_BOTH", [
          ID,
          categoryID,
        ])) as Array<POIInfo>;
      }
    }
    if (result && result.length > 0) {
      let points: false | Array<GPSCoords> = false;
      let data: Array<POIInfo> = [];
      for (let i = 0; i < result.length; i++) {
        if (result[i].visible == visible || visible == -1) {
          points = (await sqlite3.all(this._dbName, "SELECT_POINTS_BY_POI", [
            result[i].ID,
          ])) as Array<GPSCoords>;
          if (points && points.length > 0) {
            let poi = result[i];
            poi.points = points;
            data.push(poi);
          }
        }
      }
      if (data.length > 0) return data;
      else return false;
    } else return false;
  }
  async addMark(info: MarkInfo): Promise<number> {
    let SQLValues = [
      info.categoryID,
      info.name,
      POIType.point,
      "",
      "",
      1,
      1,
      1,
    ];

    let lastID = (await sqlite3.run(
      this._dbName,
      "INSERT_POI",
      SQLValues
    )) as number;
    if (lastID > 0) {
      if (
        (await sqlite3.run(this._dbName, "INSERT_POINTS", [
          lastID,
          info.points[0].lat,
          info.points[0].lng,
        ])) as number | boolean
      ) {
        return lastID;
      }
    }

    return 0;
  }
  //------------------------------------------------------------------------------
  //Add POI and POI points to DB
  //------------------------------------------------------------------------------
  async save(poi: POIInfo): Promise<number> {
    let SQLValues = [
      0,
      poi.name || "New POI",
      poi.type,
      poi.color,
      poi.fillColor,
      poi.fillOpacity,
      poi.visible || 1,
      poi.width,
    ];

    let lastID = (await sqlite3.run(
      this._dbName,
      "INSERT_POI",
      SQLValues
    )) as number;
    if (lastID > 0) {
      await this.savePoints(lastID, poi.points);
      return lastID;
    } else {
      return 0;
    }
  }
  //------------------------------------------------------------------------------
  //Insert POI points to database
  //------------------------------------------------------------------------------
  async savePoints(ID: number, points: Array<GPSCoords>): Promise<boolean> {
    if (ID < 1) return false;
    let result = true;
    for (let i = 0; i < points.length; i++) {
      result = (await sqlite3.run(this._dbName, "INSERT_POINTS", [
        ID,
        points[i]["lat"],
        points[i]["lng"],
      ])) as boolean;
    }
    return result;
  }
  //------------------------------------------------------------------------------
  //Delete POI and/or POI points from database
  //------------------------------------------------------------------------------
  async delete(ID: number, onlyPoints = false): Promise<boolean> {
    if (ID < 1) return false;
    let result = false;
    //If not update of POI
    if (!onlyPoints) {
      //Delete entry of POI
      result = (await sqlite3.run(this._dbName, "DELETE_POI_BY_ID", [
        ID,
      ])) as boolean;
    }
    //Delete points of POI
    result = (await sqlite3.run(this._dbName, "DELETE_POINTS_BY_POI", [
      ID,
    ])) as boolean;
    //Exit
    return result;
  }
  //----------------------------------------------------------------------------
  //Update POI style/info/points in DB
  //----------------------------------------------------------------------------
  async update(poi: POIInfo, onlyPoints: boolean = false): Promise<boolean> {
    let result = true;
    if (!onlyPoints) {
      //Update style of POI
      let SQLValues = [
        poi.categoryID,
        poi.name,
        poi.width,
        poi.fillOpacity,
        poi.color,
        poi.fillColor,
        poi.ID,
      ];
      result = (await sqlite3.run(
        this._dbName,
        "UPDATE_POI_STYLE",
        SQLValues
      )) as boolean;
      return result;
      // if(result) {
      //   return await this.get(poi.ID);
      // }
    }
    //Update bounds of POI if present
    // if(data.bounds) {
    //   let SQLValues = [Math.round(data.bounds._southWest.x), Math.round(data.bounds._southWest.y), Math.round(data.bounds._northEast.x), Math.round(data.bounds._northEast.y), data.zoom, data.markID];
    //   result = await sqlite3.run(this._dbName, "UPDATE_POI_BOUNDS", SQLValues);
    // }
    if (poi.points) {
      await sqlite3.run(this._dbName, "DELETE_POINTS_BY_POI", [poi.ID]);
      result = await this.savePoints(poi.ID, poi.points);
    }
    //Exit
    return result;
  }
  //----------------------------------------------------------------------------
  //CATEGORY: Check if category is present in DB
  //----------------------------------------------------------------------------
  private async _checkCategory(ID: number): Promise<boolean> {
    let categoryList = (await sqlite3.get(
      this._dbName,
      "SELECT_CATEGORY_BY_ID",
      [ID]
    )) as boolean;
    if (categoryList) return true;
    return false;
  }
  //----------------------------------------------------------------------------
  //CATEGORY: Get list of
  //----------------------------------------------------------------------------
  async categoryList(ID: number = 0): Promise<false | Array<POICategory>> {
    if (ID == 0) {
      return (await sqlite3.all(this._dbName, "SELECT_CATEGORY_LIST")) as
        | false
        | Array<POICategory>;
    } else {
      return (await sqlite3.all(this._dbName, "SELECT_CATEGORY_BY_ID", [
        ID,
      ])) as false | Array<POICategory>;
    }
  }
  //----------------------------------------------------------------------------
  //CATEGORY: Add to DB
  //----------------------------------------------------------------------------
  async categoryAdd(
    name: string,
    parentID: number = 0
  ): Promise<number | false> {
    //Check if parentID category in DB
    if (!(await this._checkCategory(parentID))) parentID = 0;
    //Insert category into DB
    let result = (await sqlite3.run(this._dbName, "INSERT_CATEGORY", [
      name,
      parentID,
    ])) as number | boolean;
    if (typeof result == "number") {
      Log.info(LogModules.poi, "INSERT -> " + this._dbName);
      return result;
    } else {
      return false;
    }
  }
  //----------------------------------------------------------------------------
  //CATEGORY: Update in DB
  //----------------------------------------------------------------------------
  async categoryUpdate(info: POICategory): Promise<boolean> {
    let result = true;
    if (!(await this._checkCategory(info.ID))) result = false;
    if (info.parentID != 0 && !(await this._checkCategory(info.parentID)))
      result = false;
    console.log(info);
    if (result) {
      return (await sqlite3.all(this._dbName, "UPDATE_CATEGORY", [
        info.name,
        info.parentID,
        info.ID,
      ])) as boolean;
    }
    return false;
  }
  //----------------------------------------------------------------------------
  //CATEGORY: Delete from DB
  //----------------------------------------------------------------------------
  async categoryDelete(
    ID: number,
    recursive: boolean = false
  ): Promise<boolean> {
    //Check if parentID category in DB
    if (!(await this._checkCategory(ID))) return false;
    //Get list of POI connected to category
    let poi = await this.get(0, ID);
    //if some POI inserted into category and recursive deleting is prohibited - exit
    if (poi && !recursive) return false;
    console.log("Category NO POI");
    //Get list of sub categories from BD
    let subCat = (await sqlite3.get(this._dbName, "SELECT_CATEGORY_BY_SUB", [
      ID,
    ])) as false | Array<POICategory>;
    //If some sub category inserted into category and recursive deleting is prohibited - exit
    if (subCat && !recursive) return false;
    //Start recursively delete POI
    if (poi) {
      poi.forEach(async (element) => {
        await this.delete(element.ID);
      });
    }
    //Start recursively delete SUB category
    if (subCat) {
      subCat.forEach(async (element) => {
        await this.categoryDelete(element.ID, true);
      });
    }
    if (!(await sqlite3.run(this._dbName, "DELETE_CATEGORY", [ID])))
      return false;
    return true;
  }

  async routeAddRoute(name: string = "New Route"): Promise<boolean> {
    let result = (await sqlite3.run(this._dbName, "INSERT_ROUTE", [
      name,
      0,
    ])) as boolean;
    if (!result) return false;
    Log.info(LogModules.poi, "INSERT -> " + this._dbName);
    await this.routeGetID();
    return true;
  }

  async routeAddPoint(lat: number, lng: number): Promise<boolean> {
    if (lat != 0 && lng != 0) {
      if (this._routeID) {
        if (
          await sqlite3.run(this._dbName, "INSERT_ROUTE_POINT", [
            this._routeID,
            lat,
            lng,
          ])
        ) {
          Log.info(LogModules.poi, "INSERT -> " + this._dbName);
          sendRoutePoint(lat, lng);
          return true;
        } else {
          return false;
        }
      } else {
        Log.warning(
          LogModules.poi,
          "RouteID is still empty. Skip adding route point ot DB."
        );
        return false;
      }
    } else {
      Log.warning(
        LogModules.poi,
        "One of coords is empty. Skip adding route point ot DB."
      );
      return false;
    }
  }

  async routeGetHistory(ID = 0): Promise<boolean | Array<GPSCoords>> {
    //Get current route ID
    let routeID = this._routeID;
    //If need to get history of route
    if (ID > 0) {
      routeID = ID;
    }
    //Exex SQL request
    let result = (await sqlite3.all(this._dbName, "SELECT_ROUTE_POINTS", [
      routeID,
    ])) as Array<GPSCoords>;
    //If have point for route in DB
    if (result.length > 0) {
      //Return
      return result;
    }
    //If have no points for route
    else {
      //Return
      return false;
    }
  }
  //----------------------------------------------------------------------------
  //Return current route ID
  //----------------------------------------------------------------------------
  async routeGetID(): Promise<number> {
    //Get last route ID in DB
    let result = (await sqlite3.get(this._dbName, "SELECT_LAST_ROUTE")) as {
      IDMAX: number;
    };
    if (result) {
      if (this._routeID < result.IDMAX) {
        this._routeID = result.IDMAX;
        Log.success(LogModules.poi, `RouteID was set to ${this._routeID}.`);
      } else {
        Log.warning(LogModules.poi, "Cant find new route ID in DB.");
      }
    }
    return this._routeID;
  }
  //----------------------------------------------------------------------------
  //Return routes list exclude current route
  //----------------------------------------------------------------------------
  async routeGetList(): Promise<boolean | Array<ROUTE>> {
    //Get routes list from DB
    let result = (await sqlite3.all(
      this._dbName,
      "SELECT_ALL_ROUTES"
    )) as Array<ROUTE>;
    //If have route list in DB
    if (result.length > 0) {
      //Remove last route from list as this route is stil record and already shown on map
      result.pop();
      //Return
      return result;
    } else {
      //Return
      return false;
    }
  }
}

export default new POIHandler();
