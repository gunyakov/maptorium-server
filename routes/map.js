const express = require('express');
let url = require('url');
//------------------------------------------------------------------------------
//Cached tile map
//------------------------------------------------------------------------------
//const CachedMap = require('./cachedmap');

const router = express.Router();
//------------------------------------------------------------------------------
//Set defaults for express router
//------------------------------------------------------------------------------
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

// router.post("/cached", async(req, res) => {
//   let data = JSON.parse(req.body.data);
//   console.log(data);
//   let map = data.mapID;
//   let mapObj = arrMaps[map];
//   let requiredZoom = mapInfo.offset;
//   let tempArr = await POI.tileList(mapInfo.ID, requiredZoom, map);
//   let time = Date.now();
//   Log.make("info", "MAIN", "Start checking tiles in DB for cached map.");
//   if(tempArr) {
//     tileCachedList = {map: map, zoom: requiredZoom, tiles: {}};
//     for(i = 0; i < tempArr.length; i++) {
//       let checkTile = await mapObj.checkTile(tempArr[i]['z'], tempArr[i]['x'], tempArr[i]['y']);
//       let state = "missing";
//       if(checkTile) {
//         if(checkTile.s != 0) {
//           state = "present";
//         }
//         else {
//           state = "empty";
//         }
//       }
//       if(typeof tileCachedList.tiles[tempArr[i]['x']] == "undefined") {
//         tileCachedList.tiles[tempArr[i]['x']] = {};
//       }
//       tileCachedList.tiles[tempArr[i]['x']][tempArr[i]['y']] = state;
//     }
//     time = Math.round((Date.now() - time) / 1000);
//     Log.make("info", "MAIN", `Finished checking tiles in DB for cached map. Time spend ${time}.`);
//     time = Date.now();
//     //tileCachedMap = await CachedMap.generateMap(cachedMap);
//     time = Math.round((Date.now() - time) / 1000);
//     Log.make("info", "MAIN", `Finished generating tiles for cached map. Time spend ${time}.`);
//     socket.emit("setTileCachedMap", tileCachedList);
//   }
//   else {
//     socket.emit("message", {result: false, message: "Error to get tile cached map info."});
//   }
// });

//------------------------------------------------------------------------------
//Get request for cached tile map
//------------------------------------------------------------------------------
// let tileCachedMap = {};
// router.get(["/cached"], async function(request, response){
//   //Получаем данные из запроса
//   let parseReq = url.parse(request.url, true);
//   //Получаем данный для загрузки тайлов
//   let q = parseReq.query;
//   //Переводим все значения в числовые
//   let z = parseInt(q.z);
//   let x = parseInt(q.x);
//   let y = parseInt(q.y);
//
//   let tileName = md5('' + z + x + y);
//
//   if(typeof tileCachedMap[tileName] !== "undefined") {
//     response.writeHead(200, {'Content-Type': 'image/png', "Content-Length": Buffer.byteLength(tileCachedMap[tileName])});
//     response.end(tileCachedMap[tileName]);
//   }
//   else {
//     response.writeHead(200, {'Content-Type': 'image/png', "Content-Length": 0});
//     response.end('');
//   }
// });

module.exports = router;
