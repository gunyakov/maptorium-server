
import { JobInfo, CachedTilesList, GenJobInfo, JobsList } from "./interface";
import { JobType, TileInCache} from './enum';
//------------------------------------------------------------------------------
//Generate JOB ID
//------------------------------------------------------------------------------
import * as crypto from "crypto";
//------------------------------------------------------------------------------
//Send tiles uodate state for cached map during downloading.
//------------------------------------------------------------------------------
import { sendCachedMapTileUpdate, sendJobEnd, sendJobStart } from "./io";
//------------------------------------------------------------------------------
//Downloader handler
//------------------------------------------------------------------------------
import Downloader from "./downloader";
//------------------------------------------------------------------------------
//Map generator handler
//------------------------------------------------------------------------------
import Generator from "./generator";
//------------------------------------------------------------------------------
//Extend Array with few new functions.
//------------------------------------------------------------------------------
class MArray<T> extends Array<JobsList> {
    public getIndex(ID:string):number {
        for(let i = 0; i < this.length; i++) {
            if(typeof this[i]?.ID !== "undefined" && this[i]?.ID == ID) {
                return i;
            }
        }
        return -1;
    }
    public move(fromIndex: number, toIndex: number) {
        const startIndex = fromIndex < 0 ? this.length + fromIndex : fromIndex;

        if (startIndex >= 0 && startIndex < this.length) {
            const endIndex = toIndex < 0 ? this.length + toIndex : toIndex;

            const [item] = this.splice(fromIndex, 1);
            this.splice(endIndex, 0, item);
        }
    }
    public up(fromIndex:number):void {
        let toIndex = fromIndex - 1;
        this.move(fromIndex, toIndex);
    }
    public down(fromIndex:number) {
        let toIndex = fromIndex + 1;
        this.move(fromIndex, toIndex);
    }
    public delete(index:number) {
        this.splice(index, 1);
    }
}
//------------------------------------------------------------------------------
//Job List handler
//------------------------------------------------------------------------------
class JobManager {

    private _arrJobsList: MArray<JobsList> = new MArray();
    private _handlers:{[id:string]:Downloader | Generator}  = {};
    private _tileCachedList:CachedTilesList = {};
    private _cachedMapID:string = "";
    private _cachedMapZoom:number = 0;
    private _jobsRunning: number = 0;

    constructor() {

    }

    public async add(jobConfig:JobInfo | GenJobInfo, generate:boolean = false) {
        //Push job order to list
        let ID = crypto.randomBytes(16).toString("hex");
        let jobInfo:JobsList = {
            ID: ID,
            type: generate ? JobType.generate : JobType.download,
            mapID: jobConfig.mapID,
            running: false
        }
        this._arrJobsList.push(jobInfo);
        jobConfig.ID = ID;
        //Make downloader for job
        let handler: Downloader | Generator;
        if(generate) handler = new Generator(jobConfig as GenJobInfo);
        else handler = new Downloader(jobConfig as JobInfo);
        //Reg callback to notify that job was finished
        handler.onEnd(async (ID:string) => {
            sendJobEnd(ID);
            //Delete job from array
            await this.delete(ID);
            //Start another job if present in list
            if(this._jobsRunning == 0 && this._arrJobsList.length > 0) {
                this.start(this._arrJobsList[0].ID);
                sendJobStart(this._arrJobsList[0].ID);
            }
        });
        //Callback when tile was geted from net with 200 or 404 state for cached map redrawing in UI
        handler.onTile(this.emitTileUpdate.bind(this));

        this._handlers[ID] = handler;
        //If this is first job added to queue, start download
        if(this._jobsRunning == 0) {
            this.start(ID);
            sendJobStart(ID);
        }
        
        return true;
    }

    public async delete(ID:string):Promise<boolean> {

        let index = this._arrJobsList.getIndex(ID);

        if(index == -1) return false;

        if(await this.stop(ID)) {
            //Delete job from list
            this._arrJobsList.delete(index);
            //Delete downloader class from memory
            delete this._handlers[ID];

            return true;
        }
        else {
            return false;
        }
    }

    public async up(ID:string):Promise<boolean> {

        let index = this._arrJobsList.getIndex(ID);

        if(index == -1 || index == 0) return false;

        this._arrJobsList.up(index);
        
        return true;
    }

    public async down(ID:string):Promise<boolean> {

        let index = this._arrJobsList.getIndex(ID);

        if(index == -1 || index + 1 == this._arrJobsList.length) return false;

        this._arrJobsList.down(index);
        
        return true;
    }

    public async start(ID:string):Promise<boolean> {
        let index = this._arrJobsList.getIndex(ID);
        if(index != -1) {
            this._handlers[ID].start();
            this._jobsRunning++;
            this._arrJobsList[index].running = true;
            return true;
            
        }
        else {
            return false;
        }
    }

    public async stop(ID:string):Promise<boolean> {
        let index = this._arrJobsList.getIndex(ID);
        if(index != -1) {
            this._handlers[ID].stop();
            this._jobsRunning--;
            this._arrJobsList[index].running = false;
            return true;
        }
        else {
            return false;
        }
    }

    public async list() {
        return this._arrJobsList;
    }

    private async emitTileUpdate(mapID:string, zoom:number, x:number, y:number, state:TileInCache):Promise<void> {

        if(this._cachedMapID == mapID && this._cachedMapZoom == zoom) {
            if(typeof this._tileCachedList[x] !== "undefined") {
              if(typeof this._tileCachedList[x][y] !== "undefined") {
                this._tileCachedList[x][y] = state;
                sendCachedMapTileUpdate({x, y, state});
              }
            }
        }
    }
    
    public async setTileCachedMap(mapID:string, zoom:number, tilesList:CachedTilesList) {
        this._cachedMapID = mapID;
        this._cachedMapZoom = zoom;
        this._tileCachedList = tilesList;
    }

}

export default new JobManager();