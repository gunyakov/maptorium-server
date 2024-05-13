//------------------------------------------------------------------------------
//General map handler
//------------------------------------------------------------------------------
import map from "../src/map";
//------------------------------------------------------------------------------
//Exstention to hande OSM maps
//------------------------------------------------------------------------------
class ExtMap extends map {
  constructor() {
    super();

    this.storage += "/storage/ArcGIS_Sat";
    this._info = {
      id: "arcgissat",
      type: "map",
      name: "ArcGIS Satellite",
      submenu: "ArcGIS",
      tileSize: 256,
      attribution: "",
      content: "image/jpeg",
      format: "rasted",
      encoding: "none",
    };
  }

  async getURL(z: number, x: number, y: number): Promise<string> {
    //z--;
    let url = `https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
    return url;
  }
}

export default new ExtMap();
