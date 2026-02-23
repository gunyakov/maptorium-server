import type { GenJobInfo, iJobConfig } from "../src/interface";

export type DownloadPayload = Omit<
  iJobConfig["download"],
  "ID" | "threadsCounter"
> &
  Partial<Pick<iJobConfig["download"], "ID" | "threadsCounter">>;

type ValidateOk<T> = { ok: true; data: T };
type ValidateError = { ok: false; messageKey: string };

type ValidateResult<T> = ValidateOk<T> | ValidateError;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isString = (value: unknown): value is string => typeof value === "string";

const isBoolean = (value: unknown): value is boolean =>
  typeof value === "boolean";

export const validatePolygon = (
  value: unknown,
): value is iJobConfig["polygon"] | GenJobInfo["polygon"] => {
  if (!Array.isArray(value) || value.length < 3) return false;
  return value.every((point) => {
    if (!isObject(point)) return false;
    if (!isNumber(point.lat) || !isNumber(point.lng)) return false;
    if (point.lat < -90 || point.lat > 90) return false;
    if (point.lng < -180 || point.lng > 180) return false;
    return true;
  });
};

const validateDownload = (value: unknown): value is DownloadPayload => {
  if (!isObject(value)) return false;
  if (!isString(value.mapID) || value.mapID.length < 1) return false;
  if (!isBoolean(value.randomDownload)) return false;
  if (!isBoolean(value.updateTiles)) return false;
  if (!isBoolean(value.updateDifferent)) return false;
  if (!isBoolean(value.updateDateTiles)) return false;
  if (!isString(value.dateTiles)) return false;
  if (!isBoolean(value.emptyTiles)) return false;
  if (!isBoolean(value.checkEmptyTiles)) return false;
  if (!isBoolean(value.updateDateEmpty)) return false;
  if (!isString(value.dateEmpty)) return false;
  if (!isObject(value.zoom)) return false;

  const zoomValues = Object.values(value.zoom);
  if (zoomValues.length < 1 || !zoomValues.some((item) => item === true)) {
    return false;
  }

  for (const key of Object.keys(value.zoom)) {
    if (!/^\d+$/.test(key)) return false;
    const zoom = parseInt(key, 10);
    if (zoom < 0 || zoom > 24) return false;
    if (!isBoolean(value.zoom[key])) return false;
  }

  return true;
};

const validateNetwork = (value: unknown): value is iJobConfig["network"] => {
  if (!isObject(value)) return false;
  if (!isObject(value.request)) return false;
  if (!isString(value.request.userAgent)) return false;
  if (!isNumber(value.request.timeout)) return false;
  if (!isNumber(value.request.delay)) return false;
  if (!isBoolean(value.banTimeMode)) return false;
  if (!isObject(value.proxy)) return false;
  if (!isBoolean(value.proxy.enable)) return false;
  if (!isObject(value.proxy.server)) return false;
  if (!isString(value.proxy.server.protocol)) return false;
  if (!isString(value.proxy.server.host)) return false;
  if (!isNumber(value.proxy.server.port)) return false;
  if (!isBoolean(value.proxy.authRequired)) return false;
  if (!isObject(value.proxy.auth)) return false;
  if (!isString(value.proxy.auth.username)) return false;
  if (!isString(value.proxy.auth.password)) return false;
  return true;
};

export const validateDownloadJobRequest = (
  body: unknown,
): ValidateResult<{
  polygonID: number;
  polygon: iJobConfig["polygon"];
  customNetworkConfig: boolean;
  network?: iJobConfig["network"];
  download: DownloadPayload;
}> => {
  if (!isObject(body)) {
    return { ok: false, messageKey: "request.job.validation.body_invalid" };
  }
  if (!validateDownload(body.download)) {
    return { ok: false, messageKey: "request.job.validation.download_invalid" };
  }
  if (!validatePolygon(body.polygon)) {
    return { ok: false, messageKey: "request.job.validation.polygon_invalid" };
  }
  if (!isBoolean(body.customNetworkConfig)) {
    return {
      ok: false,
      messageKey: "request.job.validation.custom_network_invalid",
    };
  }
  if (body.customNetworkConfig && !validateNetwork(body.network)) {
    return { ok: false, messageKey: "request.job.validation.network_invalid" };
  }

  return {
    ok: true,
    data: {
      polygonID: isNumber(body.polygonID) ? body.polygonID : 0,
      polygon: body.polygon,
      customNetworkConfig: body.customNetworkConfig,
      network: body.customNetworkConfig
        ? (body.network as iJobConfig["network"])
        : undefined,
      download: body.download,
    },
  };
};

export const validateGenerateJobRequest = (
  body: unknown,
): ValidateResult<GenJobInfo> => {
  if (!isObject(body)) {
    return { ok: false, messageKey: "request.job.validation.body_invalid" };
  }
  if (!isString(body.ID)) {
    return {
      ok: false,
      messageKey: "request.job.validation.generate_id_invalid",
    };
  }
  if (!isString(body.mapID) || body.mapID.length < 1) {
    return { ok: false, messageKey: "request.job.validation.map_id_invalid" };
  }
  if (!validatePolygon(body.polygon)) {
    return { ok: false, messageKey: "request.job.validation.polygon_invalid" };
  }
  if (!Array.isArray(body.zoom) || body.zoom.length < 1) {
    return { ok: false, messageKey: "request.job.validation.zoom_empty" };
  }
  if (!body.zoom.every((item) => isString(item) && /^\d+$/.test(item))) {
    return { ok: false, messageKey: "request.job.validation.zoom_invalid" };
  }
  if (!isString(body.fromZoom) || !/^\d+$/.test(body.fromZoom)) {
    return {
      ok: false,
      messageKey: "request.job.validation.from_zoom_invalid",
    };
  }
  if (
    !isBoolean(body.updateTiles) ||
    !isBoolean(body.completeTiles) ||
    !isBoolean(body.previousZoom)
  ) {
    return {
      ok: false,
      messageKey: "request.job.validation.generate_flags_invalid",
    };
  }

  return {
    ok: true,
    data: {
      ID: body.ID,
      mapID: body.mapID,
      polygonID: isNumber(body.polygonID) ? body.polygonID : 0,
      polygon: body.polygon,
      zoom: body.zoom,
      updateTiles: body.updateTiles,
      completeTiles: body.completeTiles,
      fromZoom: body.fromZoom,
      previousZoom: body.previousZoom,
    },
  };
};
