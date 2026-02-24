import { config } from "./config/index";
import { isConfigReady } from "./config/shared";
import io from "./src/io";
import Log from "./src/log";
import { LogModules } from "./src/enum";
import wait from "./helpers/wait";
import style_router from "./routes/style";
import poi_router from "./routes/poi";
import job_router from "./routes/job";
import tile_router from "./routes/tile";
import gps_router from "./routes/gps";
import core_router from "./routes/core";
import map_router from "./routes/map";
import fs_router from "./routes/fs";
import { applyMapStoragePaths } from "./maps";

export interface StartOptions {
  host?: string;
  port?: number;
  execFolder?: string;
}

export interface StartResult {
  host: string;
  port: number;
  close: () => Promise<void>;
}

/**
 * Start the Express + Socket.IO server in a way compatible with Electron's main process.
 * Does NOT run automatically — call start() from your Electron `main`.
 */
export async function start(opts: StartOptions = {}): Promise<StartResult> {
  // wait for config readiness (same behavior as index.tsx)
  while (!isConfigReady()) await wait(1000);
  await applyMapStoragePaths();

  const ExecFolder = opts.execFolder || process.cwd();
  const host = opts.host || "127.0.0.1";
  const port = opts.port || config?.service?.port || 9009;

  // require express/http like in index.tsx to match project patterns
  const express = require("express");
  const cors = require("cors");
  const http = require("http");
  const path = require("path");

  const app = express();
  app.use(cors());

  const server = http.createServer(app);

  // prevent EventEmitter MaxListeners warnings when server is created multiple times
  try {
    server.setMaxListeners(0);
  } catch (e) {
    // ignore if not supported
  }

  // initialize Socket.IO (module attaches to server)
  const IO = io(server);

  // serve static UI from public_html inside ExecFolder
  const staticPath = path.join(ExecFolder, "public_html");
  //console.log("Serving static files from", staticPath);
  app.use(express.static(staticPath));

  // API routers (same as index.tsx)
  app.use("/styles", style_router);
  app.use("/poi", poi_router);
  app.use("/job", job_router);
  app.use("/tile", tile_router);
  app.use("/gps", gps_router);
  app.use("/core", core_router);
  app.use("/map", map_router);
  app.use("/fs", fs_router);
  app.use("/filesystem", fs_router);

  // listen and wait until server is ready
  await new Promise<void>((resolve) => {
    server.listen(port, host, () => {
      Log.info(LogModules.main, `User UI -> http://${host}:${port}`);
      resolve();
    });
  });

  async function close() {
    return new Promise<void>((resolve) => {
      console.log("Closing server...");
      IO.close(() => {
        console.log("Socket.IO → all clients disconnected.");
        server.close(() => {
          console.log("Server closed.");
          resolve();
          process.exit(0);
        });
      });
      setTimeout(() => {
        console.error("Could not close connections in time — forcing exit");
        resolve();
        process.exit(1);
      }, 10000);
    });
  }

  return { host, port, close };
}

export default { start };
