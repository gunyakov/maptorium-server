//------------------------------------------------------------------------------
//Express
//------------------------------------------------------------------------------
import express from 'express';
const router = express.Router();
router.use(express.json());
router.use(express.urlencoded({ extended: true }));
//------------------------------------------------------------------------------
//GPS handler
//------------------------------------------------------------------------------
import GPS from "../gps/gps";
import { GPSCoords } from '../src/interface';
//------------------------------------------------------------------------------
//Geometry handler
//------------------------------------------------------------------------------
import POI from "../src/poi";
import { setDefConfig } from '../config';
//------------------------------------------------------------------------------
//HTTP Server: Request to get jobs list
//------------------------------------------------------------------------------
router.get("/now", async function(req, res) {
    res.json({
        result: "success", 
        data: {
            lat: GPS.lat,
            lng: GPS.lng,
            dir: GPS.dir
        }
    });
});

router.get("/route/:routeID", async function(req, res) {
    
    let routeData = await POI.routeGetHistory(parseInt(req.params.routeID)) as Array<GPSCoords>;

    if(routeData) {
        res.json({result: "success", data: routeData});
    }
    else {
        res.json({result: "error", message: "Cant find route data in DB."});
    }
});

router.get("/point", async function(req, res) {
    let point = await GPS.getLastPoint();
    if(point.lat !== 0 && point.lng !== 0) {
        res.json({result: "success", data: point});
    }
    else {
        res.json({result: "success", message: "Cant get last route point. Result is empty now."});
    }
});

router.get("/stoprecord", async function(req, res) {
    if(await GPS.stopRecord()) {
        setDefConfig("recordRoute", false);
        res.json({result: "success", message: "GPS disable record to DB."});
    }
    else {
        res.json({result: "error", message: "Error to disable GPS record to DB."});
    }
});

router.get("/startrecord", async function(req, res) {
    if(await GPS.startRecord()) {
        setDefConfig("recordRoute", true);
        res.json({result: "success", message: "GPS enable record to DB."});
    }
    else {
        res.json({result: "error", message: "Error to enable GPS record to DB."});
    }
});

router.post("/routenew", async function(req, res) {
    if(req.body.name?.length > 4) {
        if(await POI.routeAddRoute(req.body.name)) {
            res.json({result: "success", message: "New route started."});
        }
        else {
            res.json({result: "error", message: "Error to start new route."});
        }
    }
    else res.json({result: "error", message: "Route name is empty or less than 4 simbols."});
});

router.get("/routelist", async function(req, res) {
    let list = await POI.routeGetList();
    if(list) {
        res.json({result: "success", data: list});
    }
    else {
        res.json({result: "error", message: "Routes list is empty."});
    }
});

router.post("/sample", async function(req, res) {
    
    let time = parseInt(req.body.time);

    if(time) {
        if(await GPS.sampleRate(time)) {
            setDefConfig('gpsSampleTime', time);
            res.json({result: 'info', message: 'GPS: Sample rate changed.'});
          }
          else {
            res.json({result: 'error', message: 'GPS: Sample rate changing error.'});
          }
    }
    else res.json({result: "warning", message: "Cant read time value. Skip."});
});

router.get("/start", async function(req, res) {
    if(await GPS.start()) {
        res.json({result: "success", message: "GPS Service started."});
    }
    else {
        res.json({result: "error", message: "Error to start GPS Service,"});
    }
});

router.get("/stop", async function(req, res) {
    if(await GPS.stop()) {
        res.json({result: "success", message: "GPS Service stoped."});
    }
    else {
        res.json({result: "error", message: "Error to stop GPS Service,"});
    }
});

export default router;