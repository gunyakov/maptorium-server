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

    this.storage += "/storage/mapboxterraine";
    this._info = {
      id: "mapboxterraine",
      type: "layer",
      name: "Terraine",
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
    let url = `https://api.maptiler.com/tiles/terrain-rgb-v2/${z}/${x}/${y}.webp?key=Te86e6irxQ673m7olJqV`;
    return url;
  }
}

export default new ExtMap();
