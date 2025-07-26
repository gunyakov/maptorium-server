//------------------------------------------------------------------------------
//GPS Core
//------------------------------------------------------------------------------
import GPS_CORE from "./gps_core";
import Log from "../src/log";
//------------------------------------------------------------------------------
//HTTP Engine
//------------------------------------------------------------------------------
import axios from "axios";
import https from "https";
import { LogModules } from "../src/enum";
https.globalAgent.options.rejectUnauthorized = false;

//------------------------------------------------------------------------------
//FOS BRIDGE 5.03 interface
//------------------------------------------------------------------------------
interface FOS_BRIDGE {
  cog: {
    status: string;
    value: number;
  };
  hdg: {
    correction: number;
    offset: number;
    status: string;
    value: number;
  };
  hdg_source: string;
  lat: {
    status: string;
    value: number;
  };
  log: {
    status: string;
    value: number;
  };
  log_source: string;
  lon: { status: string; value: number };
  pos: {
    offset: boolean;
  };
  pos_source: string;
  productName: string;
  result: {
    0: {
      code: number;
      operation: string;
      success: boolean;
    };
  };
  rot: {
    status: string;
    value: number;
  };
  rot_source: string;
  sog: {
    status: string;
    value: number;
  };
  time: number;
  xte: number;
}
//------------------------------------------------------------------------------
//Extend GPS core to handle NMEA data by TCP
//------------------------------------------------------------------------------
class GPS_HTTP extends GPS_CORE {
  private _host = "192.168.83.100";
  private _port = 8921;
  private _path = "api/dms/v1.0/request?type=vessel.navdata_request&local=true";

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

  //----------------------------------------------------------------------------
  //Function to get GPS from external source
  //----------------------------------------------------------------------------
  public async getGPSCoords(): Promise<
    { lat: number; lng: number; dir: number } | false
  > {
    //You can import functions from httpJsonServer file and use there.
    //All other like timing beetwen request and so one will be handled in auto by this class.
    return new Promise((resolve, reject) => {
      axios
        .get(`https://${this._host}:${this._port}/${this._path}`, {
          responseType: "json",
          httpsAgent: new https.Agent(),
        })
        .then((response) => {
          if (response.status == 200) {
            //Get Coords from JSON responce
            const lat = response.data.lat.value;
            const lng = response.data.lon.value;
            const dir = response.data.hdg.value;
            resolve({ lat, lng, dir });
          }
        })
        .catch((e) => {
          Log.error(LogModules.gps, "FOS HTTPS Request Error");
          resolve(false);
        });
    });
  }
}

export default new GPS_HTTP();
