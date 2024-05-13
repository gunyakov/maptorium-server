//------------------------------------------------------------------------------
//GPS Core
//------------------------------------------------------------------------------
import GPS from "./gps_core";
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
let ClientNmeaSocket2Listener = require("./nmeaSocketClient");
//------------------------------------------------------------------------------
//Nmea parser
//------------------------------------------------------------------------------
import { parseNmeaSentence } from "nmea-simple";
//------------------------------------------------------------------------------
//SOCKET IO
//------------------------------------------------------------------------------
import { sendGPS } from "../src/io";
//------------------------------------------------------------------------------
//Extend GPS core to handle NMEA data by TCP
//------------------------------------------------------------------------------
class GPS_TCP extends GPS {
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
    stopAndStar: boolean = false
  ) {
    this._host = host;
    this._port = port;
    if (stopAndStar) {
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
      let packet: {
        latitude?: number;
        longitude?: number;
        trackTrue?: number;
      } = {};

      try {
        let bufferOriginal = Buffer.from(data.raw);
        //console.log(bufferOriginal.toString('utf8'));
        let nmeaStr = bufferOriginal.toString("utf8");
        let nmeaArr = nmeaStr.split(" +");
        packet = parseNmeaSentence(nmeaArr[1]) as {
          latitude: number;
          longitude: number;
          trackTrue: number;
        };
      } catch (e) {
        if (e instanceof Error) {
          Log.warning(LogModules.gps, e.message);
        } else {
          Log.warning(LogModules.gps, "Unknown error occured.");
        }
      }

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
    });

    //Add event listener when recive messages type HLHUD recive here
    this._nmeaSocketClient.addListener("GPGSA", (data: any) => {
      let bufferOriginal = Buffer.from(data.raw);
      //console.log(bufferOriginal.toString('utf8'));
      const packet = parseNmeaSentence(bufferOriginal.toString("utf8"));
      console.log("data", packet);
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
