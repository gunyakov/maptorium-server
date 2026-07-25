//------------------------------------------------------------------------------
//General map handler
//------------------------------------------------------------------------------
import map from "../src/map";
import TileStorage from "../DB/TileStorage";
import httpEngine from "../src/http-engine.js";
import { iNetworkConfig } from "../src/interface";
import sharp from "sharp";
import mlcontour from "maplibre-contour";

const { LocalDemManager, decodeParsedImage } = mlcontour;
//------------------------------------------------------------------------------
//Contour line thresholds per zoom (elevation distance in meters between
//[minor, major] contour lines) - matches OpenTopoMap's own vector viewer config
//(opentopomap.org/vector, inline demSource.contourProtocolUrl() call) so cached
//contour tiles look the same as OTM's live-computed ones.
//------------------------------------------------------------------------------
const CONTOUR_THRESHOLDS: { [zoom: number]: number[] } = {
  10: [50, 1000],
  11: [20, 500],
  12: [10, 100],
  13: [10, 100],
  14: [10, 100],
  15: [10, 50],
};

function levelsForZoom(zoom: number): number[] {
  let levels: number[] = [];
  let maxLessThanOrEqualTo = -Infinity;
  for (const zString of Object.keys(CONTOUR_THRESHOLDS)) {
    const z = Number(zString);
    if (z <= zoom && z > maxLessThanOrEqualTo) {
      maxLessThanOrEqualTo = z;
      levels = CONTOUR_THRESHOLDS[z] as number[];
    }
  }
  return levels;
}
//------------------------------------------------------------------------------
//Exstention to bake OpenTopoMap/Mapterhorn DEM tiles into cacheable contour
//vector tiles. There's no single tile URL for contours - OTM computes them
//live in-browser via maplibre-contour reading the raster-dem tiles. Here we
//run the same (dependency-free) isoline/vtpbf core server-side so contour
//behaves like every other vector map in this app: plain cached pbf bytes,
//generic client rendering, works fully offline once cached.
//------------------------------------------------------------------------------
//Mapterhorn's DEM coverage isn't uniform globally - some regions (e.g. much
//of the Balkans) only have real tiles up to a lower native zoom than others
//(e.g. the Alps, which have tiles up to z15). A 404 for any one of the 3x3
//neighbor tiles fetchContourTile needs would otherwise abort generation for
//the *whole* tile (Promise.all rejects on the first failure), which is what
//was producing widespread 404s from our own /tile endpoint. Mark those with
//this sentinel blob type and treat them as flat (0m) terrain in _decodeImage
//instead, so contour generation still succeeds - correctly yielding no (or
//partial) contour lines where there's genuinely no elevation data, rather
//than failing the tile outright.
const FLAT_DEM_BLOB_TYPE = "application/x-flat-dem";
//Mapterhorn's real tiles all decode to 512x512 - match that so a synthetic
//flat tile stitches correctly with real neighbors in HeightTile.combineNeighbors.
const DEM_TILE_SIZE = 512;

//------------------------------------------------------------------------------
//Limit concurrent contour tile generations. Each one fans out up to 9 DEM
//sub-fetches to tiles.mapterhorn.com; letting every simultaneous /tile
//request for this map kick off its own unbounded fan-out (e.g. while
//panning/zooming, the browser can have dozens of tile requests in flight at
//once) overwhelms the upstream host and starts timing many of them out
//instead of a smaller number succeeding quickly one after another.
//------------------------------------------------------------------------------
const MAX_CONCURRENT_GENERATIONS = 4;
let _activeGenerations = 0;
const _generationQueue: Array<() => void> = [];

async function acquireGenerationSlot(): Promise<void> {
  if (_activeGenerations >= MAX_CONCURRENT_GENERATIONS) {
    await new Promise<void>((resolve) => _generationQueue.push(resolve));
  }
  _activeGenerations++;
}

function releaseGenerationSlot(): void {
  _activeGenerations--;
  _generationQueue.shift()?.();
}

class ExtMap extends map {
  private _netConfig: iNetworkConfig | undefined;

