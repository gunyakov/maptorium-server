//process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
//------------------------------------------------------------------------------
//NodeJS FS
//------------------------------------------------------------------------------
import fs from "node:fs";
//------------------------------------------------------------------------------
//GPS service
//------------------------------------------------------------------------------
import GPS from "../gps/gps";
import { DownloadMode } from "../src/enum";
import { UserConfig } from "../src/interface";
import { isConfigReady, setConfigReady } from "./shared";
import configDef from "./config";

export const ExecFolder = process.cwd();
import path from "path";

let config = { ...configDef } as typeof configDef & UserConfig;
let userConfig = {} as UserConfig;
const filePath = path.join(ExecFolder, "config.user.json");

//------------------------------------------------------------------------------
//Prepare config
//------------------------------------------------------------------------------
async function prepareConfig() {
  if (!isConfigReady()) {
    userConfig = require(filePath);
    config = { ...configDef, ...userConfig };
    // GPS and config-dependent setup
    if (userConfig.gpsServer?.type) GPS.switch(userConfig.gpsServer.type);

    if (!userConfig.recordRoute) {
      GPS.stopRecord();
    }

    if (userConfig.gpsSampleTime > 0) {
      GPS.sampleRate(userConfig.gpsSampleTime);
    }

    if (userConfig.gpsServer) {
      GPS.config(userConfig.gpsServer);
    }

    if (userConfig.gpsServiceRun) {
      GPS.start();
    }

    if (userConfig.mode in DownloadMode) {
      config.network.state = userConfig.mode;
    }
    setConfigReady(true);
  }
}

prepareConfig();

function getDefConfig(key: keyof UserConfig & keyof typeof configDef): any {
  console.log("Get config for key:", key);
  console.log("Default config:", config);
  console.log("User config:", userConfig);
  return configDef[key] || userConfig[key];
}

async function setDefConfig(
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

async function saveDefConfig(): Promise<boolean> {
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
export {
  config,
  userConfig,
  getDefConfig,
  setDefConfig,
  saveDefConfig,
  prepareConfig,
};
