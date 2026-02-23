//------------------------------------------------------------------------------
//Express
//------------------------------------------------------------------------------
import * as express from "express";
const router = express.Router();
router.use(express.json());
router.use(express.urlencoded({ extended: true }));
//------------------------------------------------------------------------------
//SerialPort
//------------------------------------------------------------------------------
import { SerialPort } from "serialport";
//------------------------------------------------------------------------------
//GPS handler
//------------------------------------------------------------------------------
import GPS from "../gps/gps";
import { GPSCoords } from "../src/interface";
//------------------------------------------------------------------------------
//Geometry handler
//------------------------------------------------------------------------------
import POI from "../src/poi";
import { setDefConfig } from "../config";
//------------------------------------------------------------------------------
//HTTP Server: Request to get jobs list
//------------------------------------------------------------------------------
router.get("/now", async function (req, res) {
  res.json({
    result: "success",
    data: {
      lat: GPS.lat,
      lng: GPS.lng,
      dir: GPS.dir,
    },
  });
});

router.get("/route/:routeID", async function (req, res) {
  let routeData = (await POI.routeGetHistory(
    parseInt(req.params.routeID),
  )) as Array<GPSCoords>;

  if (routeData) {
    res.json({ result: "success", data: routeData });
  } else {
    res.json({ result: "error", message: "txt.gps.error.route_not_found" });
  }
});

router.get("/point", async function (req, res) {
  let point = await GPS.getLastPoint();
  if (point.lat !== 0 && point.lng !== 0) {
    res.json({ result: "success", data: point });
  } else {
    res.json({
      result: "success",
      message: "txt.gps.error.no_last_point",
    });
  }
});

router.get("/stoprecord", async function (req, res) {
  if (await GPS.stopRecord()) {
    setDefConfig("recordRoute", false);
    res.json({ result: "success", message: "txt.gps.disable_recording" });
  } else {
    res.json({
      result: "error",
      message: "txt.gps.error.disable_recording",
    });
  }
});

router.get("/startrecord", async function (req, res) {
  if (await GPS.startRecord()) {
    setDefConfig("recordRoute", true);
    res.json({ result: "success", message: "txt.gps.enable_recording" });
  } else {
    res.json({ result: "error", message: "txt.gps.error.enable_recording" });
  }
});

router.post("/routenew", async function (req, res) {
  if (req.body.name?.length > 4) {
    if (await POI.routeAddRoute(req.body.name)) {
      res.json({ result: "success", message: "txt.gps.new_route_started" });
    } else {
      res.json({ result: "error", message: "txt.gps.error.new_route" });
    }
  } else
    res.json({ result: "error", message: "txt.gps.error.invalid_route_name" });
});

router.get("/routelist", async function (req, res) {
  let list = await POI.routeGetList();
  if (list) {
    res.json({ result: "success", data: list });
  } else {
    res.json({ result: "error", message: "txt.gps.error.empty_route_list" });
  }
});

router.post("/sample", async function (req, res) {
  let time = parseInt(req.body.time);

  if (time) {
    if (await GPS.sampleRate(time)) {
      setDefConfig("gpsSampleTime", time);
      res.json({ result: "info", message: "txt.gps.sample_time_updated" });
    } else {
      res.json({
        result: "error",
        message: "txt.gps.error.sample_time_update",
      });
    }
  } else
    res.json({
      result: "warning",
      message: "txt.gps.error.invalid_sample_time",
    });
});

router.get("/start", async function (req, res) {
  if (await GPS.start()) {
    setDefConfig("gpsServiceRun", true);
    res.json({ result: "success", message: "txt.gps.started" });
  } else {
    res.json({ result: "error", message: "txt.gps.error.start" });
  }
});

router.get("/stop", async function (req, res) {
  if (await GPS.stop()) {
    setDefConfig("gpsServiceRun", false);
    res.json({ result: "success", message: "txt.gps.stopped" });
  } else {
    res.json({ result: "error", message: "txt.gps.error.stop" });
  }
});
/**
 * Get USB Serial devices list
 * Added at v3.1.0
 *
 * Linux list example:
 * [{
 *     "path":"/dev/ttyACM0",
 *     "manufacturer":"u-blox AG - www.u-blox.com",
 *     "pnpId":"usb-u-blox_AG_-_www.u-blox.com_u-blox_7_-_GPS_GNSS_Receiver-if00",
 *     "vendorId":"1546",
 *     "productId":"01a7"
 * }]
 *
 * Windows list example:
 * [{
 *     "path":"COM6",
 *     "manufacturer":"Microsoft",
 *     "serialNumber":"6&15F17D69&0&1",
 *     "pnpId":"USB\\VID_1546&PID_01A7\\6&15F17D69&0&1",
 *     "locationId":"Port_#0001.Hub_#0002",
 *     "friendlyName":"USB Serial Device (COM6)",
 *     "vendorId":"1546",
 *     "productId":"01A7"
 * }]
 */
router.get("/list", async function (req, res) {
  const ports = await SerialPort.list();
  res.json({ result: "success", data: ports });
});

export default router;
