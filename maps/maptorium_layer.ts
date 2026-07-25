//------------------------------------------------------------------------------
//General map handler
//------------------------------------------------------------------------------
import map from "../src/map";
//------------------------------------------------------------------------------
//Exstention to hande Maptorium vector maps as an overlay layer
//------------------------------------------------------------------------------
//Same tiles/storage as maptorium.ts (paired via innerID) - registered under a
//separate id so it can be listed independently in the Layers menu while
//sharing the exact same downloaded tile storage as the "map" entry.
//------------------------------------------------------------------------------
class ExtMap extends map {
  constructor() {
    super();

    this.storage += "/storage/maptorium";
    this._info = {
      id: "maptorium_layer",
      type: "layer",
      name: "Maptorium Vector",
      submenu: "Maptorium",
      tileSize: 512,
      attribution: "",
      content: "application/x-protobuf",
      format: "vector",
      encoding: "gzip",
      apiKey: "",
      style: [
        "bright_overlay",
        "liberty_overlay",
        "dark_overlay",
        "light_overlay",
        "streets_overlay",
        "toner_overlay",
        "winter_overlay",
        "dataviz_overlay",
        "osm_overlay",
      ],
      innerID: "maptorium",
    };
    this._updateApiKey();
  }

  async getURL(z: number, x: number, y: number): Promise<string> {
    let url = `http://tiles.maptorium.net/${this._info.apiKey}/v1/${z}/${x}/${y}.pbf`;
    return url;
  }
}

export default new ExtMap();
