let GPS = require("./gps_core.js");
//------------------------------------------------------------------------------
//Logging service
//------------------------------------------------------------------------------
let Log = require("../src/log.js");
const ClientNmeaSocket2Listener = require('client-nmea-socket-to-event') ;

const nmea = require("nmea-simple");

class GPS_TCP extends GPS {
    
    constructor() {
        super();
        const nmeaSocketClient = new ClientNmeaSocket2Listener(
            {
                ip:'172.20.3.1',
                port:50001,
                log:false,
                autoReconnect:false
            }
        ) ;
        nmeaSocketClient.addListener("GPRMC", (data)=> {
            //console.log(data);
            let bufferOriginal = Buffer.from(data.raw);
            //console.log(bufferOriginal.toString('utf8'));
            let nmeaStr = bufferOriginal.toString('utf8');
            nmeaStr = nmeaStr.split(" +");
            nmeaStr = nmeaStr[1];
            const packet = nmea.parseNmeaSentence(nmeaStr);
            this.lat = packet.latitude;
            this.lng = packet.longitude;
            this.update = true;
            //console.log("data", packet);
            //recive object { header, message }
            //console.log("recived ", data.header, data.message )
        });

        //Add event listener when recive messages type HLHUD recive here
        nmeaSocketClient.addListener("GPGSA", (data)=>{
            let bufferOriginal = Buffer.from(data.raw);
            //console.log(bufferOriginal.toString('utf8'));
            const packet = nmea.parseNmeaSentence(bufferOriginal.toString('utf8'));
            //console.log("data", packet);
        })

        nmeaSocketClient.onConnect( ()=>{
            Log.success("GPS", "Connected to GPS TCP/IP Server.");
        } );

        nmeaSocketClient.onDisconnect( async()=>{
            Log.warning("GPS", "Disconnected from GPS TCP/IP Server.");
            await wait(10000);
            Log.info("GPS", "Trying to reconnect to GPS TCP/IP Server.");
            nmeaSocketClient.connect();
        } );

        nmeaSocketClient.connect();
    }
}

module.exports = new GPS_TCP();