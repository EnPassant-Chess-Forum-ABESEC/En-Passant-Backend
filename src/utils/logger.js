import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logDir = path.join(__dirname, "../../logs");

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFile = path.join(logDir, "workers.log");
const logStream = fs.createWriteStream(logFile, { flags: "a" });

const formatMessage = (args) => {
  return args
    .map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : String(arg)))
    .join(" ");
};

export const workerLogger = {
  log: (...args) => {
    const msg = `[${new Date().toISOString()}] [INFO] ${formatMessage(args)}\n`;
    console.log(...args); // Keep console output
    logStream.write(msg);
  },
  error: (...args) => {
    const msg = `[${new Date().toISOString()}] [ERROR] ${formatMessage(args)}\n`;
    console.error(...args);
    logStream.write(msg);
  },
};
