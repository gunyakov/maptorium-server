//------------------------------------------------------------------------------
//General map handler
//------------------------------------------------------------------------------
import map from "../src/map";
//------------------------------------------------------------------------------
//Extension to handle Google Topo Map
//------------------------------------------------------------------------------
class ExtMap extends map {
  constructor() {
    super();

    this.storage += "/storage/google_topo";
    this._info = {
      id: "google_topo",
      type: "map",
      name: "Google Topo",
      submenu: "Google",
      tileSize: 256,
      attribution: "",
      content: "image/jpeg",
      format: "rasted",
      encoding: "none",
    };
  }

  async getURL(z: number, x: number, y: number): Promise<string> {
    let rnd = await this.getRandomInt(4);
    let url = `https://mt${rnd}.google.com/vt/lyrs=p&x=${x}&y=${y}&z=${z}`;
    return url;
  }

  async getRandomInt(max: number): Promise<number> {
    return Math.floor(Math.random() * Math.floor(max));
  }
}

export default new ExtMap();
