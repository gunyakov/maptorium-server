//------------------------------------------------------------------------------
//Logging service
//------------------------------------------------------------------------------
let Log = require("../src/log.js");
//------------------------------------------------------------------------------
//DB handler
//------------------------------------------------------------------------------
let sqlite3 = require('../DB/sqlite3-promise.js');
//------------------------------------------------------------------------------
//Checker tiles inside polygon or not
//------------------------------------------------------------------------------
let pointInPolygon = require('point-in-polygon');
//------------------------------------------------------------------------------
//General POI storage
//------------------------------------------------------------------------------
class POI {

  _newRoutePoint = false;

  _lastPoint = { lat:0, lon: 0};

  constructor(){
    this._dbName = process.cwd() + "/POI.db3";
    this.time = Math.floor(Date.now() / 1000);
    this.routeID = false;
    this.cachedMap = {
      ID: 0,
      tileList: [],
      zoom: 0
    }
    this.routeGetID();
  }


  async get(ID = 0, categoryID = 0) {
    let result = false;
    if(ID == 0 && categoryID == 0) {
      result = await sqlite3.all(this._dbName, "SELECT_ALL_POI", []);
    }
    else {
      if(ID > 0 && categoryID == 0) {
        result = await sqlite3.all(this._dbName, "SELECT_POI_BY_ID", [ID]);
      }
      if(ID == 0 && categoryID > 0) {
        result = await sqlite3.all(this._dbName, "SELECT_POI_BY_CATEGORY", [categoryID]);
      }
      if(ID > 0 && categoryID > 0) {
        result = await sqlite3.all(this._dbName, "SELECT_POI_BY_BOTH", [ID, categoryID]);
      }
    }
    if(result.length > 0) {
      let points = false;
      let responce = [];
      for(let i = 0; i < result.length; i++) {
        points = await sqlite3.all(this._dbName, "SELECT_POINTS_BY_POI", [result[i]['ID']]);
        if(points && points.length > 0) {
          let poi = result[i];
          poi.points = points;
          responce.push(poi);
        }
      }
      return responce;
    }
    else {
      return false;
    }
  }

  async save(poi) {

    let SQLValues = ['', poi.type, poi.color, poi.fillColor, poi.fillOpacity, poi.zoom, 0, 0, 0, 0];

    let lastID = await sqlite3.run(this._dbName, "INSERT_POI", SQLValues);

    if(lastID > 0) {
      if(poi.bounds) {
        SQLValues = [poi.bounds._southWest.x, poi.bounds._southWest.y, poi.bounds._northEast.x, poi.bounds._northEast.y, lastID];
        await sqlite3.run(this._dbName, "UPDATE_POI", SQLValues);
      }
      await this.savePoints(lastID, poi.type, poi.coords);
      return lastID;
    }
    else {
      return false;
    }
  }

  async savePoints(ID, type, coords) {
    let result = true;
    switch(type) {
      case "Polygon":
        coords = coords[0];
      case "Line":
        for(let i = 0; i < coords.length; i++) {
          result = await sqlite3.run(this._dbName, "INSERT_POINTS", [ID, Math.round(coords[i]['x']), Math.round(coords[i]['y'])]);
        }
        break;
      case "Marker":
        result = await sqlite3.run(this._dbName, "INSERT_POINTS", [ID, Math.round(coords['x']), Math.round(coords['y'])]);
        break;
    }
    return result;
  }

  async delete(ID, onlyPoints = false) {
    //If not update of POI
    if(!onlyPoints) {
      //Delete entry of POI
      await sqlite3.run(this._dbName, "DELETE_POI_BY_ID", [ID]);
    }
    //Delete points of POI
    await sqlite3.run(this._dbName, "DELETE_POINTS_BY_POI", [ID]);
    //Exit
    return;
  }
  //----------------------------------------------------------------------------
  //Update POI style/info/points in DB
  //----------------------------------------------------------------------------
  async update(data, onlyPoints = false) {
    let SQLValues = [];
    let result = true;
    if(!onlyPoints) {
      //Update style of POI
      SQLValues = [data.categoryID, data.name, data.width, data.fillOpacity, data.color, data.fillColor, parseInt(data.markID)];
      result = await sqlite3.run(this._dbName, "UPDATE_POI_STYLE", SQLValues);
    }
    //Update bounds of POI if present
    if(data.bounds) {
      SQLValues = [Math.round(data.bounds._southWest.x), Math.round(data.bounds._southWest.y), Math.round(data.bounds._northEast.x), Math.round(data.bounds._northEast.y), data.zoom, data.markID];
      result = await sqlite3.run(this._dbName, "UPDATE_POI_BOUNDS", SQLValues);
    }
    if(data.coords) {
      await sqlite3.run(this._dbName, "DELETE_POINTS_BY_POI", [data.markID]);
      result = await this.savePoints(data.markID, data.type, data.coords);
    }
    //Exit
    return result;
  }
  //----------------------------------------------------------------------------
  //CATEGORY: Get list of
  //----------------------------------------------------------------------------
  async categoryList() {
    let categoryList = await sqlite3.all(this._dbName, "SELECT_CATEGORY_LIST");
    if(categoryList) {
      return categoryList;
    }
    else {
      return false;
    }
  }
  //----------------------------------------------------------------------------
  //CATEGORY: Add to DB
  //----------------------------------------------------------------------------
  async categoryAdd(name, parentID = 0) {
    //Check if parentID category in DB
    if (parentID) {
      let categoryList = await sqlite3.all(this._dbName, "SELECT_CATEGORY_BY_ID", [parentID]);
      if (!categoryList) {
        return false;
      }
    }
    else {
      parentID = 0;
    }
    let result = await sqlite3.run(this._dbName, "INSERT_CATEGORY", [name, parentID]);
    if(result) {
      Log.info("POI", "INSERT -> " + this._dbName);
      return true;
    }
    else {
      return false;
    }
  }

