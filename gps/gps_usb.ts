//------------------------------------------------------------------------------
//SerialPort
//------------------------------------------------------------------------------
import { SerialPort, ReadlineParser } from "serialport";
//------------------------------------------------------------------------------
//Logging service
//------------------------------------------------------------------------------
import Log from "../src/log";
import { LogModules } from "../src/enum";
//------------------------------------------------------------------------------
//GPS Core
//------------------------------------------------------------------------------
import GPS_CORE from "./gps_core";
//------------------------------------------------------------------------------
//Extend GPS core to handle NMEA data from USB serial device
//------------------------------------------------------------------------------
class GPS_USB extends GPS_CORE {
  private _device: string = "/dev/ttyACM0";

  private _port: SerialPort | null = null;
  private _parser: ReadlineParser | null = null;
  constructor() {
    super();
  }

  public async config(device: string, stopAndStart: boolean = false) {
    console.log(device);
    this._device = device;
    if (stopAndStart || this.enable) {
      await this.stop();
      await this.start();
    }
  }
  /**
   * Open USB device and start parsing NMEA strings
   * @returns - true if ok
   */
  public async start(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this._port = new SerialPort({
        path: this._device,
        baudRate: 115200,
        autoOpen: false,
      });
      this._port.on("error", (e) => {
        Log.error(LogModules.gps, e.message);
        resolve(false);
      });
      this._port.open((e) => {
        if (e) {
          Log.error(LogModules.gps, e?.message);
          resolve(false);
        } else {
          Log.success(LogModules.gps, `Device ${this._device} was opened.`);
          resolve(true);
          super.start();
        }
      });
      this._parser = this._port.pipe(new ReadlineParser({ delimiter: "\r\n" }));
      this._parser.on("data", (data) => {
        this.parseNMEA(data);
      });
    });
  }
  /**
   * Close USB device and reset class state
   * @returns - true
   */
  public async stop(): Promise<boolean> {
    this._parser = null;
    this._port?.close();
    this._port = null;
    return true;
  }
}

export default new GPS_USB();