  private _getTile = async (url: string) => {
    const http = new httpEngine(this._netConfig);
    await http.get(url, "arraybuffer");
    if (http.code == 404) {
      return { data: new Blob([], { type: FLAT_DEM_BLOB_TYPE }) };
    }
    if (http.code != 200) {
      throw new Error(`Bad response ${http.code} for ${url}`);
    }
    const buffer = http.response as unknown as Buffer;
    return { data: new Blob([buffer as unknown as BlobPart]) };
  };

  private _decodeImage = async (blob: Blob, encoding: "terrarium" | "mapbox") => {
    if (blob.type == FLAT_DEM_BLOB_TYPE) {
      return {
        width: DEM_TILE_SIZE,
        height: DEM_TILE_SIZE,
        data: new Float32Array(DEM_TILE_SIZE * DEM_TILE_SIZE),
      };
    }
    const arrayBuffer = await blob.arrayBuffer();
    const { data, info } = await sharp(Buffer.from(arrayBuffer))
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const rgba = new Uint8ClampedArray(data.buffer, data.byteOffset, data.length);
    return decodeParsedImage(info.width, info.height, encoding, rgba);
  };

  private _manager = new LocalDemManager({
    demUrlPattern: "https://tiles.mapterhorn.com/{z}/{x}/{y}.webp",
    cacheSize: 100,
    encoding: "terrarium",
    maxzoom: 15,
    timeoutMs: 20_000,
    getTile: this._getTile,
    decodeImage: this._decodeImage,
  });

  constructor() {
    super();

    this.storage += "/storage/OpenTopoMap_Contour";
    this._info = {
      id: "opentopomapcontour",
      type: "layer",
      name: "Contours",
      submenu: "OpenTopoMap",
      tileSize: 512,
      attribution: "DEM: &copy; <a href='https://mapterhorn.com'>mapterhorn.com</a>",
      content: "application/x-protobuf",
      format: "vector",
      encoding: "none",
      style: ["opentopomap-contour"],
    };
  }

  //----------------------------------------------------------------------------
  //Generate contour tile from DEM and insert/update it in TileStorage
  //----------------------------------------------------------------------------
  private async _generate(
    z: number,
    x: number,
    y: number,
    netConfig: iNetworkConfig | undefined,
    isUpdate: boolean,
  ): Promise<[code: number, response: string, size: number]> {
    this._netConfig = netConfig;
    const levels = levelsForZoom(z);
    //Below the lowest configured zoom there are no contour lines to draw,
    //same as OpenTopoMap's own viewer - cache as a definitively-empty tile.
    if (levels.length === 0) {
      const empty = Buffer.alloc(0);
      if (isUpdate) await TileStorage.update(z, x, y, this.storage, empty, 0, this._mapVersion);
      else await TileStorage.insert(z, x, y, this.storage, empty, 0, this._mapVersion);
      return [404, "", 0];
    }
    await acquireGenerationSlot();
    try {
      const abortController = new AbortController();
      const result = await this._manager.fetchContourTile(z, x, y, { levels }, abortController);
      const buffer = Buffer.from(result.arrayBuffer);
      if (isUpdate) {
        await TileStorage.update(z, x, y, this.storage, buffer, buffer.byteLength, this._mapVersion);
      } else {
        await TileStorage.insert(z, x, y, this.storage, buffer, buffer.byteLength, this._mapVersion);
      }
      return [200, buffer as unknown as string, buffer.byteLength];
    } catch (e) {
      console.error(`opentopomapcontour: failed to generate tile ${z}/${x}/${y}`, e);
      return [0, "", 0];
    } finally {
      releaseGenerationSlot();
    }
  }

  async download(
    z: number,
    x: number,
    y: number,
    netConfig?: iNetworkConfig,
  ): Promise<[code: number, response: string, size: number]> {
    return this._generate(z, x, y, netConfig, false);
  }

  async update(
    z: number,
    x: number,
    y: number,
    netConfig?: iNetworkConfig,
  ): Promise<[code: number, response: string, size: number]> {
    return this._generate(z, x, y, netConfig, true);
  }
}

export default new ExtMap();
