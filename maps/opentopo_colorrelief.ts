//------------------------------------------------------------------------------
//General map handler
//------------------------------------------------------------------------------
import map from "../src/map";
//------------------------------------------------------------------------------
//Exstention to hande OpenTopoMap/Mapterhorn DEM tiles (color-relief elevation tint)
//------------------------------------------------------------------------------
class ExtMap extends map {
  constructor() {
    super();

    this.storage += "/storage/OpenTopoMap_ColorRelief";
    this._info = {
      id: "opentopomapcolorrelief",
      type: "map",
      name: "Color Relief",
      submenu: "OpenTopoMap",
      tileSize: 512,
      attribution: "DEM: &copy; <a href='https://mapterhorn.com'>mapterhorn.com</a>",
      content: "image/webp",
      format: "dem",
      encoding: "none",
      style: ["opentopomap-colorrelief"],
    };
  }

  async getURL(z: number, x: number, y: number): Promise<string> {
    let url = `https://tiles.mapterhorn.com/${z}/${x}/${y}.webp`;
    return url;
  }
}

export default new ExtMap();
