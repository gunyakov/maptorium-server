//------------------------------------------------------------------------------
//GPS Core
//------------------------------------------------------------------------------
import GPS_CORE from "./gps_core";
//------------------------------------------------------------------------------
//NODEJS NET
//------------------------------------------------------------------------------
import net from "node:net";
//------------------------------------------------------------------------------
//Logging service
//------------------------------------------------------------------------------
import Log from "../src/log";
import { LogModules } from "../src/enum";
import Stream2Event from "socketstream2event";
//------------------------------------------------------------------------------
//Extend GPS core to handle NMEA data by TCP
//------------------------------------------------------------------------------
class GPS_TCP extends GPS_CORE {
  private _host = "127.0.0.1";
  private _port = 2947;

  private _client: net.Socket | null = null;

  constructor() {
    super();
  }
  /**
   * Set host and port for GPS TCP/IP server
   * @param host - Domain/API
   * @param port - Port number
   * @param stopAndStar - If require to stop and start GPS service after change config
   */
  public async config(
    host: string,
    port: number,
    stopAndStart: boolean = false
  ) {
    this._host = host;
    this._port = port;
    if (stopAndStart || this.enable) {
      await this.stop();
      await this.start();
    }
  }
  /**
   * Start GPS service
   * @returns - true if ok
   */
  public async start(): Promise<boolean> {
    this._client = new net.Socket();

    const stream = new Stream2Event([13, 10]);

    stream.addOnData((data: Buffer) => {
      //console.log(data);
      let bufferOriginal = Buffer.from(data);
      //console.log(bufferOriginal.toString('utf8'));
      let nmeaStr = bufferOriginal.toString("utf8");

      let nmeaArr = nmeaStr.split(/.*(?=GPRMC\d)/gm);
      if (nmeaArr.length == 1) this.parseNMEA(nmeaArr[0]);
      else this.parseNMEA(nmeaArr[1]);
    });

    return new Promise((resolve, reject) => {
      this._client?.connect(
        { host: this._host, port: this._port },
        function () {
          resolve(true);
        }
      );

      this._client?.on("data", (data) => {
        stream.parseData(data);
      });

      this._client?.on("close", function () {
        Log.warning(LogModules.gps, "Connection closed");
      });

      this._client?.on("error", (err) => {
        Log.error(LogModules.gps, err.message);
        resolve(false);
      });
    });
  }
  /**
   * Stop GPS service
   * @returns - true if ok
   */
  public async stop(): Promise<boolean> {
    await super.stop();
    this._client?.destroy();
    this._client = null;
    return true;
  }
}

export default new GPS_TCP();
