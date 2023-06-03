const express = require('express');
const router = express.Router();

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

const GPS = require("../gps/gps");
const POI = require("../src/poi");

//------------------------------------------------------------------------------
//HTTP Server: Request to get jobs list
//------------------------------------------------------------------------------
router.get("/now", async function(req, res) {
    res.json({
        result: "success", 
        data: {
            lat: GPS.lat,
            lon: GPS.lng
        }
    });
});

router.post("/route", async function(req, res) {
    let routeData = await POI.routeGetHistory(req.body.routeID);
    let result = { result: "error" };

    if(routeData) {
        result = {
            result: "success",
            data: routeData,
            message: "Get route data from server."
        }
    }
    else {
        result = {
            message: "Cant find route data in DB."
        }
    }
    res.json(result);
});

router.get("/point", async function(req, res) {
    let result = { result: "error" };
    let point = await POI.getLastPoint();
    if(point.lat !== 0 && point.lng !== 0) {
        result.result = "success";
        result['data'] = point;
    }
    else {
        result['message'] = "Cant get last route point. Result is empty now.";
    }
    res.json(result);
});

router.get("/stoprecord", async function(req, res) {
    GPS.stopRecord();
    res.json({result: "success", message: "GPS disable record to DB."});
});

router.get("/startrecord", async function(req, res) {
    GPS.startRecord();
    res.json({result: "success", message: "GPS disable record to DB."});
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
});

router.get("/routelist", async function(req, res) {
    let list = await POI.routeGetList();
    res.json({result: "success", data: list});
});

module.exports = router;