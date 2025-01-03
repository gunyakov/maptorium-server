//------------------------------------------------------------------------------
//General map handler
//------------------------------------------------------------------------------
import map from "../src/map";
//------------------------------------------------------------------------------
//Exstention to hande MAPBOX Terrain maps
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
      apiKey: "",
    };
  }

  async getURL(z: number, x: number, y: number): Promise<string> {
    z--;
    let url = `https://api.maptiler.com/tiles/terrain-rgb-v2/${z}/${x}/${y}.webp?key=${this._info.apiKey}`;
    return url;
  }
}

export default new ExtMap();
