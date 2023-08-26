//------------------------------------------------------------------------------
//General map handler
//------------------------------------------------------------------------------
import map from "../src/map";
//------------------------------------------------------------------------------
//Logging service
//------------------------------------------------------------------------------
import Log from "../src/log";
import { LogModules } from "../src/enum";
//------------------------------------------------------------------------------
//Axios with config
//------------------------------------------------------------------------------
import httpEngine from "../src/http-engine.js";
//------------------------------------------------------------------------------
//Exstention to hande Google Sat Map
//------------------------------------------------------------------------------
class ExtMap extends map {

  constructor() {
    super();

    this.storage += '/storage/google';
    this._info = {
      id: "googlesat",
      type: "map",
      name: "Google Satellite",
      submenu: "Google",
      tileSize: 256,
      attribution: "",
      content: "image/jpeg",
      format: "rasted"
    };
  }

  async getURL(z:number, x:number, y:number):Promise<string> {
    await this.getMapVersion();
    let rnd = await this.getRandomInt(4);
    let url = `https://mt${rnd}.google.com/vt/lyrs=s&hl=en&v=${this._mapVersion}&z=${z}&x=${x}&y=${y}`;
    return url;
  }

  async getMapVersion():Promise<void> {
    if(this._mapVersion == 0) {
      this._mapVersion = 917;
      let re = "https://khms\\d+.googleapis\\.com/kh\\?v=(\\d+)";
      //let request = await this.getHTTPAgent();
      let url = 'https://maps.googleapis.com/maps/api/js';
      //request.encoding = "utf-8";
      let http = new httpEngine();
      await http.get(url);
      if (http.code == 200) {
        let mapVersion = http.response.match(re);
        if(mapVersion != null) {
          this._mapVersion = parseInt(mapVersion[1]);
        }
        Log.info(LogModules.http, "Google map version: " + this._mapVersion);
      }
    }
  }

  async getRandomInt(max:number):Promise<number> {
    return Math.floor(Math.random() * Math.floor(max));
  }
}

export default new ExtMap();
