import { getAuth, createClerkClient } from "@clerk/express";
import User from "../features/users/user.model.js";

let clerkClient;

export const userAuth = async (req, res, next) => {
  try {
    if (!clerkClient) {
      clerkClient = createClerkClient({
        secretKey: process.env.CLERK_SECRET_KEY,
      });
    }

    const { userId } = getAuth(req);

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    let dbUser = await User.findOne({ clerkId: userId });

    if (!dbUser) {
      const clerkUser = await clerkClient.users.getUser(userId);

      const userEmailObj =
        clerkUser.emailAddresses?.find(
          (email) => email.id === clerkUser.primaryEmailAddressId,
        ) || clerkUser.emailAddresses?.[0];

      const email = userEmailObj?.emailAddress;
      const fullName =
        [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
        "Unnamed User";

      dbUser = await User.create({
        clerkId: userId,
        userName: fullName,
        collegeEmail: email,
        profilePictureUrl: clerkUser.imageUrl,
      });
    }

    req.clerkId = userId;
    req.user = dbUser;

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error in Authentication" });
  }
};
