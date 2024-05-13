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

    this.storage += "/storage/maptorium";
    this._info = {
      id: "maptorium",
      type: "layer",
      name: "Maptorium Vector",
      submenu: "Maptorium",
      tileSize: 256,
      attribution: "",
      content: "application/x-protobuf",
      format: "vector",
      encoding: "gzip",
    };
  }

  async getURL(z: number, x: number, y: number): Promise<string> {
    let url = `http://127.0.0.1:9010/${z}/${x}/${y}.pbf`;
    return url;
  }
}

export default new ExtMap();
