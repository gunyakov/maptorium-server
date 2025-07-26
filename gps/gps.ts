import GPS_USB from "./gps_usb";
import GPS_TCP from "./gps_tcp";
import GPS_HTTP_FOS from "./gps_http_fos";
import { GPSType } from "../src/enum";
import { GPSConfig } from "../src/interface";

class GPS {
  private _gps: typeof GPS_USB | typeof GPS_TCP | typeof GPS_HTTP_FOS = GPS_TCP;
  private _callback: CallableFunction = function () {};
  private _sampleRateTime: number = 60000;

  constructor() {}

  /**
   * Switch beetwen USB and TCP GPS
   * @param type - 'usb' or 'tcp'
   */
  public async switch(type: GPSType) {
    if (type == GPSType.usb) {
      this._gps = GPS_USB;
    } else if (type == GPSType.tcp) {
      this._gps = GPS_TCP;
    } else if (type == GPSType.httpFOS) {
      this._gps = GPS_HTTP_FOS;
    }
    //Reuse callback function
    if (this._callback) this._gps.on(this._callback);
    //Reuse sample time
    this._gps.sampleRate(this._sampleRateTime);
    if (this._gps.enable) {
      this.stop();
      this.start();
    }
  }

  public async config(config: GPSConfig, stopAndStart: boolean = false) {
    if (config.type == GPSType.usb) {
      if (this._gps != GPS_USB) this.switch(GPSType.usb);
      //@ts-ignore
      this._gps.config(config.device, stopAndStart);
    } else if (config.type == GPSType.tcp) {
      if (this._gps != GPS_TCP) this.switch(GPSType.tcp);
      //@ts-ignore
      this._gps.config(config.host, config.port, stopAndStart);
    } else if (config.type == GPSType.httpFOS) {
      if (this._gps != GPS_HTTP_FOS) this.switch(GPSType.httpFOS);
      //@ts-ignore
      this._gps.config(config.host, config.port, stopAndStart);
    }
  }

  public async start() {
    return this._gps.start();
  }

  public async stop() {
    return this._gps.stop();
  }

  public async getLastPoint() {
    return this._gps.getLastPoint();
  }

  public async updated(): Promise<boolean> {
    return this._gps.updated();
  }

  public async stopRecord(): Promise<boolean> {
    return this._gps.stopRecord();
  }

  public async startRecord(): Promise<boolean> {
    return this._gps.startRecord();
  }

  public async toggle(): Promise<boolean> {
    return this._gps.toggle();
  }

  //----------------------------------------------------------------------------
  //Set function to fire when coords will be updated.
  //----------------------------------------------------------------------------
  public async on(callback: CallableFunction): Promise<void> {
    this._callback = callback;
    this._gps.on(callback);
  }

  public get lat(): number {
    return this._gps.lat;
  }
  public get lng(): number {
    return this._gps.lng;
  }
  public get dir(): number {
    return this._gps.dir;
  }
  //----------------------------------------------------------------------------
  //Change sample rate time
  //----------------------------------------------------------------------------
  public async sampleRate(rate = 60): Promise<boolean> {
    if (typeof rate == "number") {
      this._sampleRateTime = rate * 1000;
      this._gps.sampleRate(this._sampleRateTime);
      return true;
    } else {
      return false;
    }
  }
}

export default new GPS();
