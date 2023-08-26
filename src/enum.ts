export enum ProxyProtocol {
    socks = "socks", 
    socks4 = "socks4", 
    socks5 = "socks5", 
    http = "http", 
    https = "https"
}

export enum LogType {
    info = "info",
    warning = "warning",
    error = "error",
    success = "success"
}

export enum LogShow {
    console = "console",
    message = "message",
    both = "both",
    disable = "disable"
}

export enum LogModules {
    main = "MAIN",
    tstor = "TSTOR",
    map = "MAP",
    sqlite3 = "SQLITE3",
    http = "HTTP",
    gps = "GPS",
    poi = "POI",
    worker = "WORKER"
}

export enum DBState {
    inprogress = "inprogress",
    open = "open",
    closed = "closed"
}

export enum POIType {
    polygon = "polygon",
    polyline = "polyline",
    point = "point"
}

export enum DownloadMode {
    enable = "enable",
    disable = "disable",
    force = "force"
}

export enum TileInCache {
    missing = "missing",
    present = "present",
    empty = "empty"
}

export enum DownloaderAction {
    download = "download",
    update = "update",
    skip = "skip"
}

export enum JobType {
    download = "download",
    generate = "generate"
}