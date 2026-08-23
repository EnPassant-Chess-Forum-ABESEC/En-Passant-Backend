import winston from "winston";
import { Logtail } from "@logtail/node";
import { LogtailTransport } from "@logtail/winston";

const { combine, timestamp, printf, colorize } = winston.format;

const consoleFormat = printf(({ level, message, timestamp }) => {
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
});

const transports = [
  new winston.transports.Console({
    format: combine(timestamp(), consoleFormat),
  }),
];

if (process.env.LOGTAIL_SOURCE_TOKEN) {
  const logtail = new Logtail(process.env.LOGTAIL_SOURCE_TOKEN);
  transports.push(new LogtailTransport(logtail));
}

const logger = winston.createLogger({
  level: "info",
  transports,
});

export const workerLogger = {
  log: (...args) => {
    const message = args
      .map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : String(arg)))
      .join(" ");
    logger.info(message);
  },
  error: (...args) => {
    const message = args
      .map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : String(arg)))
      .join(" ");
    logger.error(message);
  },
};
