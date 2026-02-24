import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import Database from "better-sqlite3";

type POIType = "point" | "polyline" | "polygon";

interface CategoryRow {
  ID: number;
  name: string;
  parentID: number | null;
}

interface POIRow {
  ID: number;
  categoryID: number;
  name: string;
  type: POIType;
  color: string | null;
  width: number | null;
  fillColor: string | null;
  fillOpacity: number | null;
  visible: number | null;
}

interface PointRow {
  ID: number;
  poiID: number;
  lat: number;
  lng: number;
}

interface BackupFolder {
  ID: string;
  name: string;
  parentID: string | null;
}

interface BackupFeature {
  type: "Feature";
  id: string;
  properties: {
    name: string;
    folderID: string | null;
    type: POIType;
    color: string | null;
    width: number | null;
    fillColor: string | null;
    fillOpacity: number | null;
    visible: number | null;
    legacyPoiID: number;
    legacyCategoryID: number;
  };
  geometry:
    | {
        type: "Point";
        coordinates: [number, number];
      }
    | {
        type: "LineString";
        coordinates: Array<[number, number]>;
      }
    | {
        type: "Polygon";
        coordinates: Array<Array<[number, number]>>;
      };
}

interface BackupFile {
  folders: Array<BackupFolder>;
  geojson: {
    type: "FeatureCollection";
    features: Array<BackupFeature>;
  };
}

function generateUUID() {
  return randomUUID();
}

