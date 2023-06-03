//------------------------------------------------------------------------------
//Color console
//------------------------------------------------------------------------------
let colors = require('colors');
//------------------------------------------------------------------------------
//Handle logs
//------------------------------------------------------------------------------
class Log {
  constructor() {
    this.arrLog = {
      'info': [],
      'error': [],
      'warning': [],
      'success': []
    }
  }

  async make(type, module,  message) {
    if(type != "info" && type != "error" && type != "warning" && type != "success") {
      type = "info";
    }
    //If entries counter more than set in config
    if(this.arrLog[type].length > config.log.length) {
      //Delete first entry from log
      this.arrLog[type].shift();
    }
    //Add new entry to the end of log
    this.arrLog[type].push(message);
    
    let format_module = module;
    if(module.length < 7) {
      for(let i = module.length; i < 7; i++) {
        format_module += " ";
      }
    }
    format_module.toUpperCase();
    if(!config.log[module]) {
      console.log(colors.red(new Date().toLocaleString("en-GB")), colors.red.bold(format_module), colors.red.bold("ERROR    "), colors.red("Cant find config for this log module."));
    }
    else {
      //If enable display such type of mesage in block
      if(config.log[module][type]) {
        //Show success message
        if(type == "success") {
          console.log(colors.green(new Date().toLocaleString("en-GB")), colors.green.bold(format_module), colors.green.bold("SUCCESS  "), colors.green(message));
        }
        //Show error message
        if(type == "error") {
          console.log(colors.red(new Date().toLocaleString("en-GB")), colors.red.bold(format_module), colors.red.bold("ERROR    "), colors.red(message));
        }
        //Show error message
        if(type == "warning") {
          console.log(colors.yellow(new Date().toLocaleString("en-GB")), colors.yellow.bold(format_module), colors.yellow.bold("WARNING  "), colors.yellow(message));
        }
        //Show info message
        if(type == "info") {
          console.log(colors.blue(new Date().toLocaleString("en-GB")), colors.blue.bold(format_module), colors.blue.bold("INFO     "), colors.blue(message));
        }
      }
    }
  }

  async error(module, message) {
    this.make('error', module, message);
  }

  async warning(module, message) {
    this.make("warning", module, message);
  }

  async success(module, message) {
    this.make("success", module, message);
  }

  async info(module, message) {
    this.make("info", module, message);
  }

}
module.exports = new Log();
