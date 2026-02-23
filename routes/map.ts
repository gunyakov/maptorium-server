//------------------------------------------------------------------------------
//Express
//------------------------------------------------------------------------------
import * as express from "express";
const router = express.Router();
router.use(express.json());
router.use(express.urlencoded({ extended: true }));
//------------------------------------------------------------------------------
//Geometry handler
//------------------------------------------------------------------------------
import { validatePolygon } from "../helpers/validate";
//------------------------------------------------------------------------------
//Cached map service
//------------------------------------------------------------------------------
import {
  abortTileChecking,
  getCachedMapByBBOX,
  getCachedMapByPolygon,
} from "../helpers/cachedMaps";
import JobManager from "../src/jobmanager";
//------------------------------------------------------------------------------
//Map Handler checker
//------------------------------------------------------------------------------
import { checkMapHandler, getMapHandler } from "../maps";
//------------------------------------------------------------------------------
//Express Router
//------------------------------------------------------------------------------
router.post("/cached/poi", async (req, res) => {
  const zoom = parseInt(req.body.zoom);
  const map = req.body.map;
  const polygon = req.body.polygon;

  if (!Number.isInteger(zoom) || zoom < 4 || zoom > 20) {
    res.json({ result: "warning", message: "request.map.cached.zoom_invalid" });
    return;
  }

  if (!validatePolygon(polygon)) {
    res.json({
      result: "warning",
      message: "request.map.cached.polygon_invalid",
    });
    return;
  }

  if (!checkMapHandler(map)) {
    res.json({
      result: "warning",
      message: "request.map.cached.map_handler_missing",
    });
    return;
  }
  //Wait until abort tile cheking
  await abortTileChecking();
  //Start map cache checking
  getCachedMapByPolygon(
    polygon,
    zoom,
    map,
    getMapHandler(map).getInfo().tileSize,
  );
  res.json({ result: "success", message: "request.map.cached.build_started" });
});

router.post("/cached/bbox", async (req, res) => {
  let zoom = parseInt(req.body.zoom);

  let map = req.body.map;

  let bbox = req.body.bbox as Array<number>;

  if (bbox[0] < -180) bbox[0] = -180;
  if (bbox[0] > 180) bbox[0] = 180;
  if (bbox[2] < -180) bbox[2] = -180;
  if (bbox[2] > 180) bbox[2] = 180;

  if (bbox[1] < -90) bbox[1] = -90;
  if (bbox[1] > 90) bbox[1] = 90;
  if (bbox[3] < -90) bbox[2] = -90;
  if (bbox[3] > 90) bbox[2] = 90;

  if (zoom < 4 || zoom > 20) {
    res.json({ result: "warning", message: "request.map.cached.zoom_invalid" });
    return;
  }

  if (!checkMapHandler(map)) {
    res.json({
      result: "warning",
      message: "request.map.cached.map_handler_missing",
    });
    return;
  }
  //Wait until abort tile cheking
  await abortTileChecking();
  //Start map cache checking
  getCachedMapByBBOX(bbox, zoom, map, getMapHandler(map).getInfo().tileSize);
  res.json({ result: "success", message: "request.map.cached.build_started" });
});

router.get("/cached/cancel", async (req, res) => {
  //Wait until abort tile cheking
  await abortTileChecking();
  res.json({ result: "success", message: "request.map.cached.build_canceled" });
});

router.get("/cached/clean", async (req, res) => {
  JobManager.setTileCachedMap("empty", 0, {});
  res.json({ result: "success", message: "request.map.cached.cleaned" });
});

export default router;
