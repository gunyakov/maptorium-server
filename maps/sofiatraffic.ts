//------------------------------------------------------------------------------
//General map handler
//------------------------------------------------------------------------------
import map from "../src/map";
//------------------------------------------------------------------------------
//Exstention to hande SofiaTraffic maps
//------------------------------------------------------------------------------
class ExtMap extends map {
  constructor() {
    super();

    this.storage += "/storage/sofiatraffic";
    this._info = {
      id: "sofiatraffic",
      type: "layer",
      name: "Sofia Traffic",
      submenu: "Sofia Traffic",
      tileSize: 256,
      attribution: "",
      content: "application/x-protobuf",
      format: "vector",
      encoding: "none",
    };
  }

  async getURL(z: number, x: number, y: number): Promise<string> {
    let url = `https://www.sofiatraffic.bg/interactivecard/maps/sumc/${z}/${x}/${y}.vector.pbf`;
    return url;
  }
}

export default new ExtMap();
