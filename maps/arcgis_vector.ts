//------------------------------------------------------------------------------
//General map handler
//------------------------------------------------------------------------------
import map from "../src/map";
//------------------------------------------------------------------------------
//Exstention to hande ArcGIS Vector maps
//------------------------------------------------------------------------------
class ExtMap extends map {
  constructor() {
    super();

    this.storage += "/storage/ArcGIS_Vector";
    this._info = {
      id: "arcgisvector",
      type: "map",
      name: "ArcGIS Vector",
      submenu: "ArcGIS",
      tileSize: 512,
      attribution: "",
      content: "application/x-protobuf",
      format: "vector",
      encoding: "gzip",
    };
  }

  async getURL(z: number, x: number, y: number): Promise<string> {
    let url = `https://basemaps.arcgis.com/arcgis/rest/services/World_Basemap_v2/VectorTileServer/tile/${z}/${y}/${x}.pbf`;
    return url;
  }
}

export default new ExtMap();
