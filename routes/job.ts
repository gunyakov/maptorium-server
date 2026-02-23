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
//------------------------------------------------------------------------------
//Config
//------------------------------------------------------------------------------
import { GenJobInfo, iJobConfig } from "../src/interface";
import { checkMapHandler } from "../maps";
import defConfig from "../config/config";
import {
  validateDownloadJobRequest,
  validateGenerateJobRequest,
} from "../helpers/validate";
//------------------------------------------------------------------------------
//HTTP Server: Request to get jobs list
//------------------------------------------------------------------------------
router.get("/list", async function (req, res) {
  let jobList = await JobManager.list();
  if (jobList.length > 0) {
    res.json({ result: "success", data: jobList });
  } else {
    res.json({ result: "warning", message: "request.job.list.empty" });
  }
});
//------------------------------------------------------------------------------
//HTTP Server: Request to download job
//------------------------------------------------------------------------------
router.post("/download", async function (req, res) {
  //Default job settings
  let jobConfig: iJobConfig = {
    polygonID: 0,
    polygon: [],
    download: {
      ...defConfig.downloader,
      ID: "0",
      mapID: "none",
      dateTiles: "",
      dateEmpty: "",
      zoom: {},
      threadsCounter: defConfig.service.threads,
    },
    customNetworkConfig: false,
    network: defConfig.network,
  };

  const validation = validateDownloadJobRequest(req.body);
  if (!validation.ok) {
    res.json({
      result: "warning",
      message:
        "messageKey" in validation
          ? validation.messageKey
          : "request.job.validation.body_invalid",
    });
    return;
  }

  const downloadData = validation.data.download;
  const polygonData = validation.data.polygon;
  const customNetworkConfig = validation.data.customNetworkConfig;
  const networkData = validation.data.network;

  if (!checkMapHandler(downloadData.mapID)) {
    res.json({
      result: "error",
      message: "request.job.validation.map_handler_missing",
    });
    return;
  }

  jobConfig = {
    ...jobConfig,
    polygonID: validation.data.polygonID,
    polygon: polygonData,
    customNetworkConfig,
    network: customNetworkConfig ? networkData : defConfig.network,
    download: {
      ...jobConfig.download,
      ...downloadData,
      ID: "0",
      threadsCounter: defConfig.service.threads,
    },
  };

  JobManager.add(jobConfig);
  res.json({ result: "success", message: "request.job.download.added" });
});
//------------------------------------------------------------------------------
//HTTP Server: Request to start job
//------------------------------------------------------------------------------
router.get("/start/:jobID", async (req, res) => {
  if (await JobManager.start(req.params.jobID)) {
    res.json({ result: "success", message: "request.job.start.success" });
  } else {
    res.json({
      result: "warning",
      message: "request.job.queue.job_not_found",
    });
  }
});
//------------------------------------------------------------------------------
//HTTP Server: Request to start job
//------------------------------------------------------------------------------
router.get("/stop/:jobID", async (req, res) => {
  if (await JobManager.stop(req.params.jobID)) {
    res.json({ result: "success", message: "request.job.stop.success" });
  } else {
    res.json({
      result: "warning",
      message: "request.job.queue.job_not_found",
    });
  }
});
//------------------------------------------------------------------------------
//HTTP Server: Request to move job UP in jobs list
//------------------------------------------------------------------------------
router.get("/up/:jobID", async function (req, res) {
  if (await JobManager.up(req.params.jobID)) {
    res.json({ result: "success", message: "request.job.up.success" });
  } else {
    res.json({ result: "error", message: "request.job.up.failed" });
  }
});
//------------------------------------------------------------------------------
//HTTP Server: Request to move job DOWN in jobs list
//------------------------------------------------------------------------------
router.get("/down/:jobID", async function (req, res) {
  if (await JobManager.down(req.params.jobID)) {
    res.json({ result: "success", message: "request.job.down.success" });
  } else {
    res.json({ result: "error", message: "request.job.down.failed" });
  }
});
//------------------------------------------------------------------------------
//HTTP Server: Request to deelete job in jobs list
//------------------------------------------------------------------------------
router.get("/delete/:jobID", async function (req, res) {
  if (await JobManager.delete(req.params.jobID)) {
    res.json({ result: "success", message: "request.job.delete.success" });
  } else {
    res.json({ result: "error", message: "request.job.delete.failed" });
  }
});
//------------------------------------------------------------------------------
//HTTP Server: Request to generate map job
//------------------------------------------------------------------------------
router.post("/generate", async function (req, res) {
  const validation = validateGenerateJobRequest(req.body);
  if (!validation.ok) {
    res.json({
      result: "warning",
      message:
        "messageKey" in validation
          ? validation.messageKey
          : "request.job.validation.body_invalid",
    });
    return;
  }

  const jobConfig: GenJobInfo = validation.data;

  if (!checkMapHandler(jobConfig.mapID)) {
    res.json({
      result: "error",
      message: "request.job.validation.map_handler_missing",
    });
    return;
  }

  for (let i = 0; i < jobConfig.zoom.length; i++) {
    let fromZoom = parseInt(jobConfig.fromZoom);
    let keyZoom = parseInt(jobConfig.zoom[i]);
    if (keyZoom >= fromZoom) {
      res.json({
        result: "error",
        message: "request.job.validation.generate_zoom_relation_invalid",
      });
      return;
    }
  }
  JobManager.addGen(jobConfig);
  res.json({ result: "success", message: "request.job.generate.added" });
});

export default router;
