//------------------------------------------------------------------------------
//General map handler
//------------------------------------------------------------------------------
import map from "../src/map";
//------------------------------------------------------------------------------
//Exstention to hande MAPBOX Vector maps
//------------------------------------------------------------------------------
class ExtMap extends map {
  constructor() {
    super();

    this.storage += "/storage/mapbox";
    this._info = {
      id: "mapbox",
      type: "layer",
      name: "MapBox Vector",
      submenu: "MapBOX",
      tileSize: 512,
      attribution: "",
      content: "application/x-protobuf",
      format: "vector",
      encoding: "gzip",
      apiKey: "",
    };
    this._updateApiKey();
  }

  async getURL(z: number, x: number, y: number): Promise<string> {
    //wbw4tKDjEjT5EOx2fCDq
    let url = `https://api.maptiler.com/tiles/v3-openmaptiles/${z}/${x}/${y}.pbf?key=${this._info.apiKey}`;
    return url;
  }
}

export default new ExtMap();
