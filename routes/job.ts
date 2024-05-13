//------------------------------------------------------------------------------
//Express
//------------------------------------------------------------------------------
import * as express from "express";
const router = express.Router();
router.use(express.json());
router.use(express.urlencoded({ extended: true }));
//------------------------------------------------------------------------------
//Worker handler
//------------------------------------------------------------------------------
import JobManager from "../src/jobmanager";
import POI from "../src/poi";
//------------------------------------------------------------------------------
//Config
//------------------------------------------------------------------------------
import config from "../config/index";
import { GenJobInfo, iJobConfig } from "../src/interface";
import { checkMapHandler } from "../maps";
//------------------------------------------------------------------------------
//HTTP Server: Request to get jobs list
//------------------------------------------------------------------------------
router.get("/list", async function (req, res) {
  let jobList = await JobManager.list();
  if (jobList.length > 0) {
    res.json({ result: "success", data: jobList });
  } else {
    res.json({ result: "warning", message: "Job list is empty." });
  }
});
//------------------------------------------------------------------------------
//HTTP Server: Request to download job
//------------------------------------------------------------------------------
router.post("/download", async function (req, res) {
  function checkType<T>(data: T, interfaceObj: any): true | string {
    for (const key in interfaceObj) {
      if (typeof interfaceObj[key] === "object") {
        if (!checkType(data[key], interfaceObj[key])) {
          return key;
        }
      } else if (typeof data[key] !== typeof interfaceObj[key]) return key;
    }
    return true;
  }
  const result = checkType(req.body, iJobConfig);
  if (result === true) {
    if (!checkMapHandler(req.body?.download?.mapID)) {
      res.json({
        result: "error",
        message: "Cant find map handler by map ID. Skip.",
      });
      return;
    }
    if (!(await POI.checkPOI(parseInt(req.body?.polygonID)))) {
      res.json({
        result: "error",
        message: "Cant find POI by ID. Skip.",
      });
      return;
    }
    if (Object.keys(req.body?.download?.zoom).length < 1) {
      res.json({ result: "error", message: "Zooms list is empty." });
      return;
    }
  } else {
    res.json({
      result: "warning",
      message: `Key <b>${result}</b> not same as described in interface. Skip add job to queue.`,
    });
    return;
  }
  JobManager.add(req.body);
  res.json({ result: "success", message: "Job added to queue." });
});
//------------------------------------------------------------------------------
//HTTP Server: Request to start job
//------------------------------------------------------------------------------
router.get("/start/:jobID", async (req, res) => {
  if (await JobManager.start(req.params.jobID)) {
    res.json({ result: "success", message: "Job was started." });
  } else {
    res.json({
      result: "warning",
      message: "Cant find job in queue by ID. Skip",
    });
  }
});
//------------------------------------------------------------------------------
//HTTP Server: Request to start job
//------------------------------------------------------------------------------
router.get("/stop/:jobID", async (req, res) => {
  if (await JobManager.stop(req.params.jobID)) {
    res.json({ result: "success", message: "Job was stoped." });
  } else {
    res.json({
      result: "warning",
      message: "Cant find job in queue by ID. Skip",
    });
  }
});
//------------------------------------------------------------------------------
//HTTP Server: Request to move job UP in jobs list
//------------------------------------------------------------------------------
router.get("/up/:jobID", async function (req, res) {
  if (await JobManager.up(req.params.jobID)) {
    res.json({ result: "success", message: "Job was moved UP in queue." });
  } else {
    res.json({ result: "error", message: "Job cant be moved UP in queue." });
  }
});
//------------------------------------------------------------------------------
//HTTP Server: Request to move job DOWN in jobs list
//------------------------------------------------------------------------------
router.get("/down/:jobID", async function (req, res) {
  if (await JobManager.down(req.params.jobID)) {
    res.json({ result: "success", message: "Job was moved DOWN in queue." });
  } else {
    res.json({ result: "error", message: "Job cant be moved DOWN in queue." });
  }
});
//------------------------------------------------------------------------------
//HTTP Server: Request to deelete job in jobs list
//------------------------------------------------------------------------------
router.get("/delete/:jobID", async function (req, res) {
  if (await JobManager.delete(req.params.jobID)) {
    res.json({ result: "success", message: "Job was deleted from queue." });
  } else {
    res.json({ result: "error", message: "Job cant be deleted from queue." });
  }
});
//------------------------------------------------------------------------------
//HTTP Server: Request to generate map job
//------------------------------------------------------------------------------
router.post("/generate", async function (req, res) {
  //Default job settings
  let jobConfig: GenJobInfo = {
    ID: "some jobID",
    polygonID: "0",
    mapID: "none",
    zoom: ["0"],
    updateTiles: false,
    completeTiles: false,
    fromZoom: "0",
    previousZoom: false,
  };
  //Make checkings and merging of jobConfig and default job settins
  for (const key in jobConfig) {
    if (typeof jobConfig[key as keyof GenJobInfo] != typeof req.body[key]) {
      res.json({
        result: "warning",
        message: `Key <b>${key}</b> not same as described in interface. Skip add job to queue.`,
      });
      return;
    } else {
      let value = req.body[key];
      switch (key) {
        case "mapID":
          if (!checkMapHandler(value)) {
            res.json({
              result: "error",
              message: "Cant find map handler by map ID. Skip.",
            });
            return;
          }
          break;
        case "polygonID":
          if (!(await POI.checkPOI(parseInt(value)))) {
            res.json({
              result: "error",
              message: "Cant find POI by ID. Skip.",
            });
            return;
          }
          break;
        case "zoom":
          if (value.length < 1) {
            res.json({ result: "error", message: "Zooms list is empty." });
            return;
          }
      }
      //@ts-ignore
      jobConfig[key as keyof JobInfo] = value;
    }
  }
  for (let i = 0; i < jobConfig.zoom.length; i++) {
    let fromZoom = parseInt(jobConfig.fromZoom);
    let keyZoom = parseInt(jobConfig.zoom[i]);
    if (keyZoom >= fromZoom) {
      res.json({
        result: "error",
        message: "Generated zooms must be less than base zoom.",
      });
      return;
    }
  }
  JobManager.add(jobConfig, true);
  res.json({ result: "success", message: "Job added to queue." });
});

export default router;
