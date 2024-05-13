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

    this.storage += "/storage/mapbox3d";
    this._info = {
      id: "mapbox3d",
      type: "layer",
      name: "MapBox 3D Tiles",
      submenu: "MapBOX",
      tileSize: 256,
      attribution: "",
      content: "application/x-protobuf",
      format: "vector",
      encoding: "none",
    };
  }

  async getURL(z: number, x: number, y: number): Promise<string> {
    //let url = `http://127.0.0.1:9010/${z}/${x}/${y}.pbf`;
    let url = `https://api.mapbox.com/v4/mapbox.mapbox-bathymetry-v2,mapbox.mapbox-streets-v8,mapbox.mapbox-terrain-v2,mapbox.mapbox-models-v1/${z}/${x}/${y}.vector.pbf?sku=101EqLAievT4q&access_token=pk.eyJ1IjoibWFwYm94LW1hcC1kZXNpZ24iLCJhIjoiY2xrc2pzc2VuMDFybTNlcXQwOG9ieXFxeSJ9.tFV8YJxUOkHxcaZ70BQiUg`;
    return url;
  }
}

export default new ExtMap();
