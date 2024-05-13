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

    this.storage += "/storage/OSM";
    this._info = {
      id: "osm",
      type: "map",
      name: "OSM",
      submenu: "",
      tileSize: 256,
      attribution:
        "Map data &copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors, " +
        "Imagery © <a href='https://www.mapbox.com/'>Mapbox</a>",
      content: "image/png",
      format: "rasted",
      encoding: "none",
    };
  }

  async getURL(z: number, x: number, y: number): Promise<string> {
    let url = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
    return url;
  }
}

export default new ExtMap();
