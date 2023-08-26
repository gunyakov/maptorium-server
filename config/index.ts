import { UserConfig } from "../src/interface";
import config from "./config";
export default config;
export var userConfig = require("./config.user.json") as UserConfig;
const filePath = process.cwd() + '/config/config.user.json';
//------------------------------------------------------------------------------
//NodeJS FS
//------------------------------------------------------------------------------
import fs from "node:fs";
//------------------------------------------------------------------------------
//GPS service
//------------------------------------------------------------------------------
import GPS from "../gps/gps";
import { DownloadMode } from "../src/enum";

if(!userConfig.recordRoute) {
  GPS.stopRecord();
}

if(userConfig.gpsSampleTime > 0) {
    GPS.sampleRate(userConfig.gpsSampleTime);
}

GPS.start();

if(userConfig.mode in DownloadMode) {
    config.network.state = userConfig.mode;
}

export function getDefConfig(key:keyof UserConfig) {
    return userConfig[key];
}

export async function setDefConfig(key:keyof UserConfig, val:any, save:boolean = true):Promise<boolean> {
    //@ts-ignore
    userConfig[key] = val;
    if(save) {
        if(await saveDefConfig()) {
            return true;
        }
        else {
            return false;
        }
    }
    return true;
}

export async function saveDefConfig():Promise<boolean> {
    return new Promise(function(resolve, reject) {
        fs.writeFile(filePath, JSON.stringify(userConfig), (err) => {
            if(err) {
                resolve(false);
            }
            else {
                resolve(true);
            }
        });
    });
}