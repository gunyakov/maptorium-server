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
    await setDefConfig(key, req.body[key], false);
    //If require to change GPS TCP/IP Server
    if (key == "gpsServer") {
      //Set config for GPS and make auto reconnect
      GPS.config(req.body[key].host, req.body[key].port, true);
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
