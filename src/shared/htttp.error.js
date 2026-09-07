import HttpStatusCodes from "http-status-codes";

export default class HttpError extends Error {
  httpStatusCode = HttpStatusCodes.BAD_REQUEST;

  constructor(msg, httpStatusCode) {
    super(msg);
    this.httpStatusCode = httpStatusCode;
  }

  static unauthorized(msg) {
    return new this(msg ? msg : "Unauthorized", HttpStatusCodes.UNAUTHORIZED);
  }

  static notFound(msg) {
    return new this(msg ? msg : "Not found", HttpStatusCodes.NOT_FOUND);
  }

  static badRequest(msg) {
    return new this(msg ? msg : "Bad request", HttpStatusCodes.BAD_REQUEST);
  }
}
