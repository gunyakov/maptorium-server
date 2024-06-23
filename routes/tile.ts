import * as express from "express";
import { Response } from "express";
const router = express.Router();
//------------------------------------------------------------------------------
//Set defaults for express router
//------------------------------------------------------------------------------
router.use(express.json());
router.use(express.urlencoded({ extended: true }));
//------------------------------------------------------------------------------
//Config
//------------------------------------------------------------------------------
import config, { ExecFolder } from "../config/index";
//------------------------------------------------------------------------------
//Logging service
//------------------------------------------------------------------------------
import Log from "../src/log";
//------------------------------------------------------------------------------
//Extra imports
//------------------------------------------------------------------------------
import { DownloadMode, LogModules } from "../src/enum";
import { checkMapHandler, getMapHandler } from "../maps";
import MapHandler from "../src/map";
let url = require("url");
import path from "path";
import stat from "../src/statistics";
//------------------------------------------------------------------------------
//Tile request handler
//------------------------------------------------------------------------------
async function tileRequestHandler(
  map: string,
  x: number,
  y: number,
  z: number,
  mode: DownloadMode,
  res: Response
): Promise<void> {
  //Устанавливаем максимальное значение координат тайла
  let maxTileNumber = 1;
  //Изменяем максимальный номер тайла в соответсвии с уровнем увеличения
  for (let i = 1; i <= z; i++) {
    maxTileNumber = maxTileNumber * 2;
  }
  maxTileNumber--;
  //console.log(maxTileNumber);
  //Если координата тайла превышает максимально возможное значение
  if (x > maxTileNumber || y > maxTileNumber) {
    Log.error(LogModules.main, "Tile request. Tile coords is out of max limit");
    //Пишем пустой тайл
    res.writeHead(404);
    res.end();
    //res.sendFile(path.join(ExecFolder, "default.png"));
  } else if (typeof map == "undefined" || !checkMapHandler(map)) {
    Log.error(
      LogModules.main,
      "Tile request. Map don't set or wrong map handler."
    );
    //Пишем пустой тайл
    res.writeHead(404);
    res.end();
    //res.sendFile(path.join(ExecFolder, "default.png"));
  } else {
    let mapHandler = getMapHandler(map) as MapHandler;
    let [tileInDB, tileInfo] = await mapHandler.checkTile(z, x, y, true);
    //If tile in DB and no need update tile in force mode
    let headers = {
      "Content-Type": mapHandler.getInfo().content,
      "Content-Length": 0,
      "Content-Encoding": mapHandler.getInfo().encoding,
    };
    if (mode != DownloadMode.force && tileInDB == true) {
      stat.skip++;
      //Retrun tile from DB
      headers["Content-Length"] = tileInfo.s;
      res.writeHead(200, headers);
      res.end(tileInfo.b);
      return;
    }
    stat.queue++;
    //If tile not in DB and network isn disable
    if (mode != DownloadMode.disable && !tileInDB) {
      //Download tile there
      let [code, tile, size] = await mapHandler.download(
        z,
        x,
        y,
        config.network
      );
      //If tile was downloaded
      if (code == 200) {
        stat.download++;
        stat.size += size;
        //Return tile
        headers["Content-Length"] = size;
        res.writeHead(200, headers);
        res.end(tile);
      }
      //If tile wasnt downloaded
      else {
        //Return empty tile
        res.writeHead(404);
        res.end();
        //res.sendFile(path.join(ExecFolder, "default.png"));
      }
      stat.queue--;
      return;
    }
    //If tile in DB but tile must be updated in force mode
    if (mode == DownloadMode.force && tileInDB) {
      //Update Tile there
      //Download tile there
      let [code, tile, size] = await mapHandler.update(z, x, y, config.network);
      //If tile was updated
      if (code == 200) {
        stat.download++;
        stat.size += size;
        //Return tile
        headers["Content-Length"] = size;
        res.writeHead(200, headers);
        res.end(tile);
      }
      //If tile wasnt updated
      else {
        //Return empty tile
        res.writeHead(404);
        res.end();
        //res.sendFile(path.join(ExecFolder, "default.png"));
      }
      stat.queue--;
      return;
    }
    //In all other cases return empty tile
    res.writeHead(404);
    res.end();
    //res.sendFile(path.join(ExecFolder, "default.png"));
  }
}
//------------------------------------------------------------------------------
//HTTP Server: GET request for tiles
//------------------------------------------------------------------------------
router.get("/:mapID/:z/:x/:y", async (req, res) => {
  tileRequestHandler(
    req.params.mapID,
    parseInt(req.params.x),
    parseInt(req.params.y),
    parseInt(req.params.z),
    config.network.state,
    res
  );
});

router.get(["/"], async function (req, res) {
  //Получаем данные из запроса
  let parseReq = url.parse(req.url, true);
  //Получаем данный для загрузки тайлов
  let q = parseReq.query;
  //Переводим все значения в числовые
  q.z = parseInt(q.z);
  q.x = parseInt(q.x);
  q.y = parseInt(q.y);
  switch (q.mode) {
    case "force":
    case "enable":
    case "disable":
      break;
    default:
      q.mode = config.network.state;
      break;
  }

  tileRequestHandler(q.map, q.x, q.y, q.z, q.mode, res);
});

export default router;
