//----------------------------------------------------------------------------
//EPSG3857 to convert LatLngs to Pixel points
//Original code taken from Leaflet and adapted for TS
//----------------------------------------------------------------------------
import EPSG3857 from "./EPSG3857";
//----------------------------------------------------------------------------
//Turf to work with coords
//----------------------------------------------------------------------------
import * as turf from "@turf/turf";
//------------------------------------------------------------------------------
//Logging service
//------------------------------------------------------------------------------
import Log from "../src/log";
import { LogModules } from '../src/enum';
import { TileInfo, GPSCoords, POIInfo } from "../src/interface";
import POI from "../src/poi";
//----------------------------------------------------------------------------
//Generate tiles list for job list
//----------------------------------------------------------------------------
export default async function tileList(bbox:Array<number>, polygon:turf.helpers.Feature<turf.helpers.Polygon>, tileSize:number):Promise<Array<TileInfo>> {

    let arrJobTilesList:Array<TileInfo> = [];
    
    //Convert Map Pixel To Tile XY coords
    var startX = Math.floor(bbox[0] / tileSize);
    var startY = Math.floor(bbox[1] / tileSize);
    var stopX = Math.ceil(bbox[2] / tileSize);
    var stopY = Math.ceil(bbox[3] / tileSize);
    //Generate tiles list by polygon bounds
    for(let x = startX; x < stopX; x++) {
        for(let y = startY; y < stopY; y++) {
            //Init tile inside polygon state
            let tileInside = false;
            //Check all 4 corners to be inside polygon
            if(turf.booleanPointInPolygon([ x * tileSize, y * tileSize ], polygon)) {
                //Set tile state inside
                tileInside = true;
            }
            
            if(turf.booleanPointInPolygon([ x * tileSize + tileSize, y * tileSize ], polygon)) {
                //Set tile state inside
                tileInside = true;
            }
            if(turf.booleanPointInPolygon([ x * tileSize + tileSize, y * tileSize + tileSize], polygon)) {
                //Set tile state inside
                tileInside = true;
            }
            if(turf.booleanPointInPolygon([ x * tileSize, y * tileSize + tileSize], polygon)) {
                //Set tile state inside
                tileInside = true;
            }
            if(tileInside) {
                //Добавляем в список координаты тайлов
                arrJobTilesList.push({
                    x: x,
                    y: y,
                    z: 0
                });
            }
        }
    }
    return arrJobTilesList;
}

export async function tilesListByPOI(poiID:number, zoom:number, tileSize:number):Promise<Array<TileInfo>> {
    Log.success(LogModules.worker, `Start calculation tiles list for Polygon ${poiID} and Zoom ${zoom}`);
    let arrJobTilesList:Array<TileInfo> = [];
    let poi = await POI.get(poiID) as Array<POIInfo>;
    if(poi) {
        arrJobTilesList = await tileListByPolygon(poi[0].points, zoom, tileSize);
    }
    Log.success(LogModules.worker, `Calculation of tiles list is finished. Total ${arrJobTilesList.length} tiles.`);
    return arrJobTilesList;
}

export async function tileListByPolygon(points:Array<GPSCoords>, requiredZoom:number, tileSize:number):Promise<Array<TileInfo>> {
    
    let arrJobTilesList:Array<TileInfo> = [];
    //Convert polygone point to Turf points
    let arrPoints = [];
    
    for(let i = 0; i < points.length; i++) {
        //Convert Coords to Map Pixels according requred ZOOM
        let point = EPSG3857.latLngToPoint({lat: points[i].lat, lng: points[i].lng}, requiredZoom);
        //Insert Tile XY coordinates to array
        arrPoints.push([point.x, point.y]);
    }
    let point = EPSG3857.latLngToPoint({lat: points[0].lat, lng: points[0].lng}, requiredZoom);
    arrPoints.push([point.x, point.y]);
    //Make turf polygon
    var polygon = turf.polygon([arrPoints]);
    //Get BOUNDS for Polygon by Turf Module
    var bbox = turf.bbox(polygon);
    //If maxX == minX and maxY == minY, its mean that required level need to download 1 tile, abort.
    if(bbox[0] == bbox[2] || bbox[1] == bbox[3]) {
        Log.warning(LogModules.worker, "Abort tiles calculation. Required Zoom is same as selected zoom.");
        return arrJobTilesList;
    }

    arrJobTilesList = await tileList(bbox, polygon, tileSize);
    
    for(let i = 0; i < arrJobTilesList.length; i++) {
        arrJobTilesList[i].z = requiredZoom;
    }
    //Return tiles job list
    return arrJobTilesList;
}
