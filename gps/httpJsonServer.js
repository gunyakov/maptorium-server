//------------------------------------------------------------------------------
//HTTP Engine
//------------------------------------------------------------------------------
let httpEngine = require("../src/http-engine.js");
let socket = require("socket.io");

async function s1() {
    let lat = 0;
    let lng = 0;
    let gpsData = await httpEngine.get("http://192.168.1.110:8080/SDBnet/online/live/fetchLive", config, "json", true, "get", "", "JSESSIONID=2206FC81F0525B2E3900904237975B28");
    //If server return proper responce
    if(gpsData.data) {
        //Get Coords from JSON responce
        lng = gpsData.data['lon_decimal'];
        lat = gpsData.data['lat_decimal'];  
    }
    return {lat, lng};
}

async function s2() {
    let lat = 0;
    let lng = 0;
    let gpsData = await httpEngine.get("http://10.10.10.59:8080", config, "json", true);
    console.log("GPS Responce", gpsData);
    //If server return proper responce
    if(gpsData.data) {
        //Get Coords from JSON responce
        lng = gpsData.data['lon_decimal'];
        lat = gpsData.data['lat_decimal'];
    }
    return {lat, lng};
}

module.exports = s1;

module.exports = s2;