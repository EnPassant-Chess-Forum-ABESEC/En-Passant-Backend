import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Log } from "../features/logs/log.model.js";

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

const saveToDb = async (level, message) => {
  try {
    await Log.create({ level, message, source: "worker" });
  } catch (err) {
    console.error("Failed to save log to DB:", err.message);
  }
};

export const workerLogger = {
  log: (...args) => {
    const formatted = formatMessage(args);
    const msg = `[${new Date().toISOString()}] [INFO] ${formatted}\n`;
    console.log(...args); // Keep console output
    logStream.write(msg);
    saveToDb("INFO", formatted);
  },
  error: (...args) => {
    const formatted = formatMessage(args);
    const msg = `[${new Date().toISOString()}] [ERROR] ${formatted}\n`;
    console.error(...args);
    logStream.write(msg);
    saveToDb("ERROR", formatted);
  },
};
