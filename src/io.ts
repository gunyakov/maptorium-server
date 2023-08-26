//-----------------------------------------------------------------------------------------------
//SocketIO
//-----------------------------------------------------------------------------------------------
import { Server } from "socket.io";
//-----------------------------------------------------------------------------------------------
//LOG
//-----------------------------------------------------------------------------------------------
import Log from "./log";
import { LogModules, LogType, TileInCache } from "./enum";
import { CachedTilesList, JobStat, GenJobStat} from "./interface";

import stat from "./statistics";
import wait from "../helpers/wait";
//-----------------------------------------------------------------------------------------------
//Socket IO Init
//-----------------------------------------------------------------------------------------------
let IO:Server;

export default function (httpServer:any):Server {
    //-------------------------------------------------------------------------------------------
    //  Socket.IO for realtime App
    //-------------------------------------------------------------------------------------------
    const io = new Server(httpServer);
    //-------------------------------------------------------------------------------------------
    //  Connection Handler
    //-------------------------------------------------------------------------------------------
    io.on('connection', (socket) => {

        Log.info(LogModules.main, "User connected. Socket ID: " + socket.id);

        socket.on("disconnect", () => {
            Log.info(LogModules.main, "User disconnected.");
        });

    });

    IO = io;
    sendStat();
    return io;
}

//-----------------------------------------------------------------------------------------------
//Send Message to User
//-----------------------------------------------------------------------------------------------
export function sendMessage(module: LogModules, type:LogType, message: string) {
    IO.emit("message", {module: module, type: type, message: message, time: Date.now()});
}
//-----------------------------------------------------------------------------------------------
//Send GPS to User
//-----------------------------------------------------------------------------------------------
export function sendGPS(lat:number, lng:number, dir:number) {
    IO.emit("gps.now", {lat: lat, lng:lng, dir: dir});
}
//-----------------------------------------------------------------------------------------------
//Send Route Point to User
//-----------------------------------------------------------------------------------------------
export function sendRoutePoint(lat:number, lng:number) {
    IO.emit("gps.routepoint", {lat: lat, lng:lng});
}
//-----------------------------------------------------------------------------------------------
//Send Cached map to User
//-----------------------------------------------------------------------------------------------
export function sendCachedMap(data: {map: string, zoom: number, tiles: CachedTilesList}) {
    IO.emit("cachedtile.map", {...data});
}
//-----------------------------------------------------------------------------------------------
//Send Cached map calculation state to User
//-----------------------------------------------------------------------------------------------
export function sendCachedMapUpdate(stat:{tiles: number, total:number}) {
    IO.emit("cachedtile.progress", {...stat});
}
/**
 * Emit socket event `cachedtile.tile`
 * Notify client that tile`s state in cached map was changed
 * @param tileInfo 
 */
export function sendCachedMapTileUpdate(tileInfo:{x:number, y:number, state: TileInCache}) {
    IO.emit("cachedtile.tile", {...tileInfo});
}
/**
 * Emit socket event `stat.job`
 * Send to client new stat for downloading job
 * @param {string} jobID - ID for job
 * @param stat 
 */
export function sendJobStat(jobID: string, stat:JobStat) {
    IO.emit("stat.job", {ID: jobID, stat: stat});
}
/**
 * Emit socket event `stat.gen`
 * Send to client new stat for generating job
 * @param {string} jobID - ID for job
 * @param {GenJobStat} stat 
 */
export function sendGenJobStat(jobID: string, stat:GenJobStat) {
    IO.emit("stat.gen", {ID: jobID, stat: stat});
}
/**
 * Emit socket event `job.end`
 * Notify client that job was ended
 * @param {string} jobID - ID for job 
 */
export function sendJobEnd(jobID:string) {
    IO.emit("job.end", {jobID: jobID});
}
/**
 * Emit socket event `job.start`
 * Notify client that job was started
 * @param {string} jobID - ID for job 
 */
export function sendJobStart(jobID:string) {
    IO.emit("job.start", {jobID: jobID});
}

//-----------------------------------------------------------------------------------------------
//Each 200ms check if stat was changed. If changed, send new stat to UI
//-----------------------------------------------------------------------------------------------
async function sendStat() {
    let statOld = {...stat};
    while(true) {

        let statChanged = false;
        
        let keys = Object.keys(statOld);

        for(let i = 0; i < keys.length; i++) {
            if(stat[keys[i]] !== statOld[keys[i]]){
                statChanged = true;
            }
        }
        
        if(statChanged) {
            IO.emit("stat", stat);
            statOld = {...stat};
        }
        
        await wait(200);
    }
}

