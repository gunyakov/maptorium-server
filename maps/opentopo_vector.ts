//------------------------------------------------------------------------------
//General map handler
//------------------------------------------------------------------------------
import map from "../src/map";
//------------------------------------------------------------------------------
//Exstention to hande OpenTopoMap vector data (roads, buildings, labels...)
//------------------------------------------------------------------------------
class ExtMap extends map {
  constructor() {
    super();

    this.storage += "/storage/OpenTopoMap_Vector";
    this._info = {
      id: "opentopomapvector",
      type: "layer",
      name: "Vector",
      submenu: "OpenTopoMap",
      tileSize: 512,
      attribution:
        "Map style: &copy; <a href='https://opentopomap.org'>OpenTopoMap</a>, " +
        "Map data &copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors",
      content: "application/x-protobuf",
      format: "vector",
      encoding: "gzip",
      style: ["opentopomap"],
    };
  }

  async getURL(z: number, x: number, y: number): Promise<string> {
    let url = `https://opentopomap.org/otm/${z}/${x}/${y}.pbf`;
    return url;
  }
}

export default new ExtMap();
