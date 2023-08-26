//------------------------------------------------------------------------------
//HTTP Engine
//------------------------------------------------------------------------------
let httpEngine = require("../src/http-engine.js");
let socket = require("socket.io");

async function s1() {
    let lat = 0;
    let lng = 0;
    let http = new httpEngine();
    await http.get("http://192.168.1.110:8080/SDBnet/online/live/fetchLive", "json", true, "get", "", "JSESSIONID=2206FC81F0525B2E3900904237975B28");
    //If server return proper responce
    if(http.code == 200) {
        //Get Coords from JSON responce
        lng = http.response['lon_decimal'];
        lat = http.response['lat_decimal'];  
    }
    return {lat, lng};
}

async function s2() {
    let lat = 0;
    let lng = 0;
    let http = new httpEngine();
    await http.get("http://10.10.10.59:8080", "json", true);
    //If server return proper responce
    if(http.code == 200) {
        //Get Coords from JSON responce
        lng = http.response['lon_decimal'];
        lat = http.response['lat_decimal'];  
    }
    return {lat, lng};
}

module.exports = s1;

module.exports = s2;