//------------------------------------------------------------------------------
//General map handler
//------------------------------------------------------------------------------
import map from "../src/map";
//------------------------------------------------------------------------------
//Exstention to hande OSM Marine Map (png)
//------------------------------------------------------------------------------
class ExtMap extends map {
  constructor() {
    super();

    this.storage += "/storage/OSM_Marine";
    this._info = {
      id: "osmmarine",
      type: "layer",
      name: "OSM Marine",
      submenu: "Marine",
      tileSize: 256,
      attribution: "",
      content: "image/png",
      format: "rasted",
      encoding: "none",
    };
  }

  async getURL(z: number, x: number, y: number): Promise<string> {
    //z = z - 1;
    let url = "https://tiles.openseamap.org/seamark/";
    url += z + "/" + x + "/" + y + ".png";
    return url;
  }
}

export default new ExtMap();
