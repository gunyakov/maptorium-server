//------------------------------------------------------------------------------
//POI handler
//------------------------------------------------------------------------------
import POI from "../src/poi";
//------------------------------------------------------------------------------
//Logging service
//------------------------------------------------------------------------------
import Log from "../src/log";
import { LogModules } from "../src/enum";
//------------------------------------------------------------------------------
//Wait функция
//------------------------------------------------------------------------------
import wait from "../helpers/wait";
//------------------------------------------------------------------------------
//Nmea parser
//------------------------------------------------------------------------------
import { parseNmeaSentence } from "nmea-simple";
//------------------------------------------------------------------------------
//SOCKET IO
//------------------------------------------------------------------------------
import { sendGPS } from "../src/io";
//------------------------------------------------------------------------------
//General GPS handler
//------------------------------------------------------------------------------
class GPS_CORE {
  private _callback: CallableFunction = function () {};
  private _lastLng: number = 0;
  private _lastLat: number = 0;
  protected _lat: number = 0;
  protected _lng: number = 0;
  protected _dir = 0;
  private _enable: boolean = false;
  private _record: boolean = true;
  private _sampleRateTime: number = 60000;
  protected _update: boolean = false;

  constructor() {}

  public get lat(): number {
    return this._lat;
  }
  public get lng(): number {
    return this._lng;
  }
  public get dir(): number {
    return this._dir;
  }
  //----------------------------------------------------------------------------
  //Set function to fire when coords will be updated.
  //----------------------------------------------------------------------------
  public async on(callback: CallableFunction): Promise<void> {
    this._callback = callback;
  }
  //----------------------------------------------------------------------------
  //Start GPS service function
  //----------------------------------------------------------------------------
  public async start(): Promise<boolean> {
    this._enable = true;
    Log.info(LogModules.gps, "GPS service started.");
    this.service();
    return true;
  }
  //----------------------------------------------------------------------------
  //Stop GPS service function
  //----------------------------------------------------------------------------
  public async stop(): Promise<boolean> {
    this._enable = false;
    Log.info(LogModules.gps, "GPS service stoped.");
    return true;
  }
  //----------------------------------------------------------------------------
  //Change sample rate time
  //----------------------------------------------------------------------------
  public async sampleRate(rate = 60): Promise<boolean> {
    if (typeof rate == "number") {
      this._sampleRateTime = rate * 1000;
      Log.info(LogModules.gps, `Sample rate changed to ${rate} seconds.`);
      return true;
    } else {
      return false;
    }
  }
  //----------------------------------------------------------------------------
  //Toggle GPS Service state
  //----------------------------------------------------------------------------
  public async toggle(): Promise<boolean> {
    if (this._enable) {
      await this.stop();
    } else {
      await this.start();
    }
    return this._enable;
  }
  //----------------------------------------------------------------------------
  //Toggle gps record state
  //----------------------------------------------------------------------------
  public async stopRecord(): Promise<boolean> {
    this._record = false;
    Log.info(LogModules.gps, "Record service was stopped by user.");
    return true;
  }

  public async startRecord(): Promise<boolean> {
    this._record = true;
    Log.info(LogModules.gps, "Record service was started by user.");
    return true;
  }
  //----------------------------------------------------------------------------
  //Function to get GPS from external source
  //----------------------------------------------------------------------------
  public async getGPSCoords() {
    //You can import functions from httpJsonServer file and use there.
    //All other like timing beetwen request and so one will be handled in auto by this class.
  }

  public async parseNMEA(data: string) {
    let packet: {
      latitude?: number;
      longitude?: number;
      trackTrue?: number;
    } = {};
    try {
      packet = parseNmeaSentence(data) as {
        latitude: number;
        longitude: number;
        trackTrue: number;
      };
      if (
        typeof packet.latitude == "number" &&
        typeof packet.longitude == "number"
      ) {
        this._lat = packet.latitude;
        this._lng = packet.longitude;
        this._dir = packet.trackTrue as number;
        this._update = true;
        //Send real time socket update
        sendGPS(this._lat, this._lng, this._dir);
      }
    } catch (e) {
      if (e instanceof Error) {
        Log.warning(LogModules.gps, e.message);
      } else {
        Log.warning(LogModules.gps, "Unknown error occured.");
      }
    }
  }
  //----------------------------------------------------------------------------
  //Function to check if GPS was updated
  //----------------------------------------------------------------------------
  public async updated(): Promise<boolean> {
    if (this._update) {
      this._update = false;
      return true;
    } else {
      return false;
    }
  }
  public async getLastPoint() {
    return { lat: this._lastLat, lng: this._lastLng };
  }
  public get enable() {
    return this._enable;
  }
  //----------------------------------------------------------------------------
  //Service function to get GPS coords from server constantly
  //----------------------------------------------------------------------------
  private async service(): Promise<void> {
    //Wait 10 seconds before start GPS service
    await wait(10000);
    //Run cycle while service enabled
    let lastTime = 0;
    while (this._enable) {
      //If it pass more than sample rate time set or its first start
      if (lastTime == 0 || lastTime + this._sampleRateTime < Date.now()) {
        //Get new GPS coords
        await this.getGPSCoords();
        //If class have proper coordinates received from source
        if (this._lat && this._lng) {
          //If coords is different from last update and record enabled
          if (this._lastLng != this._lng || this._lastLat != this._lat) {
            if (this._record) {
              //Add coords to database
              if (await POI.routeAddPoint(this._lat, this._lng))
                Log.success(LogModules.gps, "GPS data recorded.");
              else
                Log.error(
                  LogModules.gps,
                  "GPS data record failed due to BD error."
                );
            }
            //Save current coords into class vars
            this._lastLat = this._lat;
            this._lastLng = this._lng;
            //Call callback, if registered
            if (this._callback) {
              this._callback({ lat: this._lat, lng: this._lng });
            }
          }
        }
        //Update last sample time to wait next event
        lastTime = Date.now();
      }
      //Wait 1 second
      await wait(1000);
    }
  }
}

export default GPS_CORE;
