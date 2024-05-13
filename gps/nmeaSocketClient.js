const NmeaBuffer    = require('nmea-buffer') ;
const net           = require('net') ;
const Stream2Event  = require('socketstream2event') ;
const DispatchMessage2Listeners     = require('dispatch-message-to-listeners') ;    
/**
 * 
 * @param {object} config {ip, port, log, autoReconnect}
 */
function ClientNmeaSocket2Event(config){
    /**
     * CONFIGs
     */
    var ip              = (config) ? config.ip : null ;
    var port            = (config) ? config.port : null ;
    var log             = (config) ? config.log : null ;
    var autoReconnect   = (config) ? config.autoReconnect : true ;
    var forceCheckSum   = (config && config.hasOwnProperty('forceCheckSum')) ? config.forceCheckSum : null ;
    const connectionInfo = {
        connected   : false,
        message     : "waiting",
        label       : "offline"
    } ;
    //#### PARAMETHERS
    const client = new net.Socket() ;
    client.setMaxListeners(0);
    //setando 10 padrão nmea que estamos usando
    const stream = new Stream2Event([13,10]) ;
    
    //Parser and dispatcher
    const dispatcher = new DispatchMessage2Listeners( ) ;
    stream.addOnData( (data)=>{
        let dataParsed = NmeaBuffer.parse(data) ;
        dataParsed.raw = data ;
       dispatcher.dispatchToListeners(dataParsed.header, dataParsed ) ; 
    } )
    var listenersDisconnect = () => {};
    var listenersConnect = () => {};
    const onConnectDispatch = ()=>{
        listenersConnect()
    }
    const onDisconnectDispatch = ()=>{
        listenersDisconnect()
    }
    //parsing on data recived
    client.on('data', (data)=>{ stream.parseData(data)} );
    //on close reconnect and info
    client.on('close', function() {
        if( log ) console.log('Connection closed');
        //do not use this: client.removeAllListeners() ;
        connectionInfo.connected = false ;
        connectionInfo.message = "disconnected at "+ new Date(); ;
        connectionInfo.label = "offline";
        onDisconnectDispatch() ;
        if(autoReconnect){
            connectionInfo.message += " trying to reconnect" ;
            setTimeout(tryToConnect, 1000) ;
        }
    });
    client.on('error', ()=>{
        connectionInfo.connected = false ;
        connectionInfo.message = "Error at "+ new Date(); ;
        connectionInfo.label = "offline";
    });
    //#### PRIVATE METHODS
    function tryToConnect(){
        client.connect( port, ip, function() {
            if( log ) console.log('Connected');
            connectionInfo.connected = true ;
            connectionInfo.message = "connected at "+ new Date(); ;
            connectionInfo.label = "connected";
            onConnectDispatch() ;
        });
    }
    
    //#### PUBLIC METHODS 
    //send private messages
    this.sendMessage = (header = null, message = null)=>{
        if(!header){pwd
            if(log) console.log("SendMessage need header info")
            return false ;
        }
        var buf = NmeaBuffer.getMessageBuffer( header, message, forceCheckSum ) ;
        client.write( buf ) ;
    }
    //return connection info
    this.getConnectionInfo = ()=>{
        return connectionInfo ;
    }
    //ask to connect
    this.connect = ()=>{
        if(!connectionInfo.connected){
            tryToConnect() ;
        }
    }
    this.disconnect = () => {
        client.end();
    }
    /**
     * Add listener to all method name recived messages
     * @param {*} methodName 
     * @param {*} callback 
     */
    this.addListener = (methodName, callback )=>{
        dispatcher.addListener( methodName, callback ) ;
    }
    /**
     * Add listener just on change message
     * @param {*} methodName 
     * @param {*} callback 
     */
    this.addListenerOnChange = (methodName, callback )=>{
        dispatcher.addListenerOnChange( methodName, callback ) ;
    }
    this.onConnect = ( callback )=>{
        listenersConnect= callback  ;
    }
    this.onDisconnect = (callback)=>{
        listenersDisconnect = callback ;
    }
}

module.exports = ClientNmeaSocket2Event ; 