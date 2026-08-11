import { Log } from "../features/logs/log.model.js";

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
    console.log(`[${new Date().toISOString()}] [INFO] ${formatted}`);
    saveToDb("INFO", formatted);
  },
  error: (...args) => {
    const formatted = formatMessage(args);
    console.error(`[${new Date().toISOString()}] [ERROR] ${formatted}`);
    saveToDb("ERROR", formatted);
  },
};
