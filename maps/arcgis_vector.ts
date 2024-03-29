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

    this.storage += '/storage/ArcGIS_Vector';
    this._info = {
      id: "arcgisvector",
      type: "layer",
      name: "ArcGIS Vector",
      submenu: "ArcGIS",
      tileSize: 256,
      attribution: "",
      content: "application/x-protobuf",
      format: "vector"
    };
  }

  async getURL(z:number, x:number, y:number):Promise<string> {
    let url = `https://server.arcgisonline.com/arcgis/rest/services/Elevation/World_Hillshade/MapServer/tile/${z}/${y}/${x}`;
    return url;
  }
}

export default new ExtMap();
