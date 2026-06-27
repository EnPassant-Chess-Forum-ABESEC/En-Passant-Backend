import { getAuth } from "@clerk/express";

export const userAuth = (req, res, next) => {
  const { userId } = getAuth(req);

  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  req.clerkId = userId;

  next();
};
