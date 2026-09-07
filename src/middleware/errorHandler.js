import { logEvents } from "./logEvents.js";
import HttpError from "../shared/htttp.error.js";

export const errorHandler = (err, req, res, next) => {
  logEvents(`${err.name}: ${err.message}`, "errLog.txt");
  if (res.headersSent) return next(err);

  const statusCode = err instanceof HttpError ? err.httpStatusCode : 500;
  const message = statusCode >= 500 ? "Internal server error" : err.message;
  return res.status(statusCode).json({ message: message });
};
