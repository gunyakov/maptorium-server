const express = require('express');

const router = express.Router();
const fs = require("node:fs");

router.use(express.json());
router.use(express.urlencoded({ extended: true }));
//------------------------------------------------------------------------------
//GPS handler
//------------------------------------------------------------------------------
let GPS = require ("../gps/gps");
//------------------------------------------------------------------------------
//Geometry handler
//------------------------------------------------------------------------------
let POI = require("../src/poi");

const path = './config.default.json';
//------------------------------------------------------------------------------
//Worker handler
//------------------------------------------------------------------------------
let Downloader = require("../src/downloader.js");

router.get('/updates', async (req, res) => {
    //Create stat of server and send it to client
    let serverInfo = {
        memory: process.memoryUsage().heapTotal,
        fsRead: process.resourceUsage().fsRead,
        fsWrite: process.resourceUsage().fsWrite,
        cpu: process.resourceUsage().userCPUTime,
        download: stat.general.download,
        queue: stat.general.queue,
        size: stat.general.size
    }
    serverInfo.memory.toFixed(2);

    let response = {
        gps: await GPS.updated(),
        message: false,
        log: false,
        job: false,
        route: await POI.routeNewPoint(),
        stat: serverInfo
    }

    res.json({result: "success", data: response});
});
  
router.post('/default', async (req, res) => {
    if(typeof req.body.lat == "undefined" || typeof req.body.lng == "undefined" || typeof req.body.zoom == "undefined") {
        res.json({result: "warning", message: "Cant update default config. Data is empty"});
    }
    else {
        try {
            fs.writeFileSync(path, JSON.stringify(req.body))
            res.json({result: "success", message: "Default config was updated."});
        }
        catch (e) {
            res.json({result: "error", message: e.message});
        }
    }
});

router.get('/default', async (req, res) => {
    if(fs.existsSync(path)) {
        let data = fs.readFileSync(path);
        data = JSON.parse(data);
        data.mode = config.network.state;
        res.json({result: "success", data: data});
    }
    else {
        res.json({result: "info", data: {lat: 39, lng: 0, zoom: 5, map: "googlesat"}});
    }
});

router.get("/maps", async (req, res) => {
    let mapList = await Downloader.getMapList();
    res.json({result: "success", data: mapList});
});

router.post("/mode", async (req, res) => {
    let mode = "disable";

    switch (req.body.mode) {
        case "enable":
        case "force":
            mode = req.body.mode;
    }

    config.network.state = mode;
    
    try {
        fs.writeFileSync("./config.user.json", JSON.stringify(config));
        res.json({result: "success", message: "Network mode was updated."});
    }
    catch (e) {
        res.json({result: "error", message: e.message});
    }
    
});



module.exports = router;
  