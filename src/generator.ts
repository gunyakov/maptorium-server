//------------------------------------------------------------------------------
//Image manipulation
//------------------------------------------------------------------------------
import sharp, { OverlayOptions } from "sharp";

import MapHandler from "./map";
import Log from "./log";
import { GenJobInfo, GenJobStat, TileInfo } from "./interface";
import { LogModules, TileInCache } from "./enum";
import { getMapHandler } from "../maps/index";
import {tilesListByPOI} from "../helpers/tilesList";
import wait from "../helpers/wait";
import { sendGenJobStat } from "./io";
//----------------------------------------------------------------------------
//Generate map tiles from lover zoom levels
//----------------------------------------------------------------------------
class Generator {

  private _jobConfig:GenJobInfo;
  private _mapHandler:MapHandler;
  private _tileSize:number = 256;
  private _running: boolean = false;
  private _timer:NodeJS.Timeout = setTimeout(() => {}, 1000);
  private _tilesList:Array<TileInfo> = [];
  private _callbackEnd:CallableFunction = () => {};
  private _callbackTile:CallableFunction = () => {};
  private _fromZoom:number = 0;

  private _stat:GenJobStat = {
    skip: 0,
    procesed: 0,
    total: 0,
    time: 0,
    readed: 0,
    size: 0
}

  constructor(jobConfig:GenJobInfo) {
    this._jobConfig = jobConfig;
    //If have conected map handler just get it
    this._mapHandler = getMapHandler(this._jobConfig.mapID);
    this._tileSize = this._mapHandler.getInfo().tileSize;
    this._fromZoom = parseInt(jobConfig.fromZoom);
  }

  //----------------------------------------------------------------------------
  //Prepare for tiles download
  //----------------------------------------------------------------------------
  async start() {
    //Set running flag
    this._running = true;
    //Start timer to caclculate job runnings seconds
    this._timer = setInterval(() => { 
      this._stat.time++;
      //Send job stat to UI
      sendGenJobStat(this._jobConfig.ID, this._stat);
    }, 1000);
    if(this._tilesList.length > 0) {
      this._generate();
    }
    else if(this._jobConfig.zoom.length > 0) {
      this._prepare();
    }
    else {
      Log.warning(LogModules.worker, `Zooms list and tiles list empty. Cant make any generate jobs any more.`);
    }
  }
  //----------------------------------------------------------------------------
  //Stop tiles download
  //----------------------------------------------------------------------------
  async stop() {
    //Set running flag
    this._running = false;
    //Stop timer what calcuate job time.
    if(this._timer) clearInterval(this._timer);
  }
  //----------------------------------------------------------------------------
  //Return if downloading running or not
  //----------------------------------------------------------------------------
  async state() {
    return this._running;
  }

  private async _prepare() {
    //If need to pause generate execution exit from function
    if(!this._running) return;
    while(this._jobConfig.zoom.length > 0) {
        //Get Max zoom from config
      let zoomNum = Array.from(this._jobConfig.zoom, val => parseInt(val));
      let zoom = Math.max(...zoomNum);
      //get index and delete this zoom from array
      let index = zoomNum.indexOf(zoom);
      this._jobConfig.zoom.splice(index, 1);
      //If max zoom les than base zoom for generator skip running
      if(zoom < this._fromZoom) {
        //Create tile list for zoom level
        let tempArr = await tilesListByPOI(parseInt(this._jobConfig.polygonID), zoom);
        //If create tile list for current zoom
        if(Array.isArray(tempArr)) {
          //Add tiles list to main Array
          this._tilesList = this._tilesList.concat(tempArr);
        }
      }
    }

    if(this._tilesList.length > 0) {
      //Make stat for job
      this._stat.total = this._tilesList.length;
      this._generate();
    }
    else {
      this.stop();
      Log.success(LogModules.worker, `Generate job completed full.`);
    }
  
  }

