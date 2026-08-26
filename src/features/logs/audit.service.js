import { redisConnection } from "../../redis/redis.client.js";
import AuditLog from "./auditLog.model.js";

const PRESENCE_CACHE_TTL = 43200;

export const trackPresence = async (user, ip, userAgent) => {
  try {
    const presenceKey = `admin:presence:${user._id}`;
    const hasPresence = await redisConnection.get(presenceKey);

    if (!hasPresence) {
      await AuditLog.create({
        adminId: user._id,
        action: "PRESENCE",
        details: { ip, userAgent },
      });
      await redisConnection.setex(presenceKey, PRESENCE_CACHE_TTL, "true");
    }
  } catch (error) {
    console.error("Failed to log admin presence:", error);
  }
};

export const logAdminAction = async (
  user,
  action,
  targetId = null,
  details = {},
) => {
  try {
    await AuditLog.create({
      adminId: user._id,
      action,
      targetId,
      details,
    });
  } catch (error) {
    console.error(`Failed to log admin action [${action}]:`, error);
  }
};
