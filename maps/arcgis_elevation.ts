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

    this.storage += "/storage/ArcGIS_Elevation";
    this._info = {
      id: "arcgiselevation",
      type: "map",
      name: "ArcGIS Elevation",
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
    let url = `https://server.arcgisonline.com/arcgis/rest/services/Elevation/World_Hillshade/MapServer/tile/${z}/${y}/${x}`;
    return url;
  }
}

export default new ExtMap();
