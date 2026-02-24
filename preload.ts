import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("appControls", {
  minimize: () => ipcRenderer.send("app:minimize"),
  toggleMaximize: () => ipcRenderer.send("app:toggle-maximize"),
  close: () => ipcRenderer.send("app:close"),
});
