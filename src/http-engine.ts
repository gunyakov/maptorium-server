//------------------------------------------------------------------------------
//Axios
//------------------------------------------------------------------------------
import axios, { AxiosRequestConfig, AxiosResponse, Method, ResponseType } from "axios";
//------------------------------------------------------------------------------
//Socks Proxy Agent Generator
//------------------------------------------------------------------------------
import { SocksProxyAgent } from 'socks-proxy-agent';
let HttpsProxyAgent = require('https-proxy-agent');
//------------------------------------------------------------------------------
//Config
//------------------------------------------------------------------------------
import configMain from "../config/index";
//------------------------------------------------------------------------------
//ТОР
//------------------------------------------------------------------------------
import tor from "./tor";
let TorService = new tor();
//------------------------------------------------------------------------------
//Cheerio (JQuery for NodeJS)
//------------------------------------------------------------------------------
import * as cheerio from 'cheerio';
//------------------------------------------------------------------------------
//Logging service
//------------------------------------------------------------------------------
import Log from "./log";
import { DownloadMode, LogModules, ProxyProtocol } from "./enum";
import { NetworkConfig } from "./interface";
//------------------------------------------------------------------------------
//HTTP GET request
//------------------------------------------------------------------------------
export default class httpEngine {

  private _netConfig:NetworkConfig;
  private _code:number = 0;
  private _response:string = "";
  private _byteLength:number = 0;

  constructor(netConfig:NetworkConfig = configMain.network) {
      this._netConfig = netConfig;

  }
  public async get(url:string, responseType:ResponseType = 'text', force = false, method:Method = "get", data = '', cookies:string = ""):Promise<boolean> {
    let thisClass = this;

    let netConfig = this._netConfig;

    return new Promise(function(resolve, reject) {
      //If proxy enable
      let httpsAgent = {};
      //Generate axios config
      let axiosConfig:AxiosRequestConfig<any> = {                        
        method: method,
        url: url,
        timeout: netConfig.request.timeout,
        responseType: responseType,
        decompress: false,
        withCredentials: false,
        data: data,
        headers: {}
      }
      if(netConfig.proxy.enable) {
        let proxyOptions = "";
        if(netConfig.proxy.auth.username && netConfig.proxy.auth.password) {
          proxyOptions = `${netConfig.proxy.protocol}://${netConfig.proxy.auth.username}:${netConfig.proxy.auth.password}@${netConfig.proxy.host}:${netConfig.proxy.port}`;
        }
        else {
          proxyOptions = `${netConfig.proxy.protocol}://${netConfig.proxy.host}:${netConfig.proxy.port}`;
        }
        switch (netConfig.proxy.protocol) {
          case ProxyProtocol.socks:
          case ProxyProtocol.socks4:
          case ProxyProtocol.socks5:
            httpsAgent = new SocksProxyAgent(proxyOptions);
            break;
          case ProxyProtocol.http:
          case ProxyProtocol.https:
          default:
            httpsAgent = HttpsProxyAgent(proxyOptions);
            break
        }
        //Generate axios config with proxy config
        axiosConfig = {
          method: method,
          url: url,
          ...httpsAgent,
          timeout: netConfig.request.timeout,
          responseType: responseType,
          decompress: false,
          withCredentials: true,
          data: data,
          headers: {}
        }
      }
      //Set user agent for request
      axiosConfig.headers = {'User-Agent': netConfig.request.userAgent};
      //If need to use specific cookies for request
      if(cookies) {
        axiosConfig.withCredentials = true;
        axiosConfig.headers.get = `Cookie: ${cookies}`;
      }
      //If network state is enable
      if(netConfig.state != DownloadMode.disable || force == true) {
        //Try to get urls
        axios(axiosConfig).then(async function (response) {
          //Show message
          Log.info(LogModules.http, axiosConfig.url as string);
          thisClass._response = response.data as string;
          //@ts-ignore
          thisClass._byteLength = response.byteLength;
          //Return data from url
          resolve(true);
        }).catch(async function (error) {
          //Show error message
          if(error.response) {
            thisClass._code = error.response.status;
            //Show error message
            switch (error.response.status) {
              case 404:
                Log.warning(LogModules.http, error.response.status + " " + error.response.statusText);
                resolve(true);
                break;
              case 403:
                //If proxy type is TOR
                if(netConfig.proxy.tor && netConfig.proxy.enable) {
                  //Try to change TOR ID
                  await TorService.reset().catch((error) => { Log.error(LogModules.http, error) });
                }
              default:
                Log.error(LogModules.http, error.response.status + " " + error.response.statusText);
            }
          }
          else if(error.code == "ECONNREFUSED") {
            Log.error(LogModules.http, "Proxy Error. Connection refused.");
          }
          else if(error.code == "ECONNABORTED") {
            Log.error(LogModules.http, `Conection time out exceeded ${netConfig.request.timeout}`);
          }
          else if(error.code = "ECONNRESET") {
            //console.log(error);
            Log.error(LogModules.http, error.reason);
          }
          else {
            Log.error(LogModules.http, error);
          }
          //Return false
          resolve(false);
        });
      }
      //If network state is disable
      else {
        //Show error message
        Log.warning(LogModules.http, "Network disabled. Request skipped: " + axiosConfig.url);
        //Return false
        resolve(false);
      }
    });
  }
  public get code():number {
    return this._code;
  }
  public get response():string {
    return this._response;
  }
  public get byteLength():number {
    return this._byteLength;
  }
}

export async function checkProxy(config = {...configMain.network}) {
  if(config.proxy.enable) {
    let http = new httpEngine(config);
    await http.get("https://2ip.ru/");
    let proxyReqIP = '';
    let nonProxyReqIP = '';
    if(http.code == 200) {
      let $ = cheerio.load(http.response);
      proxyReqIP = $(".ip span").html() as string;
    }
    config.proxy.enable = false;
    http = new httpEngine(config);
    await http.get("https://2ip.ru/");
    if(http.code) {
      let $ = cheerio.load(http.response);
      nonProxyReqIP = $(".ip span").html() as string;
    }
    if(proxyReqIP === nonProxyReqIP || !proxyReqIP) {
      Log.error(LogModules.main, `Proxy isn't working. Real IP ${nonProxyReqIP}. Proxy IP ${proxyReqIP}`);
    }
    else {
      Log.success(LogModules.main, `Proxy is working. Real IP ${nonProxyReqIP}. Proxy IP ${proxyReqIP}`);
    }
  }
}
//----------------------------------------------------------------------------
//Check proxy settings during start
//----------------------------------------------------------------------------
checkProxy();
