import type { Database } from "better-sqlite3";

import {
  DBState,
  DownloadMode,
  LogType,
  POIType,
  ProxyProtocol,
  TileInCache,
  JobType,
  GPSType,
} from "./enum";
import type { AxiosRequestHeaders } from "axios";

export type LogArray = {
  [id in LogType]: Array<string>;
};

export interface DBList {
  name: string;
  time: number;
  state: DBState;
  db: Database;
}

export interface Tile {
  x: number;
  y: number;
  s: number;
  h: number;
  d: number;
  b: ArrayBuffer;
  method: string;
}

export interface TileInfo {
  x: number;
  y: number;
  z: number;
}

export interface TileDownloaded {
  data: string;
  byteLength: number;
}

export interface GPSCoords {
  lat: number;
  lng: number;
}
export interface POIInfo {
  ID: number;
  categoryID: number;
  name: string;
  type: POIType;
  color: string;
  width: number;
  fillColor: string;
  fillOpacity: number;
  points: Array<GPSCoords>;
  visible: number;
}

export interface POICategory {
  ID: number;
  name: string;
  parentID: number;
  order: number;
}

export interface ROUTE {
  ID: number;
  name: string;
}

export interface MapInfo {
  id: string;
  type: string;
  name: string;
  submenu: string;
  tileSize: number;
  attribution: string;
  content: string;
  format: string;
  encoding: "gzip" | "none";
  apiKey?: string;
  headers?: AxiosRequestHeaders;
}

export interface iNetworkConfig {
  state: DownloadMode;
  request: {
    userAgent: string;
    timeout: number;
    delay: number;
  };
  banTimeMode: boolean;
  proxy: {
    enable: boolean;
    server: {
      protocol: ProxyProtocol;
      host: string;
      port: number;
    };
    authRequired: boolean;
    auth: {
      username: string;
      password: string;
    };
    tor: {
      enable: boolean;
      HashedControlPassword: string;
      ControlPort: number;
    };
  };
}
export interface iJobInfo {
  ID: string;
  mapID: string;
  randomDownload: boolean;
  updateTiles: boolean;
  updateDifferent: boolean;
  updateDateTiles: boolean;
  dateTiles: string;
  emptyTiles: boolean;
  checkEmptyTiles: boolean;
  updateDateEmpty: boolean;
  dateEmpty: string;
  zoom: { [id: number]: boolean };
  threadsCounter: number;
}
export interface iJobConfig {
  polygonID: number;
  customNetworkConfig: boolean;
  network?: iNetworkConfig;
  download: iJobInfo;
}

export interface JobsList {
  ID: string;
  type: JobType;
  mapID: string;
  running: boolean;
}

export interface JobStat {
  download: number;
  error: number;
  empty: number;
  size: number;
  skip: number;
  time: number;
  total: number;
  queue: number;
}

export interface GenJobInfo {
  ID: string;
  mapID: string;
  polygonID: string;
  zoom: Array<string>;
  updateTiles: boolean;
  completeTiles: boolean;
  fromZoom: string;
  previousZoom: boolean;
}

export interface GenJobStat {
  skip: number;
  procesed: number;
  total: number;
  time: number;
  readed: number;
  size: number;
}

export interface UserConfig {
  map: string;
  layers: Array<string>;
  lat: number;
  lng: number;
  zoom: number;
  showRoute: boolean;
  recordRoute: boolean;
  gpsSampleTime: number;
  mode: DownloadMode;
  jobManager: boolean;
  gpsServiceRun?: boolean;
  gpsServer?: GPSConfig;
  apiKeys?: { [id: string]: string };
}

export interface CachedTilesList {
  [id: number]: {
    [id: number]: TileInCache;
  };
}

export interface MarkInfo {
  categoryID: number;
  name: string;
  points: Array<GPSCoords>;
}

export interface GPSConfig {
  host: string;
  port: number;
  type: GPSType;
  device: string;
}
