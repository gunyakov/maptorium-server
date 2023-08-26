//------------------------------------------------------------------------------
//GPS Core
//------------------------------------------------------------------------------
import GPS from "./gps_core";
//------------------------------------------------------------------------------
//Logging service
//------------------------------------------------------------------------------
import Log from "../src/log";
import { LogModules } from "../src/enum";
//------------------------------------------------------------------------------
//Wait функция
//------------------------------------------------------------------------------
import wait from "../helpers/wait";
//------------------------------------------------------------------------------
//Socket client to event converter
//------------------------------------------------------------------------------
let ClientNmeaSocket2Listener = require('client-nmea-socket-to-event');
//------------------------------------------------------------------------------
//Nmea parser
//------------------------------------------------------------------------------
import { parseNmeaSentence } from "nmea-simple";
//------------------------------------------------------------------------------
//SOCKET IO
//------------------------------------------------------------------------------
import { sendGPS } from "../src/io"; 
//------------------------------------------------------------------------------
//Extend GPS core to handle NMEA data by TCP
//------------------------------------------------------------------------------
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
        nmeaSocketClient.addListener("GPRMC", (data:any)=> {

            let packet:{latitude?:number, longitude?:number, trackTrue?:number} = {}

            try {
                let bufferOriginal = Buffer.from(data.raw);
                //console.log(bufferOriginal.toString('utf8'));
                let nmeaStr = bufferOriginal.toString('utf8');
                let nmeaArr = nmeaStr.split(" +");
                packet = parseNmeaSentence(nmeaArr[1]) as {latitude:number, longitude:number, trackTrue:number};
            }
            catch(e) {
                if(e instanceof Error) {
                    Log.warning(LogModules.gps, e.message);
                  }
                  else {
                    Log.warning(LogModules.gps, "Unknown error occured.");
                  }
            }

            if(typeof packet.latitude == "number" && typeof packet.longitude == "number") {
                this._lat = packet.latitude;
                this._lng = packet.longitude;
                this._dir = packet.trackTrue as number;
                this._update = true;
                //Send real time socket update
                sendGPS(this._lat, this._lng, this._dir);
            }
            
        });

        //Add event listener when recive messages type HLHUD recive here
        nmeaSocketClient.addListener("GPGSA", (data:any)=>{
            let bufferOriginal = Buffer.from(data.raw);
            //console.log(bufferOriginal.toString('utf8'));
            const packet = parseNmeaSentence(bufferOriginal.toString('utf8'));
            console.log("data", packet);
        })

        nmeaSocketClient.onConnect( ()=>{
            Log.success(LogModules.gps, "Connected to GPS TCP/IP Server.");
        } );

        nmeaSocketClient.onDisconnect( async()=>{
            Log.warning(LogModules.gps, "Disconnected from GPS TCP/IP Server.");
            await wait(10000);
            Log.info(LogModules.gps, "Trying to reconnect to GPS TCP/IP Server.");
            nmeaSocketClient.connect();
        } );

        nmeaSocketClient.connect();
    }
}

export default new GPS_TCP();