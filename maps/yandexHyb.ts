//------------------------------------------------------------------------------
//General map handler
//------------------------------------------------------------------------------
import map from "../src/map";
//------------------------------------------------------------------------------
//Exstention to hande Google Sat Map
//------------------------------------------------------------------------------
class ExtMap extends map {

  constructor() {
    super();

    this.storage += '/storage/yandex_hyb';
    this._info = {
      id: "yandexhyb",
      type: "layer",
      name: "Yandex Hybrid",
      submenu: "Yandex",
      tileSize: 256,
      attribution: "Hybrid (Yandex.Maps)",
      content: "image/png",
      format: "rasted"
    };
  }

  async getURL(z:number, x:number, y:number):Promise<string> {
    let url = `https://core-renderer-tiles.maps.yandex.net/tiles?l=skl&x=${x}&y=${y}&z=${z}&scale=1&lang=ru_RU`;
    return url;
  }

}

export default new ExtMap();
