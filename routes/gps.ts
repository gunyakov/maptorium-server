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
    parseInt(req.params.routeID)
  )) as Array<GPSCoords>;

  if (routeData) {
    res.json({ result: "success", data: routeData });
  } else {
    res.json({ result: "error", message: "Cant find route data in DB." });
  }
});

router.get("/point", async function (req, res) {
  let point = await GPS.getLastPoint();
  if (point.lat !== 0 && point.lng !== 0) {
    res.json({ result: "success", data: point });
  } else {
    res.json({
      result: "success",
      message: "Cant get last route point. Result is empty now.",
    });
  }
});

router.get("/stoprecord", async function (req, res) {
  if (await GPS.stopRecord()) {
    setDefConfig("recordRoute", false);
    res.json({ result: "success", message: "GPS disable record to DB." });
  } else {
    res.json({
      result: "error",
      message: "Error to disable GPS record to DB.",
    });
  }
});

router.get("/startrecord", async function (req, res) {
  if (await GPS.startRecord()) {
    setDefConfig("recordRoute", true);
    res.json({ result: "success", message: "GPS enable record to DB." });
  } else {
    res.json({ result: "error", message: "Error to enable GPS record to DB." });
  }
});

router.post("/routenew", async function (req, res) {
  if (req.body.name?.length > 4) {
    if (await POI.routeAddRoute(req.body.name)) {
      res.json({ result: "success", message: "New route started." });
    } else {
      res.json({ result: "error", message: "Error to start new route." });
    }
  } else res.json({ result: "error", message: "Route name is empty or less than 4 simbols." });
});

router.get("/routelist", async function (req, res) {
  let list = await POI.routeGetList();
  if (list) {
    res.json({ result: "success", data: list });
  } else {
    res.json({ result: "error", message: "Routes list is empty." });
  }
});

router.post("/sample", async function (req, res) {
  let time = parseInt(req.body.time);

  if (time) {
    if (await GPS.sampleRate(time)) {
      setDefConfig("gpsSampleTime", time);
      res.json({ result: "info", message: "GPS: Sample rate changed." });
    } else {
      res.json({
        result: "error",
        message: "GPS: Sample rate changing error.",
      });
    }
  } else res.json({ result: "warning", message: "Cant read time value. Skip." });
});

router.get("/start", async function (req, res) {
  if (await GPS.start()) {
    setDefConfig("gpsServiceRun", true);
    res.json({ result: "success", message: "GPS Service started." });
  } else {
    res.json({ result: "error", message: "Error to start GPS Service," });
  }
});

router.get("/stop", async function (req, res) {
  if (await GPS.stop()) {
    setDefConfig("gpsServiceRun", false);
    res.json({ result: "success", message: "GPS Service stoped." });
  } else {
    res.json({ result: "error", message: "Error to stop GPS Service," });
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
