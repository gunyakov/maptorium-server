//------------------------------------------------------------------------------
//TileStorage handler
//------------------------------------------------------------------------------
import TileStorage from "../DB/TileStorage";
//------------------------------------------------------------------------------
//Config
//------------------------------------------------------------------------------
import { config as configMain } from "../config/index";
//------------------------------------------------------------------------------
//Axios with config
//------------------------------------------------------------------------------
import httpEngine from "./http-engine.js";
//------------------------------------------------------------------------------
//Extra imports
//------------------------------------------------------------------------------
import { Tile, MapInfo, iNetworkConfig } from "./interface";
//------------------------------------------------------------------------------
//General map handler
//------------------------------------------------------------------------------
const ExecFolder = process.cwd();
import path from "path";
class MapHandler {
  protected storage = path.join(ExecFolder, "..");
  protected _mapVersion = 0;
  //To overwrite in Extended class
  protected _info: MapInfo = {
    id: "def",
    type: "map",
    name: "Default Map Class",
    submenu: "Def",
    tileSize: 256,
    attribution: "",
    content: "image/png",
    format: "rasted",
    encoding: "none",
    apiKey: "",
    headers: {},
  };

  constructor() {}
  //----------------------------------------------------------------------------
  //Return info of Map
  //----------------------------------------------------------------------------
  public getInfo() {
    return this._info;
  }
  //----------------------------------------------------------------------------
  //Return tile download link. To be overwrite in real MAP module
  //----------------------------------------------------------------------------
  public async getURL(z: number, x: number, y: number): Promise<string> {
    return "";
  }
  //----------------------------------------------------------------------------
  //Download tile from network
  //----------------------------------------------------------------------------
  private async _getTileFromNetwork(
    z: number,
    x: number,
    y: number,
    netConfig?: iNetworkConfig
  ) {
    let tileUrl = await this.getURL(z, x, y);
    let http = new httpEngine(netConfig, this._info.headers);
    await http.get(tileUrl, "arraybuffer");
    return http;
  }
  //----------------------------------------------------------------------------
  //Download tile from network and insert
  //----------------------------------------------------------------------------
  public async download(
    z: number,
    x: number,
    y: number,
    netConfig?: iNetworkConfig
  ): Promise<[code: number, response: string, size: number]> {
    let http = await this._getTileFromNetwork(z, x, y, netConfig);
    //If empty tile
    if (http.code == 404) {
      //Save empty tile
      await TileStorage.insert(
        z,
        x,
        y,
        this.storage,
        Buffer.alloc(0),
        0,
        this._mapVersion
      );
    }
    //If tile not empty
    if (http.code == 200) {
      //Insert tile into TileStorage
      await TileStorage.insert(
        z,
        x,
        y,
        this.storage,
        http.response as unknown as Buffer,
        http.byteLength,
        this._mapVersion
      );
    }
    return [http.code, http.response, http.byteLength];
  }
  //----------------------------------------------------------------------------
  //Download tile from network and update
  //----------------------------------------------------------------------------
  public async update(
    z: number,
    x: number,
    y: number,
    netConfig?: iNetworkConfig
  ): Promise<[code: number, response: string, size: number]> {
    let http = await this._getTileFromNetwork(z, x, y, netConfig);
    //If empty tile
    if (http.code == 404) {
      //Update tile in TileStorage
      await TileStorage.update(
        z,
        x,
        y,
        this.storage,
        Buffer.alloc(0),
        0,
        this._mapVersion
      );
    }
    //If tile not empty
    if (http.code == 200) {
      //Update tile in TileStorage
      await TileStorage.update(
        z,
        x,
        y,
        this.storage,
        http.response as unknown as Buffer,
        http.byteLength,
        this._mapVersion
      );
    }
    return [http.code, http.response, http.byteLength];
  }
  /**
   * Check if tile is present in TileStorage.
   * @param {number} z - zoom level
   * @param {number} x - x
   * @param {number} y - y
   * @param {boolean} getFull - if need to get tile from BD fith blob data or just information
   */
  async checkTile(
    z: number,
    x: number,
    y: number,
    getFull: boolean
  ): Promise<[result: boolean, tile: Tile]> {
    //Try to get tile from TileStorage
    let tile = (await TileStorage.getTile(
      z,
      x,
      y,
      this.storage,
      getFull
    )) as Tile;
    //If tile is present in TileStorage
    if (tile) return [true, tile];
    //If tile is missing in TileStorage
    else return [false, tile];
  }
  //----------------------------------------------------------------------------
  //Insert tile (for generate map functions)
  //----------------------------------------------------------------------------
  async save(z: number, x: number, y: number, tile: Buffer): Promise<boolean> {
    let byteLength = Buffer.byteLength(tile);
    //Insert or update tile in TileStorage
    return await TileStorage.insert(z, x, y, this.storage, tile, byteLength);
  }
  //----------------------------------------------------------------------------
  //Update tile (for generate map functions)
  //----------------------------------------------------------------------------
  async rewrite(
    z: number,
    x: number,
    y: number,
    tile: Buffer
  ): Promise<boolean> {
    let byteLength = Buffer.byteLength(tile);
    //Insert or update tile in TileStorage
    return await TileStorage.update(z, x, y, this.storage, tile, byteLength);
  }

  /**
   * Set Api Key for maps what required api key (like MapBox or Maptorium)
   * @param apiKey - Key to access API
   */
  async setApiKey(apiKey: string) {
    console.log(this._info.id, apiKey);
    if (apiKey) this._info.apiKey = apiKey;
  }

  protected async _updateApiKey() {
    if (configMain.apiKeys?.[this._info.id])
      this._info.apiKey = configMain.apiKeys?.[this._info.id];
  }
}

export default MapHandler;
