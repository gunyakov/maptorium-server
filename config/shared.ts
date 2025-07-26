let configReady = false;
function isConfigReady() {
  return configReady;
}
function setConfigReady(value: boolean) {
  configReady = value;
}
export { isConfigReady, setConfigReady };
