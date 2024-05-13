export default {
  SELECT_ALL_POI: "SELECT * FROM poi;",

  SELECT_POI_BY_ID: "SELECT * FROM poi WHERE ID = ?;",

  SELECT_POI_BY_CATEGORY: "SELECT * FROM poi WHERE categoryID = ?;",

  SELECT_POI_BY_BOTH: "SELECT * FROM poi WHERE ID = ? AND categoryID = ?;",

  SELECT_POI_BY_NAME:
    "SELECT * FROM poi WHERE name = ? ORDER BY ID DESC LIMIT 1;",

  SELECT_POINTS_BY_POI: "SELECT lat, lng FROM points WHERE poiID = ?;",

  INSERT_POI:
    "INSERT INTO poi('categoryID', 'name', 'type', 'color', 'fillColor', 'fillOpacity', 'visible', 'width') VALUES(?, ?, ?, ?, ?, ?, ?, ?);",

  INSERT_POINTS: "INSERT INTO points('poiID', 'lat', 'lng') VALUES (?, ?, ?);",

  DELETE_POI_BY_ID: "DELETE FROM poi WHERE ID = ?;",

  DELETE_POINTS_BY_POI: "DELETE FROM points WHERE poiID = ?;",

  UPDATE_POI_STYLE:
    "UPDATE poi SET categoryID = ?, name = ?, width = ?, fillOpacity = ?, color = ?, fillColor = ? WHERE ID = ?;",

  SELECT_CATEGORY_LIST: "SELECT * FROM category;",

  SELECT_CATEGORY_BY_ID: "SELECT * FROM category WHERE ID = ?;",

  SELECT_CATEGORY_BY_SUB: "SELECT * FROM category WHERE parentID = ?;",

  INSERT_CATEGORY: "INSERT INTO category('name', 'parentID') VALUES(?, ?);",

  DELETE_CATEGORY: "DELETE FROM category WHERE ID = ?;",

  UPDATE_CATEGORY: "UPDATE category SET name = ?, parentID = ? WHERE ID = ?",

  INSERT_ROUTE: "INSERT INTO routeList('name', 'distance') VALUES(?, ?);",

  INSERT_ROUTE_POINT: `INSERT INTO routeCoords('routeID', 'lat', 'lng', 'date') VALUES(?, ?, ?, ${Math.floor(
    Date.now() / 1000
  )})`,

  SELECT_ROUTE_POINTS:
    "SELECT lat, lng FROM routeCoords WHERE routeID=? ORDER BY date, ID ASC;",

  SELECT_LAST_ROUTE: "SELECT MAX(ID) as IDMAX FROM routeList;",

  SELECT_ALL_ROUTES: "SELECT * FROM routeList;",

  CREATE_STORAGE_TABLE:
    "CREATE TABLE IF NOT EXISTS t (x INTEGER NOT NULL,y INTEGER NOT NULL,v INTEGER DEFAULT 0 NOT NULL,c TEXT,s INTEGER DEFAULT 0 NOT NULL,h INTEGER DEFAULT 0 NOT NULL,d INTEGER NOT NULL,b BLOB,constraint PK_TB primary key (x,y,v));",

  CREATE_INDEX: "CREATE INDEX IF NOT EXISTS t_v_idx on t (v);",

  SELECT_TILE_FULL: "SELECT s, b, d, h, v FROM t WHERE x = ? AND y = ?;",

  SELECT_TILE_INFO: "SELECT s, d, h, v FROM t WHERE x = ? AND y = ?;",

  INSERT_TILE: "INSERT INTO t VALUES (?, ?, ?, ?, ?, ?, ?, ?);",

  UPDATE_TILE:
    "UPDATE t SET v = ?, s = ?, h = ?, d = ?, b = ? WHERE x = ? AND y = ?;",

  MBTILES_SELECT:
    "SELECT * FROM tiles WHERE zoom_level = ? AND tile_column = ? AND tile_row = ?;",

  CREATE_DB_1: `CREATE TABLE "category" (
    "ID"	INTEGER UNIQUE,
    "name"	TEXT NOT NULL,
    "parentID"	INTEGER,
    "order"	INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY("ID" AUTOINCREMENT)
  )`,
  CREATE_DB_2: `CREATE TABLE "messages" (
    "ID"	INTEGER UNIQUE,
    "message"	TEXT,
    "readed"	INTEGER DEFAULT 0,
    "date"	INTEGER,
    PRIMARY KEY("ID" AUTOINCREMENT)
  )`,
  CREATE_DB_3: `CREATE TABLE "poi" (
    "ID"	INTEGER UNIQUE,
    "categoryID"	INTEGER NOT NULL,
    "name"	TEXT NOT NULL,
    "type"	TEXT NOT NULL,
    "color"	TEXT,
    "width"	INTEGER NOT NULL DEFAULT 1,
    "fillColor"	TEXT,
    "fillOpacity"	REAL,
    "visible"	INTEGER,
    PRIMARY KEY("ID" AUTOINCREMENT)
  )`,
  CREATE_DB_4: `CREATE TABLE "points" (
    "ID"	INTEGER UNIQUE,
    "poiID"	INTEGER,
    "lat"	INTEGER,
    "lng"	INTEGER,
    PRIMARY KEY("ID" AUTOINCREMENT)
  )`,
  CREATE_DB_5: `CREATE TABLE "routeCoords" (
    "ID"	INTEGER NOT NULL UNIQUE,
    "routeID"	INTEGER NOT NULL,
    "lat"	REAL NOT NULL,
    "lng"	REAL NOT NULL,
    "date"	INTEGER,
    PRIMARY KEY("ID" AUTOINCREMENT)
  )`,
  CREATE_DB_6: `CREATE TABLE "routeList" (
    "ID"	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
    "name"	TEXT,
    "distance"	INTEGER
  )`,
} as { [id: string]: string };
