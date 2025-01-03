//------------------------------------------------------------------------------
//GPS Core
//------------------------------------------------------------------------------
import GPS_CORE from "./gps_core";
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
//Socket client to event converter
//------------------------------------------------------------------------------
//@ts-ignore
import ClientNmeaSocket2Listener from "./nmeaSocketClient.js";
//------------------------------------------------------------------------------
//Extend GPS core to handle NMEA data by TCP
//------------------------------------------------------------------------------
class GPS_TCP extends GPS_CORE {
  private _host = "127.0.0.1";
  private _port = 9010;

  private _nmeaSocketClient: typeof ClientNmeaSocket2Listener | null = null;

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
    if (stopAndStart) {
      await this.stop();
      await this.start();
    }
  }
  /**
   * Start GPS service
   * @returns - true if ok
   */
  public async start(): Promise<boolean> {
    this._nmeaSocketClient = new ClientNmeaSocket2Listener({
      ip: this._host,
      port: this._port,
      log: false,
      autoReconnect: false,
    });
    this._nmeaSocketClient.addListener("GPRMC", (data: any) => {
      let bufferOriginal = Buffer.from(data.raw);
      //console.log(bufferOriginal.toString('utf8'));
      let nmeaStr = bufferOriginal.toString("utf8");
      let nmeaArr = nmeaStr.split(" +");
      this.parseNMEA(nmeaArr[1]);
    });

    //Add event listener when recive messages type HLHUD recive here
    this._nmeaSocketClient.addListener("GPGSA", (data: any) => {
      let bufferOriginal = Buffer.from(data.raw);
      //console.log(bufferOriginal.toString('utf8'));
      this.parseNMEA(bufferOriginal.toString("utf8"));
    });

    this._nmeaSocketClient.onDisconnect(async () => {
      Log.warning(LogModules.gps, "Disconnected from GPS TCP/IP Server.");
      await wait(10000);
      Log.info(LogModules.gps, "Trying to reconnect to GPS TCP/IP Server.");
      this._nmeaSocketClient.connect();
    });
    //Make link to current class
    let thisClass = this;
    //Return new Promise
    return new Promise((resolve, reject) => {
      //Set timeout to resolve false in case of connect failed
      let timer = setTimeout(() => {
        resolve(false);
      }, 2000);
      //Register callback handle for connect
      this._nmeaSocketClient.onConnect(async () => {
        //Make log
        Log.success(LogModules.gps, "Connected to GPS TCP/IP Server.");
        //Execute code from parrent class
        await super.start();
        //Clear timer
        clearTimeout(timer);
        //Resolve that connection done
        resolve(true);
      });
      //Try to connect
      thisClass._nmeaSocketClient.connect();
    });
  }
  /**
   * Stop GPS service
   * @returns - true if ok
   */
  public async stop(): Promise<boolean> {
    this._nmeaSocketClient.disconnect();
    await super.stop();
    this._nmeaSocketClient = null;
    return true;
  }
}

export default new GPS_TCP();
