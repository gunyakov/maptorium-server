//------------------------------------------------------------------------------
//General map handler
//------------------------------------------------------------------------------
import map from "../src/map";
//------------------------------------------------------------------------------
//Exstention to hande Maptorium vector maps
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
    let url = `http://tiles.maptorium.net/${this._info.apiKey}/vector/${z}/${x}/${y}.pbf`;
    return url;
  }
}

export default new ExtMap();
