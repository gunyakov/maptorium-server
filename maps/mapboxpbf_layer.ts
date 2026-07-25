//------------------------------------------------------------------------------
//General map handler
//------------------------------------------------------------------------------
import map from "../src/map";
//------------------------------------------------------------------------------
//Exstention to hande MAPBOX Vector maps as an overlay layer
//------------------------------------------------------------------------------
//Same tiles/storage as mapboxpbf.ts (paired via innerID) - registered under a
//separate id so it can be listed independently in the Layers menu while
//sharing the exact same downloaded tile storage as the "map" entry.
//------------------------------------------------------------------------------
class ExtMap extends map {
  constructor() {
    super();

    this.storage += "/storage/mapbox";
    this._info = {
      id: "mapbox_layer",
      type: "layer",
      name: "MapBox Vector",
      submenu: "MapBOX",
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
      innerID: "mapbox",
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
