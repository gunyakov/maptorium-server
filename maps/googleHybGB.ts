//------------------------------------------------------------------------------
//General map handler
//------------------------------------------------------------------------------
import map from "../src/map";
//------------------------------------------------------------------------------
//Exstention to hande Google Hybrid Map
//------------------------------------------------------------------------------
class ExtMap extends map {

  constructor() {
    super();

    this.storage += '/storage/BothGB';
    this._info = {
      id: "googlehybgb",
      type: "layer",
      name: "Google Hybrid (GB)",
      submenu: "Google",
      tileSize: 256,
      attribution: "",
      content: "image/png",
      format: "rasted"
    };
  }

  async getURL(z:number, x:number, y:number):Promise<string> {
    z = 18 - z - 1;
    let url = 'http://mt';
    url += '.google.com/vt/lyrs=h@169000000&hl=gb&';
    url += "zoom=" + z + "&x=" + x + "&y=" + y + "&s=Gali";
    return url;
  }

  async getRandomInt (max:number):Promise<number> {
    return Math.floor(Math.random() * Math.floor(max));
  }
}

export default new ExtMap();