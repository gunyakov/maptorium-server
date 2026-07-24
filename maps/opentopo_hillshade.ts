//------------------------------------------------------------------------------
//General map handler
//------------------------------------------------------------------------------
import map from "../src/map";
//------------------------------------------------------------------------------
//Exstention to hande OpenTopoMap/Mapterhorn DEM tiles (hillshade rendering)
//------------------------------------------------------------------------------
class ExtMap extends map {
  constructor() {
    super();

    this.storage += "/storage/OpenTopoMap_Hillshade";
    this._info = {
      id: "opentopomaphillshade",
      type: "map",
      name: "Hillshade",
      submenu: "OpenTopoMap",
      tileSize: 512,
      attribution: "DEM: &copy; <a href='https://mapterhorn.com'>mapterhorn.com</a>",
      content: "image/webp",
      format: "dem",
      encoding: "none",
      style: "opentopomap-hillshade",
    };
  }

  async getURL(z: number, x: number, y: number): Promise<string> {
    let url = `https://tiles.mapterhorn.com/${z}/${x}/${y}.webp`;
    return url;
  }
}

export default new ExtMap();
