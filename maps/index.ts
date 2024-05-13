import MapHandler from "../src/map";
import { MapInfo } from "../src/interface";

import arcgis_elevation from "./arcgis_elevation";
import arcgis_sat from "./arcgis_sat";
import arcgis_vector from "./arcgis_vector";
import google from "./google";
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
initMap(googleHybGB);
initMap(googleHybRU);
initMap(mapboxpbf);
initMap(mapboxhilshade);
initMap(osmmarine);
initMap(osm);
initMap(yandex);
initMap(yandexHyb);
initMap(maptorium);
initMap(mapbox3d);
initMap(mapboxterraine);

export function getMapHandler(mapID: string): MapHandler {
  return arrMaps[mapID];
}

export function checkMapHandler(mapID: string): boolean {
  if (arrMaps[mapID]) return true;
  else return false;
}

export { arrMaps, arrMapsInfo };
