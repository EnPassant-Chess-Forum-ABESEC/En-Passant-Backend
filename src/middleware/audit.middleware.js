import { trackPresence } from "../features/logs/audit.service.js";

export const auditPresenceMiddleware = async (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    const ip =
      req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"];
    await trackPresence(req.user, ip, userAgent);
  }
  next();
};