function formatDatePart(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function defaultOutputFileName() {
  return `${formatDatePart(new Date())}.mpb`;
}

function parseArgs() {
  const args = process.argv.slice(2);
  let dbPath = path.resolve(process.cwd(), "POI.db3");
  let outPath = path.resolve(process.cwd(), defaultOutputFileName());
  let pretty = true;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }

    if (arg === "--db") {
      const value = args[index + 1];
      if (!value) {
        throw new Error("Missing value after --db");
      }
      dbPath = path.resolve(process.cwd(), value);
      index += 1;
      continue;
    }

    if (arg === "--out") {
      const value = args[index + 1];
      if (!value) {
        throw new Error("Missing value after --out");
      }
      outPath = path.resolve(process.cwd(), value);
      index += 1;
      continue;
    }

    if (arg === "--minify") {
      pretty = false;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return { dbPath, outPath, pretty };
}

function printHelp() {
  console.log("Export POI.db3 to Maptorium backup format (folders + geojson).");
  console.log("");
  console.log("Usage:");
  console.log(
    "  npx tsx scripts/export-poi-backup.ts [--db ./POI.db3] [--out ./backup.mpb] [--minify]",
  );
  console.log("");
  console.log("Options:");
  console.log("  --db <path>      Path to source POI.db3 (default: ./POI.db3)");
  console.log(
    "  --out <path>     Output .mpb file path (default: ./yyyymmdd_hhmmss.mpb)",
  );
  console.log("  --minify         Write minified JSON");
  console.log("  --help, -h       Show this help");
}

function loadCategories(db: Database.Database) {
  const categories = db
    .prepare("SELECT ID, name, parentID FROM category ORDER BY ID ASC")
    .all() as Array<CategoryRow>;

  const categoryToFolderUUID = new Map<number, string>();
  categories.forEach((category) => {
    categoryToFolderUUID.set(category.ID, generateUUID());
  });

  const folders: Array<BackupFolder> = categories.map((category) => {
    const folderID = categoryToFolderUUID.get(category.ID);
    if (!folderID) {
      throw new Error(`No UUID generated for category ${category.ID}`);
    }

    const parentUUID =
      typeof category.parentID === "number" && category.parentID > 0
        ? (categoryToFolderUUID.get(category.parentID) ?? null)
        : null;

    return {
      ID: folderID,
      name: category.name,
      parentID: parentUUID,
    };
  });

  return {
    folders,
    categoryToFolderUUID,
  };
}

function buildFeature(
  poi: POIRow,
  coords: Array<[number, number]>,
  folderID: string | null,
): BackupFeature | null {
  if (coords.length === 0) return null;

  const poiUUID = generateUUID();

  if (poi.type === "point") {
    return {
      type: "Feature",
      id: poiUUID,
      properties: {
        name: poi.name,
        folderID,
        type: poi.type,
        color: poi.color,
        width: poi.width,
        fillColor: poi.fillColor,
        fillOpacity: poi.fillOpacity,
        visible: poi.visible,
        legacyPoiID: poi.ID,
        legacyCategoryID: poi.categoryID,
      },
      geometry: {
        type: "Point",
        coordinates: coords[0],
      },
    };
  }

  if (poi.type === "polyline") {
    if (coords.length < 2) return null;

    return {
      type: "Feature",
      id: poiUUID,
      properties: {
        name: poi.name,
        folderID,
        type: poi.type,
        color: poi.color,
        width: poi.width,
        fillColor: poi.fillColor,
        fillOpacity: poi.fillOpacity,
        visible: poi.visible,
        legacyPoiID: poi.ID,
        legacyCategoryID: poi.categoryID,
      },
      geometry: {
        type: "LineString",
        coordinates: coords,
      },
    };
  }

  if (poi.type === "polygon") {
    if (coords.length < 3) return null;

    const ring = [...coords];
    const first = ring[0];
    const last = ring[ring.length - 1];

    if (first[0] !== last[0] || first[1] !== last[1]) {
      ring.push([first[0], first[1]]);
    }

    return {
      type: "Feature",
      id: poiUUID,
      properties: {
        name: poi.name,
        folderID,
        type: poi.type,
        color: poi.color,
        width: poi.width,
        fillColor: poi.fillColor,
        fillOpacity: poi.fillOpacity,
        visible: poi.visible,
        legacyPoiID: poi.ID,
        legacyCategoryID: poi.categoryID,
      },
      geometry: {
        type: "Polygon",
        coordinates: [ring],
      },
    };
  }

  return null;
}

function loadFeatures(
  db: Database.Database,
  categoryToFolderUUID: Map<number, string>,
) {
  const poiRows = db
    .prepare(
      "SELECT ID, categoryID, name, type, color, width, fillColor, fillOpacity, visible FROM poi ORDER BY ID ASC",
    )
    .all() as Array<POIRow>;

  const pointRows = db
    .prepare(
      "SELECT ID, poiID, lat, lng FROM points ORDER BY poiID ASC, ID ASC",
    )
    .all() as Array<PointRow>;

  const pointsByPoiID = new Map<number, Array<[number, number]>>();
  pointRows.forEach((row) => {
    if (!pointsByPoiID.has(row.poiID)) {
      pointsByPoiID.set(row.poiID, []);
    }

    const lng = Number(row.lng);
    const lat = Number(row.lat);

    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;

    pointsByPoiID.get(row.poiID)?.push([lng, lat]);
  });

  const features: Array<BackupFeature> = [];

  poiRows.forEach((poi) => {
    const coords = pointsByPoiID.get(poi.ID) ?? [];
    const folderID = categoryToFolderUUID.get(poi.categoryID) ?? null;

    const feature = buildFeature(poi, coords, folderID);
    if (!feature) return;

    features.push(feature);
  });

  return features;
}

function ensureParentDir(filePath: string) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}

function exportBackup(dbPath: string, outPath: string, pretty: boolean) {
  if (!fs.existsSync(dbPath)) {
    throw new Error(`Database not found: ${dbPath}`);
  }

  const db = new Database(dbPath, { readonly: true });

  try {
    const { folders, categoryToFolderUUID } = loadCategories(db);
    const features = loadFeatures(db, categoryToFolderUUID);

    const backup: BackupFile = {
      folders,
      geojson: {
        type: "FeatureCollection",
        features,
      },
    };

    ensureParentDir(outPath);
    fs.writeFileSync(
      outPath,
      JSON.stringify(backup, null, pretty ? 2 : 0),
      "utf-8",
    );

    console.log(`Backup exported: ${outPath}`);
    console.log(`Folders exported: ${folders.length}`);
    console.log(`POI exported: ${features.length}`);
  } finally {
    db.close();
  }
}

function main() {
  try {
    const { dbPath, outPath, pretty } = parseArgs();
    exportBackup(dbPath, outPath, pretty);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Export failed: ${message}`);
    process.exit(1);
  }
}

main();
