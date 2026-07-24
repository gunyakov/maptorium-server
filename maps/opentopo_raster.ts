//------------------------------------------------------------------------------
//General map handler
//------------------------------------------------------------------------------
import map from "../src/map";
//------------------------------------------------------------------------------
//Exstention to hande OpenTopoMap raster maps
//------------------------------------------------------------------------------
class ExtMap extends map {
  constructor() {
    super();

    this.storage += "/storage/OpenTopoMap";
    this._info = {
      id: "opentopomap",
      type: "map",
      name: "OpenTopoMap",
      submenu: "OpenTopoMap",
      tileSize: 256,
      attribution:
        "Kartendaten: &copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>-Mitwirkende, SRTM | " +
        "Kartendarstellung: &copy; <a href='https://opentopomap.org'>OpenTopoMap</a> (CC-BY-SA)",
      content: "image/png",
      format: "rasted",
      encoding: "none",
    };
  }

  async getURL(z: number, x: number, y: number): Promise<string> {
    let url = `https://tile.opentopomap.org/${z}/${x}/${y}.png`;
    return url;
  }
}

export default new ExtMap();
