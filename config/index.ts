import { UserConfig } from "../src/interface";
export const ExecFolder = process.cwd();
import config from "./config";
export default config;
import path from "path";
//Use CWD to run under linix or compile package with pkg for Windows

//Use __dirname to run source under Windows
//export const ExecFolder = path.join(__dirname, "..");
const filePath = path.join(ExecFolder, "config.user.json");
export var userConfig = require(filePath) as UserConfig;
//------------------------------------------------------------------------------
//NodeJS FS
//------------------------------------------------------------------------------
import fs from "node:fs";
//------------------------------------------------------------------------------
//GPS service
//------------------------------------------------------------------------------
import GPS from "../gps/gps";
import { DownloadMode } from "../src/enum";

if (!userConfig.recordRoute) {
  GPS.stopRecord();
}

if (userConfig.gpsSampleTime > 0) {
  GPS.sampleRate(userConfig.gpsSampleTime);
}

if (userConfig.gpsServer) {
  GPS.config(userConfig.gpsServer.host, userConfig.gpsServer.port);
}

if (userConfig.gpsServiceRun) {
  GPS.start();
}

if (userConfig.mode in DownloadMode) {
  config.network.state = userConfig.mode;
}

export function getDefConfig(key: keyof UserConfig) {
  return userConfig[key];
}

export async function setDefConfig(
  key: keyof UserConfig,
  val: any,
  save: boolean = true
): Promise<boolean> {
  //@ts-ignore
  userConfig[key] = val;
  if (save) {
    if (await saveDefConfig()) {
      return true;
    } else {
      return false;
    }
  }
  return true;
}

export async function saveDefConfig(): Promise<boolean> {
  return new Promise(function (resolve, reject) {
    fs.writeFile(filePath, JSON.stringify(userConfig), (err) => {
      if (err) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}
