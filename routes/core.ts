//------------------------------------------------------------------------------
//Express
//------------------------------------------------------------------------------
import express from "express";
const router = express.Router();
router.use(express.json());
router.use(express.urlencoded({ extended: true }));
//------------------------------------------------------------------------------
//GPS service
//------------------------------------------------------------------------------
import GPS from "../gps/gps";
import { arrMapsInfo } from "../maps";
//------------------------------------------------------------------------------
//Statistics
//------------------------------------------------------------------------------
import stat from "../src/statistics";
//------------------------------------------------------------------------------
//Config
//------------------------------------------------------------------------------
import config, {
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
          message: "Cant read map ID from request.",
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
            message: "Map ID is missng in maps list. Pls check Map ID.",
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
    res.json({ result: "success", message: "Default config was updated." });
  } else {
    res.json({
      result: "warning",
      message: "Default config was updated, but some config saving error.",
    });
  }
});

router.get("/default", async (req, res) => {
  res.json({ result: "success", data: userConfig });
});

router.get("/maps", async (req, res) => {
  res.json({ result: "success", data: [...arrMapsInfo] });
});

router.post("/mode", async (req, res) => {
  let mode = DownloadMode.disable;

  console.log(req.body);
  if (req.body.mode in DownloadMode) {
    mode = req.body.mode;
  }

  config.network.state = mode;

  if (await setDefConfig("mode", mode)) {
    res.json({ result: "success", message: "Network mode was updated." });
  } else {
    res.json({
      result: "warning",
      message: "Network mode was changed, but some config saving error.",
    });
  }
});

export default router;
