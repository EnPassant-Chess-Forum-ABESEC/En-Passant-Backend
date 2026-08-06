import { getAuth, createClerkClient } from "@clerk/express";
import User from "../features/users/user.model.js";
import { enqueueWelcomeEmail } from "../features/email/email.queue.js";

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

      if (email) {
        dbUser = await User.findOne({ collegeEmail: email });
        if (dbUser) {
          return res.status(403).json({
            message:
              "An account with this email already exists but is orphaned. Please contact support to link your account.",
          });
        }
      }

      const phoneNumbers = clerkUser.phoneNumbers || [];
      const phoneNumberObj =
        phoneNumbers.find(
          (phone) => phone.id === clerkUser.primaryPhoneNumberId,
        ) || phoneNumbers[0];
      const phoneNumber = phoneNumberObj?.phoneNumber;

      if (!dbUser) {
        dbUser = await User.create({
          clerkId: userId,
          userName: fullName,
          collegeEmail: email,
          phoneNumber: phoneNumber,
          profilePictureUrl: clerkUser.imageUrl,
        });

        if (email) {
          await enqueueWelcomeEmail(dbUser._id, email, fullName);
        }
      }
    }

    req.clerkId = userId;
    req.user = dbUser;

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    res.status(500).json({
      message: "Internal Server Error in Authentication",
      error: error.message,
      stack: error.stack,
    });
  }
};

export const adminAuth = async (req, res, next) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findOne({ clerkId: userId });

    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role !== "admin")
      return res.status(403).json({ message: "Unauthorized as admin" });

    req.clerkId = userId;
    req.user = user;

    next();
  } catch (error) {
    console.log("Admin auth error:", error);

    res
      .status(500)
      .json({ message: "Internal Server Error in Admin Authentication" });
  }
};
