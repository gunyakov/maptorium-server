//------------------------------------------------------------------------------
//Express
//------------------------------------------------------------------------------
import * as express from "express";
const router = express.Router();
router.use(express.json());
router.use(express.urlencoded({ extended: true }));
//------------------------------------------------------------------------------
//Logging service
//------------------------------------------------------------------------------
import Log from "../src/log";
import { LogModules } from "../src/enum";
//------------------------------------------------------------------------------
//Geometry handler
//------------------------------------------------------------------------------
import POI from "../src/poi";
//------------------------------------------------------------------------------
//MARKS: Get categories list
//------------------------------------------------------------------------------
router.get("/category", async (req, res) => {
  let categoryList = await POI.categoryList();
  if (categoryList) {
    res.json({ result: "success", data: categoryList });
  } else {
    res.json({ result: "error", message: "request.poi.category.list_empty" });
  }
});
//------------------------------------------------------------------------------
//MARKS: Get category info
//------------------------------------------------------------------------------
router.get("/category/:categoryID", async (req, res) => {
  let categoryList = await POI.categoryList(parseInt(req.params.categoryID));
  if (categoryList) {
    res.json({ result: "success", data: categoryList[0] });
  } else {
    res.json({ result: "error", message: "request.poi.category.list_empty" });
  }
});
//------------------------------------------------------------------------------
//MARKS: Add category to DB
//------------------------------------------------------------------------------
router.post("/category/add", async (req, res) => {
  let result = await POI.categoryAdd(req.body.name, req.body.parentID);
  if (typeof result == "number") {
    res.json({
      result: "success",
      message: "request.poi.category.add.success",
      data: { ID: result },
    });
  } else {
    res.json({ result: "error", message: "request.poi.category.add.failed" });
  }
});
//------------------------------------------------------------------------------
//MARKS: Update category in DB
//------------------------------------------------------------------------------
router.post("/category/update", async (req, res) => {
  let result = await POI.categoryUpdate(req.body);
  if (result) {
    res.json({
      result: "success",
      message: "request.poi.category.update.success",
    });
  } else {
    res.json({
      result: "error",
      message: "request.poi.category.update.failed",
    });
  }
});
//------------------------------------------------------------------------------
//MARKS: Delete category from DB
//------------------------------------------------------------------------------
router.post("/category/delete", async (req, res) => {
  let result = await POI.categoryDelete(req.body.ID);
  if (result) {
    res.json({
      result: "success",
      message: "request.poi.category.delete.success",
    });
  } else {
    res.json({
      result: "error",
      message: "request.poi.category.delete.failed",
    });
  }
});
//------------------------------------------------------------------------------
//MARKS: Get info about mark
//------------------------------------------------------------------------------
router.get("/info/:poiID", async (req, res) => {
  let mark = await POI.get(parseInt(req.params.poiID), 0, 1, true);
  if (mark) {
    res.json({ result: "success", data: mark });
  } else {
    res.json({ result: "error", message: "request.poi.info.not_found" });
  }
});
//------------------------------------------------------------------------------
//MARKS: Update info about mark
//------------------------------------------------------------------------------
router.post("/update", async (req, res) => {
  try {
    let data = req.body;

    if (typeof data === "object" && data !== null) {
      if (
        (data.ID &&
          data.color &&
          data.width &&
          data.fillColor &&
          data.fillOpacity &&
          data.categoryID) ||
        data.points
      ) {
        let result = false;

        if (!data.points) {
          result = await POI.update(data);
        } else {
          result = await POI.update(data, true);
        }

        if (result) {
          res.json({
            result: "success",
            message: "request.poi.update.success",
            data: result,
          });
        } else {
          res.json({ result: "error", message: "request.poi.update.failed" });
        }
      } else {
        res.json({
          result: "warning",
          message: "request.poi.update.empty_data",
        });
      }
    }
  } catch (e) {
    if (e instanceof Error) {
      res.json({ result: "error", message: "request.poi.update.exception" });
      Log.error(LogModules.main, "POI UPDATE REQUEST: " + e.message);
    } else {
      res.json({
        result: "error",
        message: "request.poi.update.exception_unknown",
      });
      Log.error(LogModules.main, "POI UPDATE REQUEST: Unknown error occured.");
    }
  }
});
//------------------------------------------------------------------------------
//MARKS: Get marks list of specific category
//------------------------------------------------------------------------------
router.get("/list/:categoryID", async (req, res) => {
  let poi = await POI.get(0, parseInt(req.params.categoryID), 1, true);
  if (poi) {
    res.json({ result: "success", data: poi });
  } else {
    res.json({ result: "error", message: "request.poi.list.category_empty" });
  }
});
//------------------------------------------------------------------------------
//MARKS: Get full marks list
//------------------------------------------------------------------------------
router.get("/", async (req, res) => {
  let poi = await POI.get(0, 0, 1, true);
  if (poi) {
    res.json({ result: "success", data: poi });
  } else {
    res.json({ result: "error", message: "request.poi.list.category_empty" });
  }
});
//------------------------------------------------------------------------------
//MARKS: Delete from DB
//------------------------------------------------------------------------------
router.post("/delete", async (req, res) => {
  if (req.body.ID) {
    if (await POI.delete(req.body.ID)) {
      res.json({ result: "success", message: "request.poi.delete.success" });
    } else {
      res.json({
        result: "error",
        message: "request.poi.delete.failed",
      });
    }
  } else {
    res.json({ result: "warning", message: "request.poi.delete.id_empty" });
  }
});
//------------------------------------------------------------------------------
//Polygone/Polyline: Add to DB
//------------------------------------------------------------------------------
router.post("/add", async (req, res) => {
  try {
    if (typeof req.body === "object" && req.body !== null) {
      let result = await POI.save(req.body);
      if (typeof result === "number" && result > 0) {
        res.json({
          result: "success",
          message: "request.poi.add.success",
          data: { ID: result },
        });
      } else {
        res.json({ result: "error", message: "request.poi.add.failed" });
      }
    } else {
      res.json({ result: "error", message: "request.poi.add.empty_data" });
    }
  } catch (e) {
    if (e instanceof Error) {
      res.json({ result: "error", message: "request.poi.add.exception" });
      Log.error(LogModules.main, "POI ADD REQUEST: " + e.message);
    } else {
      res.json({
        result: "error",
        message: "request.poi.add.exception_unknown",
      });
      Log.error(LogModules.main, "POI ADD REQUEST: Unknown error occured.");
    }
  }
});
//------------------------------------------------------------------------------
//Mark: Add to DB
//------------------------------------------------------------------------------
router.post("/addMark", async (req, res) => {
  if (typeof req.body.name != "string") {
    res.json({
      result: "warning",
      message: "request.poi.mark_add.name_invalid",
    });
    return;
  }
  let categoryID = parseInt(req.body.categoryID);
  if (categoryID < 0) {
    res.json({
      result: "warning",
      message: "request.poi.mark_add.category_id_invalid",
    });
    return;
  }
  let lat = parseInt(req.body.lat);
  let lng = parseInt(req.body.lng);
  if (lng == 0 && lat == 0) {
    res.json({
      result: "warning",
      message: "request.poi.mark_add.coords_invalid",
    });
    return;
  }
  let result = await POI.addMark(req.body);
  if (result > 0) {
    res.json({
      result: "success",
      message: "request.poi.mark_add.success",
      data: { ID: result },
    });
  } else {
    res.json({ result: "error", message: "request.poi.mark_add.failed" });
  }
});

export default router;
