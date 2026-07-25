import MapHandler from "../src/map";
import { MapInfo } from "../src/interface";
import { setDefConfig, userConfig } from "../config/index";

import arcgis_elevation from "./arcgis_elevation";
import arcgis_sat from "./arcgis_sat";
import arcgis_vector from "./arcgis_vector";
import google from "./google";
import google_topo from "./google_topo";
import googleHybGB from "./googleHybGB";
import googleHybRU from "./googleHybRU";
import mapboxpbf from "./mapboxpbf";
import mapbox3d from "./mapbox3d";
import mapboxhilshade from "./mapboxhilshade";
import mapboxterraine from "./mapboxterraine";
import osmmarine from "./osm-marine";
import osm from "./osm";
import yandex from "./yandex";
import yandexHyb from "./yandexHyb";
import maptorium from "./maptorium";
import maptoriumLayer from "./maptorium_layer";
import mapboxpbfLayer from "./mapboxpbf_layer";
import navionics from "./navionics";
import garminmarine from "./garminmarine";
import opentopo_raster from "./opentopo_raster";
import opentopo_vector from "./opentopo_vector";
import opentopo_hillshade from "./opentopo_hillshade";
import opentopo_colorrelief from "./opentopo_colorrelief";
import opentopo_contour from "./opentopo_contour";

let arrMaps: { [id: string]: MapHandler } = {};
let arrMapsInfo: Array<MapInfo> = [];

async function initMap(mapHandler: MapHandler) {
  //Get map info from Module
  let mapInfo = await mapHandler.getInfo();
  //Save map handler for future use
  arrMaps[mapInfo.id] = mapHandler;
  //Push info of map into array
  arrMapsInfo.push(mapInfo);
}

initMap(arcgis_elevation);
initMap(arcgis_sat);
initMap(arcgis_vector);
initMap(google);
initMap(google_topo);
initMap(googleHybGB);
initMap(googleHybRU);
initMap(mapboxpbf);
initMap(mapboxhilshade);
initMap(osmmarine);
initMap(osm);
initMap(yandex);
initMap(yandexHyb);
initMap(maptorium);
initMap(maptoriumLayer);
initMap(mapboxpbfLayer);
initMap(mapbox3d);
initMap(mapboxterraine);
initMap(navionics);
initMap(garminmarine);
initMap(opentopo_raster);
initMap(opentopo_vector);
initMap(opentopo_hillshade);
initMap(opentopo_colorrelief);
initMap(opentopo_contour);

export function getMapHandler(mapID: string): MapHandler {
  return arrMaps[mapID];
}

export function checkMapHandler(mapID: string): boolean {
  if (arrMaps[mapID]) return true;
  else return false;
}

export function getMapsInfo(): Array<MapInfo> {
  return Object.values(arrMaps).map((mapHandler) => mapHandler.getInfo());
}

/**
 * Other registered map ids sharing the same innerID as mapID (e.g. the "map"
 * and "layer" entries for the same underlying provider) - these must be kept
 * in sync for anything tied to the real tile source (storage path, api key).
 * Returns an empty array if mapID has no innerID or no siblings.
 */
export function getSiblingMapIDs(mapID: string): Array<string> {
  const innerID = arrMaps[mapID]?.getInfo().innerID;
  if (!innerID) return [];
  return Object.values(arrMaps)
    .map((mapHandler) => mapHandler.getInfo())
    .filter((info) => info.id !== mapID && info.innerID === innerID)
    .map((info) => info.id);
}

export async function setMapStoragePath(
  mapID: string,
  storagePath: string,
  save: boolean = true,
): Promise<boolean> {
  if (!arrMaps[mapID]) return false;
  const isUpdated = arrMaps[mapID].setpath(storagePath);
  if (!isUpdated) return false;

  //Keep sibling ids sharing the same underlying tile source on the same path
  const siblingIDs = getSiblingMapIDs(mapID);
  for (const siblingID of siblingIDs) {
    arrMaps[siblingID]?.setpath(storagePath);
  }

  if (!save) return true;

  const mapStoragePaths = { ...(userConfig.mapStoragePaths || {}) };
  for (const id of [mapID, ...siblingIDs]) {
    mapStoragePaths[id] = arrMaps[id].getPath();
  }
  return await setDefConfig("mapStoragePaths", mapStoragePaths, true);
}

export async function applyMapStoragePaths(): Promise<void> {
  const mapStoragePaths = userConfig.mapStoragePaths || {};
  const mapIDs = Object.keys(mapStoragePaths);

  for (let i = 0; i < mapIDs.length; i++) {
    const mapID = mapIDs[i];
    if (!arrMaps[mapID]) continue;
    await setMapStoragePath(mapID, mapStoragePaths[mapID], false);
  }
}

export { arrMaps, arrMapsInfo };
