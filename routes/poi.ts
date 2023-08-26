//------------------------------------------------------------------------------
//Express
//------------------------------------------------------------------------------
import * as express from 'express';
const router = express.Router();
router.use(express.json());
router.use(express.urlencoded({ extended: true }));
//------------------------------------------------------------------------------
//Logging service
//------------------------------------------------------------------------------
import Log from "../src/log";
import { LogModules } from '../src/enum';
//------------------------------------------------------------------------------
//Geometry handler
//------------------------------------------------------------------------------
import POI from "../src/poi";
import { POIInfo } from '../src/interface';
//------------------------------------------------------------------------------
//MARKS: Get category list
//------------------------------------------------------------------------------
router.get('/category', async (req, res) => {
  let categoryList = await POI.categoryList();
  if(categoryList) {
    res.json({result: "success", data: categoryList});
  }
  else {
    res.json({result: "error", message: "Category list empty."});
  }
});
//------------------------------------------------------------------------------
//MARKS: Add category to DB
//------------------------------------------------------------------------------
router.post("/category/add", async (req, res) => {
  let result = await POI.categoryAdd(req.body.name, req.body.parentID);
  if(result) {
    res.json({result: "success", message: "Category was inserted in DB."});
  }
  else {
    res.json({result: "error", message: "Some error to add Category to DB."});
  }
});
//------------------------------------------------------------------------------
//MARKS: Get info about mark
//------------------------------------------------------------------------------
router.get('/info/:poiID', async (req, res) => {
  let marks = await POI.get(parseInt(req.params.poiID)) as Array<POIInfo>;
  if(marks) {
    res.json({result: "success", data: marks[0]});
  }
  else {
    res.json({result: "error", message: "No data about mark in DB."});
  }
});
//------------------------------------------------------------------------------
//MARKS: Update info about mark
//------------------------------------------------------------------------------
router.post('/update', async (req, res) => {
  try {

    let data = req.body;

    if(typeof data === "object" && data !== null) {
      if((data.ID && data.color && data.width && data.fillColor && data.fillOpacity && data.categoryID) || data.points) { 

        let result = false;

        if(!data.points) {
          result = await POI.update(data);
        }
        else {
          result = await POI.update(data, true);
        }

        if (result) {
          res.json({result: "success", message: "POI was updated.", data: result});
        }
        else {
          res.json({result: "error", message: "Error to update POI."});
        }
      }

      else {
        res.json({result: "warning", message: "Empty data for POI. Skip update."});
      }
    }
  }
  catch (e) {
    if(e instanceof Error) {
      res.json({result: "error", message: e.message});
      Log.error(LogModules.main, "POI UPDATE REQUEST: " + e.message);
    }
    else {
      res.json({result: "error", message: "Unknown error occured."});
      Log.error(LogModules.main, "POI UPDATE REQUEST: Unknown error occured.");
    }
    
  }
});
//------------------------------------------------------------------------------
//MARKS: Get marks list of specific category
//------------------------------------------------------------------------------
router.get('/list/:categoryID', async (req, res) => {
  let poi = await POI.get(0, parseInt(req.params.categoryID));
  if(poi) {
    res.json({result: "success", data: poi});
  }
  else {
    res.json({result: "error", message: "Category is empty."});
  }
});
//------------------------------------------------------------------------------
//MARKS: Get full marks list
//------------------------------------------------------------------------------
router.get('/', async (req, res) => {
  let poi = await POI.get();
  if(poi) {
    res.json({result: "success", data: poi});
  }
  else {
    res.json({result: "error", message: "Category is empty."});
  }
});
//------------------------------------------------------------------------------
//MARKS: Delete from DB
//------------------------------------------------------------------------------
router.post('/delete', async (req, res) => {
  if(req.body.ID) {
    if(await POI.delete(req.body.ID)) {
      res.json({result: "success", message: "POI was deleted from map."});
    }
    else {
      res.json({result: "error", message: "Its error to delete POI from DB."});
    }
  }
  else{
    res.json({result: "warning", message: "PoiID is empty. Skip."});
  }
});
//------------------------------------------------------------------------------
//Polygone/Polyline: Add to DB
//------------------------------------------------------------------------------
router.post("/add", async (req, res) => {
  try {
    if(typeof req.body === "object" && req.body !== null) {
        let result = await POI.save(req.body);
        if(typeof result === "number" && result > 0) {
          res.json({result: "success", message: "POI was added to DB.", data: {ID: result}});
        }
        else {
          res.json({result: "error", message: "Error to add POI to DB."});
        }
    }
    else {
      res.json({result: "error", message: "Empty data sended to server."});
    }
  }
  catch (e) {
    if(e instanceof Error) {
      res.json({result: "error", message: e.message});
      Log.error(LogModules.main, "POI ADD REQUEST: " + e.message);
    }
    else {
      res.json({result: "error", message: "Unknown error occured."});
      Log.error(LogModules.main, "POI ADD REQUEST: Unknown error occured.");
    }
  }
  
});
//------------------------------------------------------------------------------
//Mark: Add to DB
//------------------------------------------------------------------------------
router.post("/addMark", async(req, res) => {
  if(typeof req.body.name != "string") {
    res.json({result: "warning", message: "Cant read Name value. Skip Add Mark."});
    return;
  }
  let categoryID = parseInt(req.body.categoryID);
  if(categoryID == 0) {
    res.json({result: "warning", message: "Cant read Category ID value. Skip Add Mark."});
    return;
  }
  let lat = parseInt(req.body.lat);
  let lng = parseInt(req.body.lng);
  if(lng == 0 && lat == 0) {
    res.json({result: "warning", message: "Cant read LNG or LAT value. Skip Add Mark."});
    return;
  }
  let result = await POI.addMark(req.body);
  if(result > 0) {
    res.json({result: "success", message: "Mark was added to DB.", data: {ID: result}});
  }
  else {
    res.json({result: "error", message: "Error to add Mark to DB."});
  }
});

export default router;
