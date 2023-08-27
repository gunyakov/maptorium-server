import { DownloadMode, LogShow, ProxyProtocol } from "../src/enum";

export default {
  //Service
  service: {
    //Listen port
    port: 9009,
    //Threads for http request
    threads: 1,
  },
  db: {
    //Prevent write in DB any tiles in any mode
    ReadOnly: false,
    //Idle time in seconds to close DB file if idle
    OpenTime: 15
  },
  network: {
    //(enable, disable, force)
    state: DownloadMode.disable,
      //Request for mass tile download
    request: {
      //Delay in ms between HTTP requests when tiles download
      delay: 3, 
      //Abort request if pass more than ms
      timeout: 30000,
      //User Agent
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:96.0) Gecko/20100101 Firefox/96.0'
    },
    proxy: {
      //Use proxy or not (true or false)
      enable: false,
      //Enable tor change ID
      tor: false,
      //Type of proxy(socks, socks4, socks5, http, https)
      protocol: ProxyProtocol.http,
      //Host can be IP or domain
      host: '127.0.0.1',
      //Port
      port: 9099,
      auth: {
        username: 'test',
        password: 'test',
        tor: {
          HashedControlPassword: "16:872860B76453A77D60CA2BB8C1A7042072093276A3D701AD684053EC4C",
          ControlPort: 9051
        }
      }
    }
  },
  downloader: {
    //Update tiles if Exist in DB
    updateTiles: false, 
    //Update tiles if exist in DB and have different size
    updateDifferent: false, 
    //Update tiles if some time pass from last downloading
    updateDateTiles: false, 
    //Mark tiles empty if 404 get from server during download
    emptyTiles: true, 
    //Check from server tiles what was marked like empty id DB
    checkEmptyTiles: false, 
    //Udpate tiles what marked empty and if some time pass from last check
    updateDateEmpty: false
  },
  //----------------------------------------------------------------------------
  //Log service
  //----------------------------------------------------------------------------
  log: {
    //How many entries keep in logs
    length: 20,
    //************************************************* */
    //Disable - No logs
    //Console - Only print message in console
    //Message - Only send log message to remote UI
    //Both - Print log message in console and send to remote UI
    //************************************************* */
    TSTOR: {
      success: LogShow.console,
      info: LogShow.console,
      error: LogShow.console,
      warning: LogShow.console
    },
    MAP: {
      success: LogShow.console,
      info: LogShow.console,
      error: LogShow.console,
      warning: LogShow.console
    },
    SQLITE3: {
      success: LogShow.disable,
      info: LogShow.console,
      error: LogShow.console,
      warning: LogShow.console
    },
    HTTP: {
      success: LogShow.disable,
      info: LogShow.disable,
      error: LogShow.console,
      warning: LogShow.disable
    },
    GPS: {
      success: LogShow.both,
      info: LogShow.console,
      error: LogShow.console,
      warning: LogShow.console
    },
    MAIN: {
      success: LogShow.both,
      info: LogShow.console,
      error: LogShow.console,
      warning: LogShow.console
    },
    POI: {
      success: LogShow.console,
      info: LogShow.disable,
      error: LogShow.console,
      warning: LogShow.console
    },
    WORKER: {
      success: LogShow.console,
      info: LogShow.console,
      error: LogShow.console,
      warning: LogShow.console
    }
  }
};
