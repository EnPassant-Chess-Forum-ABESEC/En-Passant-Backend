import { AppError } from "../../../utils/AppError.js";
import * as regRepo from "./event.registration.repository.js";
import * as eventRepo from "../event.repository.js";
import * as userRepo from "../../users/user.repository.js";
import * as paymentRepo from "../../payments/payment.repository.js";
import Payment from "../../payments/payment.model.js";
import { EventRegistration } from "./event.registration.model.js";
import { uploadFile, deleteFile } from "../../storage/storage.service.js";
import { fetchChessComRapidVerification } from "../../sync/adapters/chesscom.adapter.js";
import {
  PAYMENT_STATUS,
  REGISTRATION_STATUS,
  REGISTRATION_TYPE,
  generateJoinCode,
} from "../event.constants.js";
import { clearAdminCache } from "../../../redis/redis.client.js";

export const getSectionFee = (sectionName) => {
  const s = (sectionName || "").toLowerCase().trim();
  if (s === "womens" || s === "women") return 40;
  if (s === "interclub" || s === "inter-club" || s === "inter club") return 80;
  return 60;
};

export const createRegistration = async (
  userId,
  eventId,
  regBody,
  file,
  userObj,
) => {
  const event = await eventRepo.findEventById(eventId);
  if (!event) throw new AppError("Event not found", 404);

  if (event.registrationDeadline && new Date() > event.registrationDeadline)
    throw new AppError("Registration deadline has passed for the event", 400);

  const existing = await regRepo.findRegistrationByUserAndEventId(
    userId,
    eventId,
  );

  if (existing) throw new AppError("Duplicate registration", 409);

  if (!regBody.utr || !regBody.utr.trim()) {
    throw new AppError("Transaction UTR is required", 400);
  }

  if (!file) {
    throw new AppError("Payment screenshot is required", 400);
  }

  const user = userObj || (await userRepo.findById(userId));
  if (!user) throw new AppError("User not found", 404);

  const chessAccount = user.chessAccounts?.chessCom;
  if (!chessAccount?.username) {
    throw new AppError(
      "Please link your Chess.com account in your profile before registering",
      400,
    );
  }

  if (!chessAccount.verified) {
    throw new AppError(
      "Your Chess.com account is not verified. Please verify your Chess.com account via OAuth in your profile before registering",
      400,
    );
  }

  const verification = await fetchChessComRapidVerification(
    chessAccount.username,
  );

  if (verification.rapidGamesCount < 5) {
    throw new AppError(
      `You have played ${verification.rapidGamesCount} bullet games in the past 30 days on Chess.com. A minimum of 5 bullet games in the last 30 days is required to determine your bracket placement.`,
      400,
    );
  }

  const { participationMode } = event;
  const sectionName = (regBody.section || "open").toLowerCase().trim();
  const peakRating = verification.peakRapidRating;

  let assignedBracket = (regBody.bracket || "open").toLowerCase().trim();
  const targetSection = event.sections?.find(
    (s) => s.name?.toLowerCase() === sectionName,
  );

  if (targetSection?.brackets && targetSection.brackets.length > 0) {
    if (targetSection.brackets.length === 1) {
      assignedBracket = targetSection.brackets[0].name.toLowerCase().trim();
    } else {
      const matched = targetSection.brackets.find(
        (b) =>
          (b.minRating == null || peakRating >= b.minRating) &&
          (b.maxRating == null || peakRating <= b.maxRating),
      );

      if (matched) {
        assignedBracket = matched.name.toLowerCase().trim();
      } else {
        const sortedBrackets = [...targetSection.brackets].sort(
          (a, b) => (b.maxRating || 3000) - (a.maxRating || 3000),
        );
        if (peakRating > (sortedBrackets[0].maxRating || 0)) {
          assignedBracket = sortedBrackets[0].name.toLowerCase().trim();
        } else {
          assignedBracket = targetSection.brackets[0].name.toLowerCase().trim();
        }
      }
    }
  }

  const isWomensSection =
    sectionName === "womens" || sectionName === "women";
  const isHosteler = Boolean(regBody.isHosteler);
  const residentType = isHosteler
    ? "hosteler"
    : isWomensSection
      ? "day_scholar"
      : null;

  const userNameSanitized = (user.userName || "user")
    .replace(/[^a-zA-Z0-9]/g, "_")
    .toLowerCase();
  const dateStr = new Date().toISOString().split("T")[0];
  const publicId = `receipts/${userNameSanitized}_${dateStr}_${Date.now()}`;

  const uploadResult = await uploadFile(file.buffer, {
    public_id: publicId,
    folder: "event_payments",
  });

  const feeInRupees = getSectionFee(sectionName);
  const feeInPaise = feeInRupees * 100;

  const effectiveClubName =
    regBody.clubName?.trim() ||
    regBody.teamName?.trim() ||
    regBody.participation?.teamName?.trim() ||
    null;

  const effectiveTeamName =
    regBody.teamName?.trim() ||
    regBody.participation?.teamName?.trim() ||
    (sectionName === "interclub" ? effectiveClubName : null);

  const regData = {
    eventId,
    registrationType:
      participationMode ||
      regBody.participation?.participationType ||
      "solo",
    section: sectionName,
    bracket: assignedBracket,
    isHosteler,
    residentType,
    peakRapidRating: peakRating,
    rapidGamesCount: verification.rapidGamesCount,
    chessUsername: chessAccount.username,
    paymentStatus: PAYMENT_STATUS.PENDING,
    registeredBy: userId,
    status: REGISTRATION_STATUS.PENDING,
    teamName: effectiveTeamName,
    clubName: effectiveClubName,
    utr: regBody.utr.trim(),
    paymentScreenshotUrl: uploadResult.secure_url,
    paymentScreenshotPublicId: uploadResult.public_id,
    paymentAmount: feeInRupees,
  };

  if (participationMode === REGISTRATION_TYPE.TEAM) {
    if (!effectiveTeamName) throw new AppError("Missing team name", 400);

    regData.team = {
      teamName: effectiveTeamName,
      joinCode: generateJoinCode(),
      leaderId: userId,
      members: [],
    };
  }

  const registration = await regRepo.createRegistration(regData);

  await paymentRepo.createPayment({
    userId,
    eventId,
    registrationId: registration._id,
    purpose: "event",
    amount: feeInPaise,
    currency: "INR",
    gateway: "MANUAL",
    gatewayOrderId: `manual_order_event_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    status: "PENDING",
    utr: regBody.utr.trim(),
    paymentScreenshotPublicId: uploadResult.public_id,
    paymentScreenshotUrl: uploadResult.secure_url,
  });

  await clearAdminCache("admin:payments:*");
  await clearAdminCache("admin:event-registrations:*");

  return registration;
};

export const deleteUserRegistration = async (userId, eventId) => {
  const event = await eventRepo.findEventById(eventId);
  if (!event) throw new AppError("Event not found", 404);

  if (event.registrationDeadline && new Date() > event.registrationDeadline)
    throw new AppError(
      "Modifications are not allowed after the registration deadline",
      400,
    );

  const registration = await regRepo.findRegistrationByUserAndEventId(
    userId,
    eventId,
  );
  if (!registration) throw new AppError("Registration not found", 404);

  const isConfirmed =
    registration.paymentStatus?.toLowerCase() === PAYMENT_STATUS.SUCCESS ||
    registration.status?.toLowerCase() === REGISTRATION_STATUS.CONFIRMED;

  if (isConfirmed) {
    throw new AppError(
      "Withdrawal is not allowed once payment is confirmed by admins",
      400,
    );
  }

  const { participationMode } = event;

  if (participationMode === REGISTRATION_TYPE.SOLO) {
    await regRepo.deleteRegistration(eventId, registration._id);
  } else {
    const { team } = registration;

    const isLeader = team.leaderId.toString() === userId.toString();

    if (!isLeader)
      throw new AppError(
        "Team members must leave the team instead of deleting the registration",
        400,
      );

    if (team.members.length > 0)
      throw new AppError(
        "Leader cannot delete the registration while team members exist",
        400,
      );

    await regRepo.deleteRegistration(eventId, registration._id);
  }

  await paymentRepo.deletePaymentByRegistrationId(registration._id);
  await clearAdminCache("admin:payments:*");
  await clearAdminCache("admin:event-registrations:*");

  if (registration.paymentScreenshotPublicId) {
    deleteFile(registration.paymentScreenshotPublicId).catch(() => null);
  }
};

export const getRegistrationByEventId = async (
  eventId,
  pageSize,
  pageNumber,
) => {
  const event = await eventRepo.findEventById(eventId);
  if (!event) throw new AppError("Event not found", 404);

  return await regRepo.findRegistrationByEventId(eventId, pageSize, pageNumber);
};

export const getAllMyRegistrations = async (userId) => {
  const user = await userRepo.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  return await regRepo.getAllMyRegistrations(userId);
};

export const getMyRegistration = async (userId, eventId) => {
  const event = await eventRepo.findEventById(eventId);
  if (!event) throw new AppError("Event not found", 404);

  const registration = await regRepo.findRegistrationByUserAndEventId(
    userId,
    eventId,
  );
  if (!registration) throw new AppError("Registration not found", 404);

  if (!registration.receiptUrl) {
    const payment = await Payment.findOne({
      registrationId: registration._id,
      status: "SUCCESS",
    }).select("receiptUrl");
    if (payment?.receiptUrl) {
      registration.receiptUrl = payment.receiptUrl;
      await EventRegistration.findByIdAndUpdate(registration._id, {
        receiptUrl: payment.receiptUrl,
      });
    }
  }

  const backendUrl =
    process.env.BACKEND_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://en-passant-backend.onrender.com"
      : `http://localhost:${process.env.PORT || 8080}`);
  const cleanBackendUrl = backendUrl.replace(/\/$/, "").replace(/\/api$/, "");

  if (
    registration.receiptUrl &&
    registration.receiptUrl.includes("/api/payments/")
  ) {
    const pathPart = registration.receiptUrl.substring(
      registration.receiptUrl.indexOf("/api/payments/"),
    );
    registration.receiptUrl = `${cleanBackendUrl}${pathPart}`;
  }

  return registration;
};

export const pushTeamMember = async (memId, eventId, joinCode) => {
  const event = await eventRepo.findEventById(eventId);
  if (!event) throw new AppError("Event not found", 404);

  if (event.registrationDeadline && new Date() > event.registrationDeadline)
    throw new AppError("Registration deadline passed", 400);

  const { participationMode } = event;

  if (participationMode !== REGISTRATION_TYPE.TEAM)
    throw new AppError(
      "Only team participation is allowed for this event",
      400,
    );

  const registration = await regRepo.findRegistrationByJoinCode(
    eventId,
    joinCode,
  );
  if (!registration) throw new AppError("Registration not found", 404);

  const teamMember = await userRepo.findById(memId);
  if (!teamMember) throw new AppError("member not found", 404);

  const existing = await regRepo.findRegistrationByUserAndEventId(
    memId,
    event._id,
  );
  if (existing) throw new AppError("Team member already present", 409);

  const currentTeamSize = registration.team.members.length + 1;
  if (currentTeamSize >= event.teamConfig.maxSize)
    throw new AppError("Team is already full", 409);

  return await regRepo.pushTeamMember(registration._id, { userId: memId });
};

export const removeTeamMember = async (memId, eventId, joinCode) => {
  const event = await eventRepo.findEventById(eventId);
  if (!event) throw new AppError("Event not found", 404);

  if (event.registrationDeadline && new Date() > event.registrationDeadline)
    throw new AppError(
      "Modifications are not allowed after the registration deadline",
      400,
    );

  const { participationMode } = event;

  if (participationMode !== REGISTRATION_TYPE.TEAM)
    throw new AppError("Only team participation is allowed", 400);

  const registration = await regRepo.findRegistrationByJoinCode(
    eventId,
    joinCode,
  );
  if (!registration) throw new AppError("Registration not found", 404);

  const member = await userRepo.findById(memId);
  if (!member) throw new AppError("Member not found");

  const isLeader = registration.team.leaderId.toString() === memId.toString();
  if (isLeader) throw new AppError("Leader cannot leave the team", 400);

  const isMember = registration.team.members.some(
    (m) => m.userId.toString() === memId.toString(),
  );
  if (!isMember) throw new AppError("You are not a member of this team", 400);

  return await regRepo.removeTeamMember(registration._id, { userId: memId });
};

export const transferLeadership = async (leaderId, eventId, newLeaderId) => {
  const event = await eventRepo.findEventById(eventId);
  if (!event) throw new AppError("Event not found", 404);

  if (event.registrationDeadline && new Date() > event.registrationDeadline)
    throw new AppError(
      "Modifications are not allowed after the registration deadline",
      400,
    );

  const registration = await regRepo.findRegistrationByUserAndEventId(
    leaderId,
    eventId,
  );
  if (!registration) throw new AppError("Registration not found", 404);

  if (registration.team.leaderId.toString() !== leaderId.toString()) {
    throw new AppError("Only the team leader can transfer leadership", 403);
  }

  const isNewLeaderInTeam = registration.team.members.some(
    (m) => m.userId.toString() === newLeaderId.toString(),
  );
  if (!isNewLeaderInTeam)
    throw new AppError("The new leader must be an existing team member", 400);

  return await regRepo.transferLeadership(
    registration._id,
    leaderId,
    newLeaderId,
  );
};

export const leaveTeamAsLeader = async (leaderId, eventId, newLeaderId) => {
  const event = await eventRepo.findEventById(eventId);
  if (!event) throw new AppError("Event not found", 404);

  if (event.registrationDeadline && new Date() > event.registrationDeadline)
    throw new AppError(
      "Modifications are not allowed after the registration deadline",
      400,
    );

  const registration = await regRepo.findRegistrationByUserAndEventId(
    leaderId,
    eventId,
  );
  if (!registration) throw new AppError("Registration not found", 404);

  if (registration.team.leaderId.toString() !== leaderId.toString()) {
    throw new AppError("Only the team leader can use this function", 403);
  }

  if (registration.team.members.length === 0)
    throw new AppError(
      "You are the only member. Please delete the registration instead.",
      400,
    );

  const isNewLeaderInTeam = registration.team.members.some(
    (m) => m.userId.toString() === newLeaderId.toString(),
  );
  if (!isNewLeaderInTeam)
    throw new AppError("The new leader must be an existing team member", 400);

  return await regRepo.deleteLeader(registration._id, newLeaderId);
};

export const getBracketPreview = async (
  userId,
  eventId,
  sectionName = "open",
) => {
  let event = null;
  if (/^[0-9a-fA-F]{24}$/.test(eventId)) {
    event = await eventRepo.findEventById(eventId);
  }
  if (!event) {
    const all = await eventRepo.findAllEvents();
    event =
      all.find(
        (e) =>
          e._id.toString() === eventId ||
          e.title?.toLowerCase() === eventId.toLowerCase(),
      ) || all[0];
  }
  if (!event) throw new AppError("Event not found", 404);

  const user = await userRepo.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  const chessAccount = user.chessAccounts?.chessCom;
  if (!chessAccount?.username) {
    return {
      success: true,
      bracket: null,
      message: "No Chess.com account linked",
    };
  }

  let verification = null;
  if (chessAccount.verified) {
    try {
      verification = await fetchChessComRapidVerification(
        chessAccount.username,
      );
    } catch {}
  }

  const peakRating =
    verification?.peakRapidRating ??
    chessAccount.ratings?.rapid ??
    chessAccount.ratings?.bullet ??
    0;
  const gamesCount = verification?.rapidGamesCount ?? 0;

  const secLower = (sectionName || "open").toLowerCase().trim();
  const targetSection =
    event.sections?.find((s) => s.name?.toLowerCase() === secLower) ||
    event.sections?.[0];

  let matchedBracket = null;
  if (targetSection?.brackets && targetSection.brackets.length > 0) {
    if (targetSection.brackets.length === 1) {
      matchedBracket = targetSection.brackets[0];
    } else {
      matchedBracket = targetSection.brackets.find(
        (b) =>
          (b.minRating == null || peakRating >= b.minRating) &&
          (b.maxRating == null || peakRating <= b.maxRating),
      );
      if (!matchedBracket) {
        const sortedBrackets = [...targetSection.brackets].sort(
          (a, b) => (b.maxRating || 3000) - (a.maxRating || 3000),
        );
        if (peakRating > (sortedBrackets[0].maxRating || 0)) {
          matchedBracket = sortedBrackets[0];
        } else {
          matchedBracket = targetSection.brackets[0];
        }
      }
    }
  }

  return {
    success: true,
    bracket: matchedBracket,
    peakRating,
    gamesCount,
    hasMinimumGames: gamesCount >= 5,
  };
};
