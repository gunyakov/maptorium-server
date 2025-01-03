let net = require("net");
let util = require("util");
//------------------------------------------------------------------------------
//Config
//------------------------------------------------------------------------------
import config from "../config/config";

class TorService {
  private _auth: string;
  private _host: string;
  private _port: number;

  constructor(
    auth = config.network.proxy.tor.HashedControlPassword,
    host = config.network.proxy.server.host,
    port = config.network.proxy.tor.ControlPort
  ) {
    this._auth = auth;
    this._host = host;
    this._port = port;
  }

  async reset(): Promise<boolean> {
    const socket = new net.Socket({ allowHalfOpen: false });

    try {
      await this.connect(socket);
      await this.write(socket, util.format("AUTHENTICATE %s", this._auth));
      await this.write(socket, "signal NEWNYM");

      socket.destroy();
      return true;
    } catch (error) {
      socket.destroy();
      return false;
    }
  }

  async write(socket: any, cmd: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!socket.writable) {
        reject(new Error("Socket for TOR is not writable"));
      }

      socket.removeAllListeners("error");
      socket.removeAllListeners("data");

      socket.once("data", function (data: any) {
        const res = data.toString().replace(/[\r\n]/g, "");
        const tokens = res.split(" ");
        const code = parseInt(tokens[0]);

        if (code !== 250) {
          resolve(false);
        } else {
          resolve(true);
        }
      });

      socket.once("err", reject);
      socket.write(cmd + "\r\n");
    });
  }

  async connect(socket: any): Promise<boolean> {
    return new Promise((resolve, reject) => {
      socket.once("connect", resolve);
      socket.once("error", reject);
      socket.connect(this._port, this._host);
    });
  }
}
export default TorService;
