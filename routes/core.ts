//------------------------------------------------------------------------------
//Express
//------------------------------------------------------------------------------
import express from "express";
const router = express.Router();
router.use(express.json());
router.use(express.urlencoded({ extended: true }));
import { existsSync, statSync } from "node:fs";
import path from "node:path";
//------------------------------------------------------------------------------
//GPS service
//------------------------------------------------------------------------------
import GPS from "../gps/gps";
import { getMapsInfo, setMapStoragePath } from "../maps";
//------------------------------------------------------------------------------
//Statistics
//------------------------------------------------------------------------------
import stat from "../src/statistics";
//------------------------------------------------------------------------------
//Config
//------------------------------------------------------------------------------
import {
  config,
  saveDefConfig,
  setDefConfig,
  userConfig,
} from "../config/index";

import { UserConfig } from "../src/interface";

import { DownloadMode } from "../src/enum";

import { checkMapHandler, getMapHandler } from "../maps";

router.get("/updates", async (req, res) => {
  //Create stat of server and send it to client
  let serverInfo = {
    memory: process.memoryUsage().heapTotal,
    fsRead: process.resourceUsage().fsRead,
    fsWrite: process.resourceUsage().fsWrite,
    cpu: process.resourceUsage().userCPUTime,
    download: stat.download,
    queue: stat.queue,
    size: stat.size,
  };
  serverInfo.memory.toFixed(2);

  let response = {
    stat: serverInfo,
  };

  res.json({ result: "success", data: response });
});

router.post("/default", async (req, res) => {
  let keys = Object.keys(req.body) as Array<keyof UserConfig>;
  for (let i = 0; i < keys.length; i++) {
    let key = keys[i] as keyof UserConfig;

    //If require to change GPS TCP/IP Server
    if (key == "gpsServer") {
      //Set config for GPS and make auto reconnect
      GPS.config(req.body[key]);
    }
    //If need add api key
    if (key == "apiKeys") {
      //Get API keys list
      let apiKeys = userConfig.apiKeys;
      //Get all maps ID keys from request
      const mapID = Object.keys(req.body[key]);
      //If maps ID list is empty
      if (mapID.length == 0)
        //Return error
        return res.json({
          result: "error",
          message: "request.core.default.api_keys.map_id_read_failed",
        });
      //If maps ID list present
      for (let i = 0; i < mapID.length; i++) {
        //If map handler is present in list
        if (checkMapHandler(mapID[i])) {
          //Set api key for map handler
          getMapHandler(mapID[i]).setApiKey(req.body[key][mapID[i]]);
        }
        //If map handler is missing in list
        else {
          //Return error
          return res.json({
            result: "error",
            message: "request.core.default.api_keys.map_id_missing",
          });
        }
      }
      //Merge exist list with received
      apiKeys = { ...apiKeys, ...req.body[key] };
      //Save api keys
      await setDefConfig(key, apiKeys, false);
    }
    //If need replace not api keys config
    else {
      //Just replace as it
      await setDefConfig(key, req.body[key], false);
    }
  }
  if (await saveDefConfig()) {
    res.json({ result: "success", message: "request.core.default.updated" });
  } else {
    res.json({
      result: "warning",
      message: "request.core.default.updated_with_save_warning",
    });
  }
});

router.get("/default", async (req, res) => {
  res.json({ result: "success", data: userConfig });
});

router.get("/maps", async (req, res) => {
  res.json({ result: "success", data: [...getMapsInfo()] });
});

router.post("/map-storage", async (req, res) => {
  const mapID = String(req.body?.mapID || "").trim();
  const storagePath = String(req.body?.path || "").trim();

  if (!mapID) {
    return res.json({
      result: "error",
      message: "request.core.map_storage.map_id_missing",
    });
  }

  if (!storagePath) {
    return res.json({
      result: "error",
      message: "request.core.map_storage.path_missing",
    });
  }

  const resolvedPath = path.resolve(storagePath);
  if (!existsSync(resolvedPath) || !statSync(resolvedPath).isDirectory()) {
    return res.json({
      result: "error",
      message: "request.core.map_storage.path_invalid",
    });
  }

  if (!(await setMapStoragePath(mapID, resolvedPath, true))) {
    return res.json({
      result: "warning",
      message: "request.core.map_storage.update_failed",
    });
  }

  return res.json({
    result: "success",
    message: "request.core.map_storage.updated",
  });
});

router.post("/mode", async (req, res) => {
  let mode = DownloadMode.disable;

  console.log(req.body);
  if (req.body.mode in DownloadMode) {
    mode = req.body.mode;
  }

  config.network.state = mode;

  if (await setDefConfig("mode", mode)) {
    res.json({ result: "success", message: "request.core.mode.updated" });
  } else {
    res.json({
      result: "warning",
      message: "request.core.mode.updated_with_save_warning",
    });
  }
});

export default router;
