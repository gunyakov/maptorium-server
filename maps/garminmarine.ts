//------------------------------------------------------------------------------
//General map handler
//------------------------------------------------------------------------------
import map from "../src/map";
//------------------------------------------------------------------------------
//Axios with config
//------------------------------------------------------------------------------
import httpEngine from "../src/http-engine.js";
import axios from "axios";
import http from "node:http";
import https from "node:https";
const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });
//------------------------------------------------------------------------------
//Exstention to hande OSM Marine Map (png)
//------------------------------------------------------------------------------
class ExtMap extends map {
  private _token: string = "";
  //Token time live 5 minute
  private _cTTL = 5 * 60 * 1000;
  private _tokenTime: number = 0;

  constructor() {
    super();

    this.storage += "/storage/Garmin_marine";
    this._info = {
      id: "garminmarine",
      type: "map",
      name: "Garmin Marine",
      submenu: "Marine",
      tileSize: 256,
      attribution: "",
      content: "image/png",
      format: "rasted",
      encoding: "none",
      headers: {
        Referer: "https://maps.garmin.com/",
        Origin: "https://maps.garmin.com",
        // "Sec-Fetch-Dest": "image",
        // "Sec-Fetch-Mode": "cors",
        // "Sec-Fetch-Site": "same-site",
        // Priority: "u=0, i",
        // TE: "trailers",
        // Accept:
        //   "image/avif,image/webp,image/png,image/svg+xml,image/*;q=0.8,*/*;q=0.5",
        // "Accept-Language": "bg,en-US;q=0.7,en;q=0.3",
        // "Accept-Encoding": "gzip, deflate, br, zstd",
      },
    };
  }

  async getURL(z: number, x: number, y: number): Promise<string> {
    //z = z - 1;
    const rnd = await this.getRandomInt(4);
    const token = await this.getToken();
    let url = `https://mcv${rnd}.marine.garmin.com/api/tile/${z}/${x}/${y}.png?units=m&charttype=nav&safetydepth=5&token=${token}`;
    //let url = `https://tile${rnd}.navionics.com/tile/${z}/${x}/${y}?LAYERS=config_1_1_0&TRANSPARENT=FALSE&theme=0&navtoken=${token}`;
    return url;
  }

  async getRandomInt(max: number): Promise<number | string> {
    const rnd = Math.floor(Math.random() * Math.floor(max));
    if (rnd == 0) return "";
    else return rnd;
  }

  async getToken(): Promise<string | false> {
    const VRequestUrl = "https://mcv.marine.garmin.com/api/token";

    if (
      this._token &&
      this._tokenTime &&
      Date.now() - this._tokenTime < this._cTTL
    ) {
      return this._token;
    } else {
      let http = new httpEngine(undefined, {
        "X-API-Key": "0E0223B5-F24A-4494-9A60-A969CDE7FFAF",
        Origin: "https://maps.garmin.com",
        Referer: "https://maps.garmin.com/",
      });
      await http.get(VRequestUrl, "text");
      if (http.code == 200) {
        this._token = http.response;
        this._tokenTime = Date.now();
        return http.response;
      } else {
        return false;
      }
    }
  }
}

export default new ExtMap();
