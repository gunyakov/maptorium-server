/**
 * Represent pixel point
 * @interface
 * @name Point
 */
interface Point {
  x: number;
  y: number;
}
/**
 * Represent coordinate point
 * @interface
 * @name LatLng
 */
interface LatLng {
  lat: number;
  lng: number;
}

/**
 * GEO functions to convert coords to pixels and back
 */
class EPSG3857 {
  private _earthRadius = 6378137;
  private MAX_LATITUDE = 85.0511287798;
  private transformation: Transformation = new Transformation(0, 0, 0, 0);

  constructor() {
    let scale = 0.5 / (Math.PI * this._earthRadius);
    this.transformation = new Transformation(scale, 0.5, -scale, 0.5);
  }
  /**
   * @method latLngToPoint(latlng: LatLng, zoom: Number): {@link Point}
   * Projects geographical coordinates into pixel coordinates for a given zoom.
   * @param {LatLng} latlng - {@link LatLng} point.
   * @param {number} zoom
   * @returns {@link Point}
   */
  public latLngToPoint(latlng: LatLng, zoom: number) {
    var projectedPoint = this.project(latlng),
      scale = this.scale(zoom);

    return this.transformation._transform(projectedPoint, scale);
  }
  /**
   * The inverse of `latLngToPoint`. Projects pixel coordinates on a given
   * zoom into geographical coordinates.
   * @param {Point} point - {@link Point} with pixel coords
   * @param {number} zoom - Required zoom for transformation
   * @returns LatLng - {@link LatLng}
   */
  public pointToLatLng(point: Point, zoom: number) {
    var scale = this.scale(zoom),
      untransformedPoint = this.transformation.untransform(point, scale);

    return this.unproject(untransformedPoint);
  }
  /**
   * Returns the scale used when transforming projected coordinates into
   * pixel coordinates for a particular zoom. For example, it returns
   * `256 * 2^zoom` for Mercator-based CRS.
   * @method scale(zoom: Number): Number
   * @param {number} zoom
   * @returns number
   */
  private scale(zoom: number) {
    return 256 * Math.pow(2, zoom);
  }
  /**
   * @method zoom(scale: Number): Number
   * Inverse of `scale()`, returns the zoom level corresponding to a scale
   * factor of `scale`.
   * @param {number} scale
   * @returns number
   */
  private zoom(scale: number) {
    return Math.log(scale / 256) / Math.LN2;
  }
  /**
   *
   * @param {LatLng} latlng
   * @returns Point
   */
  public project(latlng: LatLng): Point {
    var d = Math.PI / 180,
      max = this.MAX_LATITUDE,
      lat = Math.max(Math.min(max, latlng.lat), -max),
      sin = Math.sin(lat * d);

    return {
      x: this._earthRadius * latlng.lng * d,
      y: (this._earthRadius * Math.log((1 + sin) / (1 - sin))) / 2,
    };
  }
  /**
   *
   * @param {Point} point
   * @returns LatLng
   */
  public unproject(point: Point): LatLng {
    var d = 180 / Math.PI;

    return {
      lat:
        (2 * Math.atan(Math.exp(point.y / this._earthRadius)) - Math.PI / 2) *
        d,
      lng: (point.x * d) / this._earthRadius,
    };
  }
}

/*
 * @class Transformation
 * @aka L.Transformation
 *
 * Represents an affine transformation: a set of coefficients `a`, `b`, `c`, `d`
 * for transforming a point of a form `(x, y)` into `(a*x + b, c*y + d)` and doing
 * the reverse. Used by Leaflet in its projections code.
 *
 * @example
 *
 * ```js
 * var transformation = L.transformation(2, 5, -1, 10),
 * 	p = L.point(1, 2),
 * 	p2 = transformation.transform(p), //  L.point(7, 8)
 * 	p3 = transformation.untransform(p2); //  L.point(1, 2)
 * ```
 */
class Transformation {
  private _a: number = 0;
  private _b: number = 0;
  private _c: number = 0;
  private _d: number = 0;

  /**
   * @param {number} a
   * @param {number} b
   * @param {number} c
   * @param {number} d
   */
  constructor(a: number, b: number, c: number, d: number) {
    this._a = a;
    this._b = b;
    this._c = c;
    this._d = d;
  }
  /**
   * @method transform(point: Point, scale?: Number): Point
   * Returns a transformed point, optionally multiplied by the given scale.
   * Only accepts actual `L.Point` instances, not arrays.
   * @param {Point} point - Original point
   * @param {number} scale - scale options
   * @returns {Point} - transformed Point
   */
  public transform(point: Point, scale: number) {
    // (Point, Number) -> Point
    return this._transform(point, scale);
  }

  /**
   * @method _transform(point: Point, scale?: Number): Point
   * destructive transform (faster)
   * @param {Point} point - Original Point
   * @param {number} scale - scale options
   * @returns {Point} - transformed Point
   */
  public _transform(point: Point, scale: number) {
    scale = scale || 1;
    point.x = scale * (this._a * point.x + this._b);
    point.y = scale * (this._c * point.y + this._d);
    return point;
  }
  /**
   * @method untransform(point: Point, scale?: number): Point
   * Returns the reverse transformation of the given point, optionally divided
   * by the given scale. Only accepts actual `Point` instances, not arrays.
   * @param {Point} point - Original point
   * @param {number} scale - scale options
   * @returns {Point} - Untransformed Point
   */
  public untransform(point: Point, scale: number) {
    scale = scale || 1;
    return {
      x: (point.x / scale - this._b) / this._a,
      y: (point.y / scale - this._d) / this._c,
    };
  }
}

export default new EPSG3857();
