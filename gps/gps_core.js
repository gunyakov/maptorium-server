let POI = require("../src/poi");
//------------------------------------------------------------------------------
//Logging service
//------------------------------------------------------------------------------
let Log = require("../src/log.js");
//------------------------------------------------------------------------------
//General GPS handler
//------------------------------------------------------------------------------
class GPS {

  constructor(){
    this.callback = false;
    this.lastLng = 0;
    this.lastLat = 0;
    this.lat = 0;
    this.lng = 0;
    this.enable = false;
    this.record = true;
    this.sampleRateTime = 60000;
    this.update = false;
    //this.start();
  }

  async on(callback) {
    this.callback = callback
  }
  //----------------------------------------------------------------------------
  //Start GPS service function
  //----------------------------------------------------------------------------
  async start() {
    this.enable = true;
    Log.info("GPS", "GPS service started.");
    this.service();
  }
  //----------------------------------------------------------------------------
  //Stop GPS service function
  //----------------------------------------------------------------------------
  async stop() {
    this.enable = false;
    Log.info("GPS", "GPS service stoped.");
  }
  //----------------------------------------------------------------------------
  //Change sample rate time
  //----------------------------------------------------------------------------
  async sampleRate(rate = 60) {
    if(typeof rate == "number") {
      this.sampleRateTime = rate * 1000;
      Log.info("GPS", `Sample rate changed to ${rate} seconds.`);
      return true;
    }
    else {
      return false;
    }
  }
  //----------------------------------------------------------------------------
  //Toggle GPS Service state
  //----------------------------------------------------------------------------
  async toggle() {
    if(this.enable) {
      await this.stop();
    }
    else {
      await this.start();
    }
    return this.enable;
  }
  //----------------------------------------------------------------------------
  //Toggle gps record state
  //----------------------------------------------------------------------------
  async stopRecord() {
    this.record = false;
    Log.info("GPS", "Record service was stopped by user.");
    return this.record;
  }
  async startRecord() {
    this.record = true;
    Log.info("GPS", "Record service was started by user.");
    return this.record;
  }
  //----------------------------------------------------------------------------
  //Function to get GPS from external source
  //----------------------------------------------------------------------------
  async getGPSCoords() {

  }
  //----------------------------------------------------------------------------
  //Function to check if GPS was updated
  //----------------------------------------------------------------------------
  async updated() {
    if(this.update) {
      this.update = false;
      return true;
    }
    else {
      return false;
    }
  }
  //----------------------------------------------------------------------------
  //Service function to get GPS coords from server constantly
  //----------------------------------------------------------------------------
  async service() {
    //Wait 10 seconds before start GPS service
    await wait(10000);
    //Run cycle while service enabled
    while(this.enable) {
      await this.getGPSCoords();
      //If class have proper coordinates received from source
      if(this.lat && this.lng) {
        //If coords is different from last update and record enabled
        if(this.lastLng != this.lng || this.lastLat != this.lat) {
          if(this.record) {
            //Add coords to database
            await POI.routeAddPoint(this.lat, this.lng);
            //Make log
            Log.success("GPS", "GPS data recorded.");
          }
          //Save current coords into class vars
          this.lastLat = this.lat;
          this.lastLng = this.lng;
          //Call callback, if registered
          if(this.callback) {
            this.callback({lat: this.lat, lng: this.lng});
          }
        }
      }
      //Wait sample rate time
      await wait(this.sampleRateTime);
    }
  }
}

module.exports = GPS;
