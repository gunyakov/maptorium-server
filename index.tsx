#!/usr/bin/env node
//------------------------------------------------------------------------------
//Config
//------------------------------------------------------------------------------
import config, { ExecFolder } from "./config/index";
//------------------------------------------------------------------------------
//Express with socket IO
//------------------------------------------------------------------------------
let express = require("express");
const app = express();
const server = require("http").createServer(app);
const path = require("path");
//-----------------------------------------------------------------------------------------------
//SocketIO + init function
//-----------------------------------------------------------------------------------------------
import io from "./src/io";
io(server);
//------------------------------------------------------------------------------
//Logging service
//------------------------------------------------------------------------------
import Log from "./src/log";
import { LogModules } from "./src/enum";
//------------------------------------------------------------------------------
//Static files for browser map
//------------------------------------------------------------------------------
//app.use(express.static(path.join(ExecFolder, "..", "maptorium-leaflet")));
app.use(express.static(path.join(ExecFolder, "..", "maptorium-maplibre")));
app.post("/styles/bright.json", (req, res) => {
  res.sendFile(path.join(ExecFolder, "styles", "bright.json"));
});
app.post("/styles/osm.json", (req, res) => {
  res.sendFile(path.join(ExecFolder, "styles", "osm.json"));
});
//------------------------------------------------------------------------------
//  POI API Handler
//------------------------------------------------------------------------------
import poi_router from "./routes/poi";
app.use("/poi", poi_router);
//------------------------------------------------------------------------------
//  JOB API Handler
//------------------------------------------------------------------------------
import job_router from "./routes/job";
app.use("/job", job_router);
//------------------------------------------------------------------------------
//  TILE API Handler
//------------------------------------------------------------------------------
import tile_router from "./routes/tile";
app.use("/tile", tile_router);
//------------------------------------------------------------------------------
//  GPS API Handler
//------------------------------------------------------------------------------
import gps_router from "./routes/gps";
app.use("/gps", gps_router);
//------------------------------------------------------------------------------
//  CORE API Handler
//------------------------------------------------------------------------------
import core_router from "./routes/core";
app.use("/core", core_router);
//------------------------------------------------------------------------------
//  MAP API Handler
//------------------------------------------------------------------------------
import map_router from "./routes/map";
app.use("/map", map_router);
//----------------------------------------------------------------------------
//Open port for incoming requests
//----------------------------------------------------------------------------
server.listen(config.service.port, () => {
  Log.info(
    LogModules.main,
    "User UI -> http://127.0.0.1:" + config.service.port
  );
});
