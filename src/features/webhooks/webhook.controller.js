import { AppError } from "../../utils/AppError.js";
import { Webhook } from "svix";
import User from "../users/user.model.js";
import { enqueueWelcomeEmail } from "../email/email.queue.js";

export const clerkWebhook = async (req, res, next) => {
  try {
    const SIGNING_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!SIGNING_SECRET) {
      throw new AppError("Error: CLERK_WEBHOOK_SECRET missing", 500);
    }

    const wh = new Webhook(SIGNING_SECRET);

    const headers = req.headers;
    const payload = req.rawBody;

    const svix_id = headers["svix-id"];
    const svix_timestamp = headers["svix-timestamp"];
    const svix_signature = headers["svix-signature"];

    if (!svix_id || !svix_timestamp || !svix_signature) {
      return res.status(400).json({
        success: false,
        message: "Error: Missing svix headers",
      });
    }

    let evt;

    try {
      evt = wh.verify(payload, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      });
    } catch (err) {
      console.error("Error: Could not verify webhook:", err.message);
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    const { id } = evt.data;
    const eventType = evt.type;

    if (eventType === "user.created" || eventType === "user.updated") {
      const emailObj =
        evt.data.email_addresses?.find(
          (email) => email.id === evt.data.primary_email_address_id,
        ) || evt.data.email_addresses?.[0];
      const email = emailObj?.email_address;

      const fullName =
        [evt.data.first_name, evt.data.last_name].filter(Boolean).join(" ") ||
        "Unnamed User";

      const phoneNumbers = evt.data.phone_numbers || [];
      const phoneNumberObj =
        phoneNumbers.find(
          (phone) => phone.id === evt.data.primary_phone_number_id,
        ) || phoneNumbers[0];
      const phoneNumber = phoneNumberObj?.phone_number;

      const imageUrl = evt.data.image_url;

      if (eventType === "user.created") {
        let dbUser = null;

        if (email) {
          dbUser = await User.findOne({ email: email });
        }

        if (!dbUser) {
          dbUser = await User.create({
            clerkId: id,
            userName: fullName,
            email: email,
            phoneNumber: phoneNumber,
            profilePictureUrl: imageUrl,
          });

          if (email) {
            await enqueueWelcomeEmail(dbUser._id, email, fullName);
          }
          console.log(`[Webhook] Created new user: ${email}`);
        } else {
          console.log(`[Webhook] User with email ${email} already exists.`);
          if (!dbUser.clerkId || dbUser.clerkId !== id) {
            dbUser.clerkId = id;
            dbUser.userName = fullName;
            dbUser.profilePictureUrl = imageUrl;
            dbUser.phoneNumber = phoneNumber;
            await dbUser.save();
          }
        }
      } else if (eventType === "user.updated") {
        const updatedUser = await User.findOneAndUpdate(
          { clerkId: id },
          {
            userName: fullName,
            email: email,
            phoneNumber: phoneNumber,
            profilePictureUrl: imageUrl,
          },
          { new: true },
        );
        if (updatedUser) {
          console.log(`[Webhook] Updated user profile: ${email}`);
        } else {
          console.log(
            `[Webhook] user.updated event but user not found in DB: ${id}`,
          );
        }
      }
    }

    if (eventType === "user.deleted") {
      const deletedUser = await User.findOneAndDelete({ clerkId: id });
      if (deletedUser) {
        const { default: Recruitment } =
          await import("../recruitment/recruitment.model.js");
        const { default: Submission } =
          await import("../submissions/submission.model.js");
        const { default: Payment } =
          await import("../payments/payment.model.js");
        const { removeUserFromLeaderboard } =
          await import("../leaderboard/leaderboard.service.js");

        const applications = await Recruitment.find({
          userId: deletedUser._id,
        });
        const appIds = applications.map((app) => app._id);

        if (appIds.length > 0) {
          await Submission.deleteMany({ applicationId: { $in: appIds } });
        }
        await Recruitment.deleteMany({ userId: deletedUser._id });
        await Payment.deleteMany({ userId: deletedUser._id });
        await removeUserFromLeaderboard(id);

        console.log(
          `[Webhook] Deleted user ${deletedUser.email} and all linked applications/payments/leaderboard entries.`,
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: "Webhook received",
    });
  } catch (error) {
    console.error("Clerk Webhook Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
