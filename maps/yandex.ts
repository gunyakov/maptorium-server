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

    this.storage += "/storage/yandex";
    this._info = {
      id: "yandexsat",
      type: "map",
      name: "Yandex Satellite",
      submenu: "Yandex",
      tileSize: 256,
      attribution: "Satellite (Yandex.Maps)",
      content: "image/jpeg",
      format: "rasted",
      encoding: "none",
    };
  }

  async getURL(z: number, x: number, y: number): Promise<string> {
    let url = `https://core-sat.maps.yandex.net/tiles?l=sat&v=3.941.0&x=${x}&y=${y}&z=${z}&scale=1&lang=ru_RU`;
    //let url = `https://sat0${rnd}.maps.yandex.net/tiles?l=sat&scale=1&lang=ru_RU&x=${x}&y=${y}&z=${z}`;
    return url;
  }
}

export default new ExtMap();
