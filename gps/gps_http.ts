//------------------------------------------------------------------------------
//GPS Core
//------------------------------------------------------------------------------
import GPS_CORE from "./gps_core";
//------------------------------------------------------------------------------
//HTTP Engine
//------------------------------------------------------------------------------
import httpEngine from "../src/http-engine";
//------------------------------------------------------------------------------
//Extend GPS core to handle NMEA data by TCP
//------------------------------------------------------------------------------
class GPS_HTTP extends GPS_CORE {
  private _host = "192.168.1.110";
  private _port = 8080;
  private _path = "SDBnet/online/live/fetchLive";

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
    stopAndStart: boolean = false,
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
    | false
    | {
        lat: number;
        lng: number;
        dir: number;
      }
  > {
    //You can import functions from httpJsonServer file and use there.
    //All other like timing beetwen request and so one will be handled in auto by this class.
    let lat = 0;
    let lng = 0;
    let http = new httpEngine();
    await http.get(
      `http://${this._host}:${this._port}/${this._path}`,
      "json",
      true,
      "get",
      "",
      "JSESSIONID=2206FC81F0525B2E3900904237975B28",
    );
    //If server return proper responce
    if (http.code == 200) {
      //Get Coords from JSON responce
      //@ts-ignore
      lng = parseFloat(http.response["lon_decimal"]);
      //@ts-ignore
      lat = parseFloat(http.response["lat_decimal"]);
      this._lat = lat;
      this._lng = lng;
      this._update = true;
      return {
        lat,
        lng,
        dir: this._dir,
      };
    }

    return false;
  }
}

export default new GPS_HTTP();