  async routeAddRoute(name = "New Route") {
    await sqlite3.run(this._dbName, "INSERT_ROUTE", [name, 0]);
    await this.routeGetID();
    Log.info("POI", "INSERT -> " + this._dbName);
    return true;
  }

  async routeAddPoint(lat, lon) {
    if(lat != 0 && lon != 0) {
      if(this.routeID) {
        await sqlite3.run(this._dbName, "INSERT_ROUTE_POINT", [this.routeID, lat, lon]);
        this._newRoutePoint = true;
        this._lastPoint = { lat: lat, lon: lon };
        Log.info("POI", "INSERT -> " + this._dbName);
      }
      else {
        Log.warning("POI", "RouteID is still empty. Skip adding route point ot DB.");
      }
    }
    else {
      Log.warning("POI", "One of coords is empty. Skip adding route point ot DB.");
    }
  }

  async routeGetHistory(ID = 0) {
    //Get current route ID
    let routeID = this.routeID;
    //If need to get history of route
    if(ID > 0) {
      routeID = ID;
    }
    //Exex SQL request
    let result = await sqlite3.all(this._dbName, "SELECT_ROUTE_POINTS", [routeID]);
    //If have point for route in DB
    if(result.length > 0) {
      //Form data
      let response = {
        ID: routeID,
        points: result
      }
      //Return
      return response;
    }
    //If have no points for route
    else {
      //Return
      return false;
    }
  }

  async routeGetID() {
    //Get last route ID in DB
    let result = await sqlite3.all(this._dbName, "SELECT_LAST_ROUTE");
    if(result.length > 0) {
      if(this.routeID < result[0]['IDMAX']) {
        this.routeID = result[0]['IDMAX'];
        Log.success("POI", `RouteID was set to ${this.routeID}.`);
      }
      else {
        Log.warning("POI", "Cant find new route ID in DB.");
      }
    }
  }

  async routeGetList() {
    //Get routes list from DB
    let result = await sqlite3.all(this._dbName, "SELECT_ALL_ROUTES");
    //If have route list in DB
    if(result.length > 0) {
      //Remove last route from list as this route is stil record and already shown on map
      result.pop();
      //Return
      return result;
    }
    else {
      //Return
      return false;
    }
  }
  //----------------------------------------------------------------------------
  //Return if new point was inserted to route from last checking
  //----------------------------------------------------------------------------
  async routeNewPoint() {
    return this._newRoutePoint;
  }
  //----------------------------------------------------------------------------
  //Return if new point was inserted to route from last checking
  //----------------------------------------------------------------------------
  async getLastPoint() {
    this._newRoutePoint = false;
    let point = this._lastPoint;
    point['dir'] = 0;
    this._lastPoint = { lat: 0, lon: 0 };
    return point;
  }
  //----------------------------------------------------------------------------
  //Generate tiles list for job list
  //----------------------------------------------------------------------------
  async tileList(ID, requiredZoom, map = "google") {
    Log.success("MAIN", `Start calculation tiles list for Polygon ${ID} and Zoom ${requiredZoom}`);
    let poi = await this.get(parseInt(ID));
    if(poi) {
      poi = poi[0];
      if(poi.type == "Polygon") {
        let arrJobTilesList = [];
        let zoom = poi.zoom;
        let scaleFactor = requiredZoom - zoom;
        if(requiredZoom - zoom >= 0) {
          scaleFactor = Math.pow(2, scaleFactor);
        }
        else {
          Log.warning("MAIN", "Abort tiles calculation. Required Zoom is same as selected zoom.");
          return false;
        }
        //Init empty polygon coords list
        let polygon = [];
        //For all points in polygon
        for(let i = 0; i < poi.points.length; i++) {
          //Form polygon array
          polygon.push([Math.round(poi.points[i]['x'] * scaleFactor), Math.round(poi.points[i]['y'] * scaleFactor)]);
        }
        var startX = Math.floor(poi.SWx * scaleFactor / 256);
      	var startY = Math.floor(poi.NEy * scaleFactor / 256);
      	var stopX = Math.ceil(poi.NEx * scaleFactor / 256);
      	var stopY = Math.ceil(poi.SWy * scaleFactor / 256);
        //Generate tiles list by polygon bounds
        for(let x = startX; x < stopX; x++) {
          for(let y = startY; y < stopY; y++) {
            //Init tile inside polygon state
            let tileInside = false;
            //Check all 4 corners to be inside polygon
            if(pointInPolygon([ x * 256, y * 256 ], polygon)) {
              //Set tile state inside
              tileInside = true;
            }
            if(pointInPolygon([ x * 256 + 256, y * 256 ], polygon)) {
              //Set tile state inside
              tileInside = true;
            }
            if(pointInPolygon([ x * 256 + 256, y * 256 + 256], polygon)) {
              //Set tile state inside
              tileInside = true;
            }
            if(pointInPolygon([ x * 256, y * 256 + 256], polygon)) {
              //Set tile state inside
              tileInside = true;
            }
            if(tileInside) {
              //Добавляем в список координаты тайлов
              arrJobTilesList.push({
                x: parseInt(x),
                y: parseInt(y),
                z: parseInt(requiredZoom),
                response: false,
                map: map
              });
            }

          }
        }
        Log.success("MAIN", `Calculation of tiles list is finished. Total ${arrJobTilesList.length} tiles.`);
        //Return tiles job list
        return arrJobTilesList;
      }
      else {
        Log.warning("MAIN", "Abort tiles calculation. POI type isnt Polygon.");
        return false;
      }
    }
  }
}

module.exports = new POI();
