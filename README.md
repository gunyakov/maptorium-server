# maptorium-server

[Join Telegram Groupe to contribute or ask questions](https://t.me/maptorium)

### Description

Maptorium`s project http server - any tiles cached server. 

### Installation

#### Linux users 

```
git clone https://github.com/gunyakov/maptorium.git

cd maptorium

npm install

npm run prepare

npm run start
```

After navigate in browser to http://localhost:9009

<details>

<summary>SQLite3 module compilation error</summary>

If you have any problems during SQLite3 module compilation, run next command

```
npm install https://github.com/mapbox/node-sqlite3/tarball/master
```

</details>




#### Windows users

Available v0.9.6-beta-win-x64 portable version for Windows users. You can download it [here](https://github.com/gunyakov/maptorium/releases/tag/0.9.6)

### Additional Info

All tiles stored in sqlite3 DB. Storage aragement is fully compatible with [SAS Planet](https://sasgis.org)

Once you view map, it will store all tiles in DB forever.

You have 3 modes of map viewing. Internet & Cache - default mode where tiles search in DB first and if missing, then downloaded from internet. Internet only - download all tiles from internet and update tiles in DB. Cache - search tiles only in DB, no any internet use.

You can select tile, after select zoom level and sotfware will start mass tile download. Now you can add few download jobs and leave you computer unattended.

As its based on nodejs, you can install this software on oyur remote server/vps and control it directly from internet.

It's possible to use proxy server to download tiles. Now support any type of proxy: http(s), socks(4,5). Also it support using tor. If you mass download tiles from server and server ban you IP, software will sent signal to tor to change automaticaly Tor ID and continue downloading (need enable tor control port and tor auth).

To add more maps, copy any file from **maps** folder and just change map url parameters.

Next futures to add:
- More complex download job manager
- Generating up zoom layers from already dowloaded down zoom layer (Example: from Z18 generate Z17-Z10 layers, very usefull for sat imagenery to extremly decrease number of tiles to download)
- Tile cached map (View on map what tiles from selected zoom and map already in DB)

### Version

0.9.7 - 03 June 2023. Split project into 3 parts.


