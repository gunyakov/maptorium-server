
//------------------------------------------------------------------------------
//Logging service
//------------------------------------------------------------------------------
import Log from "./log";
import { DownloaderAction, LogModules, TileInCache} from './enum';

import { TileInfo, JobInfo, JobStat } from './interface';
import MapHandler from "./map";
import { getMapHandler } from "../maps/index";

//------------------------------------------------------------------------------
//Moment library to parse date from UI
//------------------------------------------------------------------------------
let moment = require('moment');

import {tilesListByPOI} from "../helpers/tilesList";
//------------------------------------------------------------------------------
//Config
//------------------------------------------------------------------------------
import config from "../config/index";
//------------------------------------------------------------------------------
//Statistics
//------------------------------------------------------------------------------
import stat from '../src/statistics';
import { sendJobStat } from "./io";
import wait from "../helpers/wait";
//------------------------------------------------------------------------------
//Downloader handler
//------------------------------------------------------------------------------
class Downloader {

    private _tilesList:Array<TileInfo> = [];
    private _threadRunList:Array<boolean> = [];
    private _mapHandler:MapHandler;
    private _callbackEnd:CallableFunction = () => {};
    private _callbackTile:CallableFunction = () => {};
    private _timer:NodeJS.Timeout = setTimeout(() => {}, 1000);

    private _running:boolean = false;

    private _stat:JobStat = {
        download: 0,
        error: 0,
        empty: 0,
        size: 0,
        skip: 0,
        time: 0,
        total: 0,
        queue: 0
    }

    private _jobConfig:JobInfo;

