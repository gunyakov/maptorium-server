//------------------------------------------------------------------------------
//Express
//------------------------------------------------------------------------------
import * as express from 'express';
const router = express.Router();
router.use(express.json());
router.use(express.urlencoded({ extended: true }));
//------------------------------------------------------------------------------
//Geometry handler
//------------------------------------------------------------------------------
import POI from "../src/poi";
import { POIInfo } from '../src/interface';
import { POIType } from "../src/enum";
//------------------------------------------------------------------------------
//Logging service
//------------------------------------------------------------------------------
import Log from "../src/log";
import { LogModules } from '../src/enum';
//------------------------------------------------------------------------------
//Cached map service
//------------------------------------------------------------------------------
import { abortTileChecking, getCachedMapByBBOX, getCachedMapByPOI } from "../helpers/cachedMaps";
import JobManager from "../src/jobmanager";
//------------------------------------------------------------------------------
//Map Handler checker
//------------------------------------------------------------------------------
import { checkMapHandler } from '../maps';
//------------------------------------------------------------------------------
//Express Router
//------------------------------------------------------------------------------
router.post("/cached/poi", async(req, res) => {

    let poiID = parseInt(req.body.poiID);

    let zoom = parseInt(req.body.zoom);

    let map = req.body.map;

    if(poiID < 1) {
        res.json({result: "warning", message: `Cant read POI ID. Abort tile calculation.`});
        return;
    }

    if(zoom < 4 || zoom > 20) {
        res.json({result: "warning", message: `Error to read zoom value. Abort tile calculation.`});
        return;
    }

    if(!checkMapHandler(map)) {
        res.json({result: "warning", message: `Cant get map handler by map ID. Abort tile calculation.`});
        return;
    }
    if(poiID < 1) {
        res.json({result: "warning", message: `Cant read POI ID. Abort tile calculation.`});
        return;
    }
    let poi = await POI.get(poiID) as Array<POIInfo>;
    //If POI present in DB
    if(!poi) {
        Log.warning(LogModules.worker, `Cant find POI ${poiID} in DB. Abort tile calculation.`);
        res.json({result: "warning", message: `Cant find POI ${poiID} in DB. Abort tile calculation.`});
        return;
    }
    let poiInfo = poi[0];
    //If POI is polygon
    if(poiInfo.type != POIType.polygon) {
        Log.warning(LogModules.worker, "Abort tiles calculation. POI type isnt Polygon.");
        res.json({result: "warning", message: `Abort tiles calculation. POI type isnt Polygon.`});
        return;
    }
    //Wait until abort tile cheking
    await abortTileChecking();
    //Start map cache checking
    getCachedMapByPOI(poiID, zoom, map);
    res.json({result: "success", message: "Cached map building started. Wait until result."});
});

router.post("/cached/bbox", async(req, res) => {

    let zoom = parseInt(req.body.zoom);

    let map = req.body.map;

    let bbox = req.body.bbox as Array<number>;

    if(bbox[0] < -180) bbox[0] = -180;
    if(bbox[0] > 180) bbox[0] = 180;
    if(bbox[2] < -180) bbox[2] = -180;
    if(bbox[2] > 180) bbox[2] = 180;

    if(bbox[1] < -90) bbox[1] = -90;
    if(bbox[1] > 90) bbox[1] = 90;
    if(bbox[3] < -90) bbox[2] = -90;
    if(bbox[3] > 90) bbox[2] = 90;

    if(zoom < 4 || zoom > 20) {
        res.json({result: "warning", message: `Error to read zoom value. Abort tile calculation.`});
        return;
    }

    if(!checkMapHandler(map)) {
        res.json({result: "warning", message: `Cant get map handler by map ID. Abort tile calculation.`});
        return;
    }
    //Wait until abort tile cheking
    await abortTileChecking();
    //Start map cache checking
    getCachedMapByBBOX(bbox, zoom, map);
    res.json({result: "success", message: "Cached map building started. Wait until result."});
});

router.get("/cached/cancel", async(req, res) => {
    //Wait until abort tile cheking
    await abortTileChecking();
    res.json({result: "success", message: "Cached map building canceled."});
});

router.get("/cached/clean", async(req, res) => {
    JobManager.setTileCachedMap("empty", 0, {});
    res.json({result: "success", message: "Tile cached map was cleaned from memory."});
});

export default router;
