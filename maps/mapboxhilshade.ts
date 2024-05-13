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

    this.storage += "/storage/mapboxhillshade";
    this._info = {
      id: "mapboxhillshade",
      type: "layer",
      name: "Hillshade",
      submenu: "MapBOX",
      tileSize: 512,
      attribution: "",
      content: "image/webp",
      format: "rasted",
      encoding: "none",
    };
  }

  async getURL(z: number, x: number, y: number): Promise<string> {
    z--;
    let url = `https://api.maptiler.com/tiles/hillshade/${z}/${x}/${y}.webp?key=gbetYLSD5vR8MdtZ88AQ`;
    return url;
  }
}

export default new ExtMap();
