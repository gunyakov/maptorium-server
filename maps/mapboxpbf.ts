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

    this.storage += "/storage/mapbox";
    this._info = {
      id: "mapbox",
      type: "layer",
      name: "MapBox Vector",
      submenu: "MapBOX",
      tileSize: 256,
      attribution: "",
      content: "application/x-protobuf",
      format: "vector",
      encoding: "none",
    };
  }

  async getURL(z: number, x: number, y: number): Promise<string> {
    let url = `https://api.maptiler.com/tiles/v3/${z}/${x}/${y}.pbf?key=Te86e6irxQ673m7olJqV`;
    return url;
  }
}

export default new ExtMap();
