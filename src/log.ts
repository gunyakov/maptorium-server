//------------------------------------------------------------------------------
//Color console
//------------------------------------------------------------------------------
import { red, green, yellow, blue } from "colors";
//------------------------------------------------------------------------------
//Config
//------------------------------------------------------------------------------
import { isConfigReady } from "../config/shared";
import { config } from "../config/index";
//------------------------------------------------------------------------------
//Log modules and types
//------------------------------------------------------------------------------
import { LogModules, LogShow, LogType } from "./enum";
import { LogArray } from "./interface";
//------------------------------------------------------------------------------
//SOCKET IO
//------------------------------------------------------------------------------
import { sendMessage } from "./io";
//------------------------------------------------------------------------------
//Wait function
//------------------------------------------------------------------------------
import wait from "../helpers/wait";
//------------------------------------------------------------------------------
//Handle logs
//------------------------------------------------------------------------------
class Log {
  private arrLog: LogArray = {
    info: [],
    warning: [],
    error: [],
    success: [],
  };

  constructor() {
    this.arrLog[LogType.info] = [];
    this.arrLog[LogType.error] = [];
    this.arrLog[LogType.success] = [];
    this.arrLog[LogType.warning] = [];
  }

  async make(type: LogType, module: LogModules, message: string) {
    if (
      type != LogType.info &&
      type != LogType.error &&
      type != LogType.warning &&
      type != LogType.success
    ) {
      type = LogType.info;
    }
    while (!isConfigReady) await wait(1000);
    //If entries counter more than set in config
    if (this.arrLog[type].length > config.log.length) {
      //Delete first entry from log
      this.arrLog[type].shift();
    }
    //Add new entry to the end of log
    this.arrLog[type].push(message);

    let format_module = module.toString();

    if (module.length < 7) {
      for (let i = module.length; i < 7; i++) {
        format_module += " ";
      }
    }
    format_module.toUpperCase();
    if (!config.log[module]) {
      console.log(
        red(new Date().toLocaleString("en-GB")),
        red.bold(format_module),
        red.bold("ERROR    "),
        red("Cant find config for this log module.")
      );
    } else {
      //If enable display such type of mesage in console
      if (
        config.log[module][type] == LogShow.console ||
        config.log[module][type] == LogShow.both
      ) {
        //Show success message
        if (type == LogType.success) {
          console.log(
            green(new Date().toLocaleString("en-GB")),
            green.bold(format_module),
            green.bold("SUCCESS  "),
            green(message)
          );
        }
        //Show error message
        if (type == LogType.error) {
          console.log(
            red(new Date().toLocaleString("en-GB")),
            red.bold(format_module),
            red.bold("ERROR    "),
            red(message)
          );
        }
        //Show warning message
        if (type == LogType.warning) {
          console.log(
            yellow(new Date().toLocaleString("en-GB")),
            yellow.bold(format_module),
            yellow.bold("WARNING  "),
            yellow(message)
          );
        }
        //Show info message
        if (type == LogType.info) {
          console.log(
            blue(new Date().toLocaleString("en-GB")),
            blue.bold(format_module),
            blue.bold("INFO     "),
            blue(message)
          );
        }
      }
      //If enable display such type of mesage in console
      if (
        config.log[module][type] == LogShow.message ||
        config.log[module][type] == LogShow.both
      ) {
        sendMessage(module, type, message);
      }
    }
  }

  async error(module: LogModules, message: string) {
    this.make(LogType.error, module, message);
  }

  async warning(module: LogModules, message: string) {
    this.make(LogType.warning, module, message);
  }

  async success(module: LogModules, message: string) {
    this.make(LogType.success, module, message);
  }

  async info(module: LogModules, message: string) {
    this.make(LogType.info, module, message);
  }
}
export default new Log();
