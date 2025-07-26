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
  //Token time live 12 hours
  private _cTTL = 12 * 60 * 60 * 1000;
  private _tokenTime: number = 0;

  constructor() {
    super();

    this.storage += "/storage/Navionics";
    this._info = {
      id: "navionics",
      type: "map",
      name: "Navionics",
      submenu: "Marine",
      tileSize: 256,
      attribution: "",
      content: "image/png",
      format: "rasted",
      encoding: "none",
      headers: {
        Referer: "https://maps.garmin.com/",
        Origin: "https://maps.garmin.com",
      },
    };
  }

  async getURL(z: number, x: number, y: number): Promise<string> {
    //z = z - 1;
    const rnd = await this.getRandomInt(4);
    const token = await this.getToken();
    let url = `https://tile${rnd}.navionics.com/tile/${z}/${x}/${y}?LAYERS=config_1_1_0&TRANSPARENT=FALSE&theme=0&navtoken=${token}`;
    //console.log(url);
    return url;
  }

  async getRandomInt(max: number): Promise<number> {
    let rnd = Math.floor(Math.random() * Math.floor(max));
    if (rnd == 0) return 1;
    return rnd;
  }

  async getToken(): Promise<string | false> {
    const VRequestUrl =
      "https://tile1.navionics.com/tile/get_key/Navionics_webapi_04041/maps.garmin.com";
    const thisClass = this;
    console.log(Date.now() - thisClass._tokenTime, thisClass._cTTL);
    return new Promise((resolve, reject) => {
      if (
        thisClass._token &&
        thisClass._tokenTime &&
        Date.now() - thisClass._tokenTime < thisClass._cTTL
      ) {
        resolve(thisClass._token);
      } else {
        axios
          .get(VRequestUrl, {
            responseType: "text",
            timeout: 10000,
            httpAgent: httpAgent,
            httpsAgent: httpsAgent,
            headers: {
              Origin: "https://maps.garmin.com/",
              Referer: "https://maps.garmin.com/",
              "User-Agent":
                "Mozilla/5.0 (X11; Linux x86_64; rv:134.0) Gecko/20100101 Firefox/134.0",
            },
          })
          .then((response) => {
            thisClass._token = response.data;
            thisClass._tokenTime = Date.now();
            resolve(response.data);
          })
          .catch((e) => {
            console.log(e.cause.code);
            resolve(false);
          });
      }
    });
  }
}

export default new ExtMap();