  constructor(jobConfig:JobInfo) {
      this._jobConfig = jobConfig;
      //If have conected map handler just get it
      this._mapHandler = getMapHandler(this._jobConfig.mapID);
  }
  //----------------------------------------------------------------------------
  //Prepare for tiles download
  //----------------------------------------------------------------------------
  async start() {
    //Set running flag
    this._running = true;
    //Start timer to caclculate job runnings seconds
    this._timer = setInterval(() => { 
      //Calculate seconds
      this._stat.time++;
      //Send job stat to UI
      sendJobStat(this._jobConfig.ID, this._stat);
    }, 1000);
    //If tiles list is empty
    if(this._tilesList.length == 0) {
      //Loop for all available zoom levels for download
      for(let i = 0; i < this._jobConfig.zoom.length; i++) {
        //Create tile list for zoom level
        let tempArr = await tilesListByPOI(parseInt(this._jobConfig.polygonID), parseInt(this._jobConfig.zoom[i]));
        //If create tile list for current zoom
        if(Array.isArray(tempArr)) {
          //Add tiles list to main Array
          this._tilesList = this._tilesList.concat(tempArr);
        }
      }
      //Make stat for job
      this._stat.total = this._tilesList.length;
      this._stat.queue = this._tilesList.length;
    }
    //If tile list isn`t empty after tiles list making
    if(this._tilesList.length > 0) {
      //Increase common stat with queue length
      stat.queue += this._tilesList.length;
      //Start threads
      this.threadsStarter();
    }
  }
  //----------------------------------------------------------------------------
  //Stop tiles download
  //----------------------------------------------------------------------------
  async stop() {
    Log.success(LogModules.worker, `Job stoped for Polygon ${this._jobConfig.polygonID} and Map ${this._jobConfig.mapID}. Tile Count: ${this._tilesList.length}`);
    //Set running flag
    this._running = false;
    //Stop timer what calcuate job time.
    if(this._timer) clearInterval(this._timer);
    //Set that need to stop downloading for each threads
    for(let i = 0; i < this._threadRunList.length; i++) {
      this._threadRunList[i] = false;
    }
    //Decrease common stat with queue length
    stat.queue -= this._tilesList.length;
  }
  //----------------------------------------------------------------------------
  //Return if downloading running or not
  //----------------------------------------------------------------------------
  async state() {
    return this._running;
  }
  //----------------------------------------------------------------------------
  //Функция, которая запускает потоки загрузки тайлов
  //----------------------------------------------------------------------------
  async threadsStarter():Promise<void> {
    Log.success(LogModules.worker, `Job started for Polygon ${this._jobConfig.polygonID} and Map ${this._jobConfig.mapID}. Tile Count: ${this._tilesList.length}`);
    //Reset thread counter
    let threadCounter = 0;
    //If size of request tiles in job list less than request tiles in GET
    if(this._tilesList.length > threadCounter) {
      threadCounter = this._tilesList.length;
    }
    //If threads counter more then threads enabled
    if(threadCounter > config.service.threads) {
      //Set threads counter to max enabled threads
      threadCounter = config.service.threads;
    }
    //Start loop
    for(let i = 1; i <= threadCounter; i++) {
      //If thread never run
      if(typeof this._threadRunList[i] === "undefined") {
        //Start thread
        this.tilesService(i);
      }
      //If thread is stopped
      else if(this._threadRunList[i] == false) {
        //Start thread
        this.tilesService(i);
      }
    }
  }
  //----------------------------------------------------------------------------
  //Функция потока загрузки тайлов
  //----------------------------------------------------------------------------
  async tilesService(threadNumber:number):Promise<void> {
    //Устанавливаем что поток запущен
    this._threadRunList[threadNumber] = true;
    //Пока поток запущен
    while(this._threadRunList[threadNumber]) {
      //If tiless list isn`t empty
      if(this._tilesList.length > 0) {
        //Reset tile info
        let jobTile:TileInfo;
        //If download in random mode
        if(this._jobConfig.randomDownload) {
          //Get random tile
          [jobTile] = this._tilesList.splice(Math.floor(Math.random() * this._tilesList.length), 1);
        }
        //If download in normal mode
        else {
          //Take first tile and delete it
          jobTile = this._tilesList.shift() as TileInfo;
        }
        //Set that tile must be skiped by default
        let action = DownloaderAction.skip;

        let [tileInDB, tileInfo] = await this._mapHandler.checkTile(jobTile.z, jobTile.x, jobTile.y, false);

        //If tile missing in DB, set that download required for tile
        if(tileInDB == false) {
          action = DownloaderAction.download
        }
        //If tile present in DB, its require to make additinal checkings
        else {
          //If tile not empty and must be updated 
          if(tileInfo.s > 0 && this._jobConfig.updateTiles) {
            if(!this._jobConfig.updateDateTiles) {
              action = DownloaderAction.update;
            }
            else {
              //Parse date to unix time
              let tileEmptyDate = moment(this._jobConfig.dateTiles).unix();
              //If tile was downloaded before date
              if(tileInfo.d < tileEmptyDate) {
                //console.log("update tile 2");
                action = DownloaderAction.update;
              }
            }
          }
          //If tile empty and need check empty tiles
          if(tileInfo.s == 0 && this._jobConfig.checkEmptyTiles) {
            //if no need to check empty tiles by specific date
            if(!this._jobConfig.updateDateEmpty) {
              action = DownloaderAction.update;
            }
            //If required to check empty tiles by specific date
            else {
              //Parse date to unix time
              let tileEmptyDate = moment(this._jobConfig.dateEmpty).unix();
              //If tile was downloaded before date
              if(tileInfo.d < tileEmptyDate) {
                //console.log("update tile 2");
                action = DownloaderAction.update;
              }
            }
          }
        }

        if(action == DownloaderAction.skip) {
          this._stat.skip++;
        }
        else {
          let code:number;
          let response:string;
          let size:number;
          //Download tile
          if(action == DownloaderAction.download) {
            [code, response, size] = await this._mapHandler.download(jobTile.z, jobTile.x, jobTile.y, this._jobConfig.net);
          }
          //Update tile
          else {
            [code, response, size] = await this._mapHandler.update(jobTile.z, jobTile.x, jobTile.y, this._jobConfig.net);
          }
          //If tile was downloaded fron net with 200 code
          if(code == 200) {
            this._stat.download++;
            this._stat.size += size;
            stat.download++;
            stat.size += size;
            //Notify job manager that tile was downloaded to draw on cached map
            if(this._callbackTile) this._callbackTile(this._jobConfig.mapID, jobTile.z, jobTile.x, jobTile.y, TileInCache.present);
          }
          //If tile was downloaded from net with 404 code
          else if(code == 404) {
            this._stat.empty++;
            stat.empty++
            //Notify job manager that tile is empty to draw on cached map
            if(this._callbackTile) this._callbackTile(this._jobConfig.mapID, jobTile.z, jobTile.x, jobTile.y, TileInCache.missing);
          }
          //If tile was downloaded with all other HTTP codes
          else {
            this._stat.error++;
            stat.error++;
          }
          await wait(this._jobConfig.net.request.delay);
        }
        this._stat.queue--;
        stat.queue--;
        //await wait(this._jobConfig.net.request.delay);
      }
      //If tiles list is empty
      else {
        //Exit from thread
        this._threadRunList[threadNumber] = false;
        //Notify job manager that task was finished.
        if(threadNumber == 1 && typeof this._callbackEnd != "undefined") this._callbackEnd(this._jobConfig.ID);
      }
    }
  }

  async addTile(tileInfo:TileInfo):Promise<void> {
    //Add tile to download list
    this._tilesList.unshift(tileInfo);
    //Start threads
    this.threadsStarter();
  }

  onEnd(callback:CallableFunction) {
    this._callbackEnd = callback;
  }
  onTile(callback:CallableFunction) {
    this._callbackTile = callback;
  }

}

export default Downloader;

