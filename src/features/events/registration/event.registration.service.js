import { AppError } from "../../../utils/AppError.js";
import * as regRepo from "./event.registration.repository.js";
import * as eventRepo from "../event.repository.js";
import * as userRepo from "../../users/user.repository.js";
import { deleteFile } from "../../storage/storage.service.js";
import { fetchChessComRapidVerification } from "../../sync/adapters/chesscom.adapter.js";
import {
  PAYMENT_STATUS,
  REGISTRATION_STATUS,
  REGISTRATION_TYPE,
  generateJoinCode,
} from "../event.constants.js";
import { clearAdminCache } from "../../../redis/redis.client.js";

export const getSectionFee = (_sectionName) => 0;

export const createRegistration = async (
  userId,
  eventId,
  regBody,
  _file,
  userObj,
) => {
  const event = await eventRepo.findEventById(eventId);
  if (!event) throw new AppError("Event not found", 404);

  if (event.registrationDeadline && new Date() > event.registrationDeadline)
    throw new AppError("Registration deadline has passed for the event", 400);

  const gender = (regBody.gender || "").toLowerCase().trim();
  if (gender !== "male" && gender !== "female") {
    throw new AppError("Please select your gender (Male or Female)", 400);
  }

  const sectionName = (regBody.section || "open").toLowerCase().trim();
  const isInterclub =
    sectionName === "interclub" ||
    sectionName === "inter-club" ||
    sectionName === "inter club";
  const isWomens = sectionName === "womens" || sectionName === "women";
  const isOpen = sectionName === "open";

  if (gender === "male" && isWomens) {
    throw new AppError(
      "Male participants cannot register for the Women's division",
      400,
    );
  }

  const existingRegs = await regRepo.findAllRegistrationsByUserAndEventId(
    userId,
    eventId,
  );

  const hasInterclub = existingRegs.some(
    (r) =>
      r.section === "interclub" ||
      r.section === "inter-club" ||
      r.section === "inter club",
  );
  const hasOpen = existingRegs.some((r) => r.section === "open");
  const hasWomens = existingRegs.some(
    (r) => r.section === "womens" || r.section === "women",
  );

  if (isInterclub) {
    if (hasInterclub) {
      throw new AppError(
        "You are already registered for the Inter-Club division",
        409,
      );
    }
    if (hasOpen || hasWomens) {
      throw new AppError(
        "Participants registered in Open or Women's division cannot register for Inter-Club",
        400,
      );
    }
  } else {
    if (hasInterclub) {
      throw new AppError(
        "Participants registered in the Inter-Club division cannot register for Open or Women's divisions",
        400,
      );
    }
    if (isOpen && hasOpen) {
      throw new AppError("You are already registered for the Open division", 409);
    }
    if (isWomens && hasWomens) {
      throw new AppError(
        "You are already registered for the Women's division",
        409,
      );
    }
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
    gender,
    isHosteler,
    residentType,
    peakRapidRating: peakRating,
    rapidGamesCount: verification.rapidGamesCount,
    chessUsername: chessAccount.username,
    paymentStatus: PAYMENT_STATUS.SUCCESS,
    registeredBy: userId,
    status: REGISTRATION_STATUS.CONFIRMED,
    teamName: effectiveTeamName,
    clubName: effectiveClubName,
    utr: null,
    paymentScreenshotUrl: null,
    paymentScreenshotPublicId: null,
    paymentAmount: 0,
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

  await clearAdminCache("admin:event-registrations:*");

  return registration;
};

export const deleteUserRegistration = async (
  userId,
  eventId,
  registrationId = null,
  section = null,
) => {
  const event = await eventRepo.findEventById(eventId);
  if (!event) throw new AppError("Event not found", 404);

  if (event.registrationDeadline && new Date() > event.registrationDeadline)
    throw new AppError(
      "Modifications are not allowed after the registration deadline",
      400,
    );

  let registration = null;
  if (registrationId) {
    registration = await regRepo.findRegistrationById(registrationId);
  } else if (section) {
    registration = await regRepo.findRegistrationByUserAndEventId(
      userId,
      eventId,
      section,
    );
  } else {
    registration = await regRepo.findRegistrationByUserAndEventId(
      userId,
      eventId,
    );
  }
  if (!registration) throw new AppError("Registration not found", 404);

  if (event.registrationDeadline && new Date() > event.registrationDeadline) {
    throw new AppError(
      "Withdrawal is not allowed after the registration deadline has passed",
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

export const getMyRegistration = async (userId, eventId, section = null) => {
  const event = await eventRepo.findEventById(eventId);
  if (!event) throw new AppError("Event not found", 404);

  const allRegistrations = await regRepo.findAllRegistrationsByUserAndEventId(
    userId,
    eventId,
  );
  if (!allRegistrations || allRegistrations.length === 0) {
    throw new AppError("Registration not found", 404);
  }

  let registration = null;
  if (section) {
    registration = allRegistrations.find(
      (r) => r.section?.toLowerCase().trim() === section.toLowerCase().trim(),
    );
  }
  if (!registration) {
    registration = allRegistrations[allRegistrations.length - 1];
  }

  return { registration, allRegistrations };
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

  const existingRegs = await regRepo.findAllRegistrationsByUserAndEventId(
    memId,
    event._id,
  );
  const hasInterclub = existingRegs.some(
    (r) =>
      r.section === "interclub" ||
      r.section === "inter-club" ||
      r.section === "inter club",
  );
  const hasOpenOrWomens = existingRegs.some(
    (r) => r.section === "open" || r.section === "womens" || r.section === "women",
  );
  if (hasInterclub) {
    throw new AppError("Team member is already part of an Inter-Club team", 409);
  }
  if (hasOpenOrWomens) {
    throw new AppError(
      "Participants registered in Open or Women's division cannot join an Inter-Club team",
      400,
    );
  }

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