  private async _generate() {
    //this._jobConfig.updateTiles = (typeof config.updateTiles === "string") ? (config.updateTiles.toLowerCase() === "true") : config.updateTiles;
    //config.completeTiles = (typeof config.completeTiles === "string") ? (config.completeTiles.toLowerCase() === "true") : config.completeTiles;

    Log.success(LogModules.worker, `Generate job started for Polygon:${this._jobConfig.polygonID} and Map:${this._jobConfig.mapID}. Tile Count: ${this._tilesList.length}`);

    //Until tile list isnt empty AND running state is true
    while(this._tilesList.length > 0 && this._running) {
      //Release resources for other tasks
      await wait(2);
      let curTile = this._tilesList.shift() as TileInfo;
      this._stat.procesed++;
      //Check tile in DB
      let [tileInDB, tileInfo] = await this._mapHandler.checkTile(curTile.z, curTile.x, curTile.y, false);
      //If disable to update tiles
      if(!this._jobConfig.updateTiles) {
        //If tile present ant tile size more than 0 skip generate this tile
        if(tileInDB && tileInfo.s > 0) {
          this._stat.skip++;
          continue;
        }
      }

      //Set that need generate tiles from previous zoom only
      let difZoom = 1;
      let zoom = curTile.z + 1;
      //If required generate tiles from base zoom and not from previous
      if(!this._jobConfig.previousZoom) {
        difZoom = this._fromZoom - curTile.z;
        zoom = this._fromZoom;
      }

      let coef = Math.pow(2, difZoom);

      let fromX = coef * curTile.x;
      let fromY = coef * curTile.y;

      let toX = fromX + coef - 1;
      let toY = fromY + coef - 1;

      //Set that generated tile is full filled by default
      let fullTile = true;

      let arrImg:OverlayOptions[] = [];

      for(let x = fromX; x <= toX; x++) {
        for(let y = fromY; y <= toY; y++) {
          //If generated tile isnt full and in settings set that need to save only full tiles, skip loop
          if(!fullTile && this._jobConfig.completeTiles) continue;
          //Get tile from DB
          let [checked, tile] = await this._mapHandler.checkTile(zoom, x, y, true);
          this._stat.readed++;
          //If tile present in DB
          if(checked) {
            //If tile not empty
            if(tile.s > 0) {
              //create image instance
              let img = await sharp(tile.b);
              await img.resize(this._tileSize / coef, this._tileSize / coef);
              let top = (y - fromY) * (this._tileSize / coef);
              let left = (x - fromX) * (this._tileSize / coef);
              arrImg.push({input: await img.toBuffer(), top: top, left: left, blend: 'atop'})
              //Draw lower tile to curent tile
            }
            //If tile empty
            else {
              fullTile = false;
            }
          }
          //If tile missed in DB
          else {
            fullTile = false;
          }
        }
      }
      //If generated tile isnt full and in settings set that need to save only full tiles, skip loop
      if(!fullTile && this._jobConfig.completeTiles) continue;
      //Create tile
      let container = sharp({
        create: {
          width: this._tileSize,
          height: this._tileSize,
          channels: 3,
          background: { r: 255, g: 255, b: 255, alpha: 0}
        }
      });
      //Composite tile from tiles
      await container.composite(arrImg);
      //Convert image to buffer
      let data = await container.jpeg().toBuffer();
      this._stat.size += Buffer.byteLength(data);
      //Tile present in DB
      if(tileInDB) {
        //Rewrite tile
        await this._mapHandler.rewrite(curTile.z, curTile.x, curTile.y, data);
      }
      //If tile missing in DB
      else {
        //Insert tile
        await this._mapHandler.save(curTile.z, curTile.x, curTile.y, data);
      }
      //Notify job manager that tile was generated to draw on cached map
      if(this._callbackTile) this._callbackTile(this._jobConfig.mapID, curTile.z, curTile.x, curTile.y, TileInCache.present);
      
    }
    Log.success(LogModules.worker, `Generate job completed for Polygon ${this._jobConfig.polygonID} and Map ${this._jobConfig.mapID}.`);
    //If still need run generation and it was not call stop command before
    if(this._running) {
        this.stop();
        //Notify job manager that task was finished.
        if(this._callbackEnd) this._callbackEnd(this._jobConfig.ID);
    }
  }
  onEnd(callback:CallableFunction) {
    this._callbackEnd = callback;
  }
  onTile(callback:CallableFunction) {
    this._callbackTile = callback;
  }
}

export default Generator;

  