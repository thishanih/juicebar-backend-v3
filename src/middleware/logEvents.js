import moment from "moment";
import { v4 as uuid } from "uuid";
import { promises as fsPromises, existsSync, mkdirSync, appendFile } from "fs";
import { fileURLToPath } from "url";
import path from "path";

export const logEvents = async (message, logName) => {
  const dateTime = moment(new Date()).format("MMMM Do YYYY, h:mm:ss a");
  const logItem = `${dateTime}\t${uuid()}\t${message}\n`;
  const dirname = path.dirname(fileURLToPath(import.meta.url));
  try {
    if (!existsSync(path.join(dirname, "..", "logs"))) {
      await fsPromises.mkdir(path.join(dirname, "..", "logs"));
    }
    await fsPromises.appendFile(path.join(dirname, "..", "logs", logName), logItem);
  } catch (err) {}
};

export const logger = (req, res, next) => {
  logEvents(
    `${req.method}\t${req.headers.origin}\t${req.headers["user-agent"]}\t${req.url}`,
    "reqLog.txt"
  );
  next();
};
