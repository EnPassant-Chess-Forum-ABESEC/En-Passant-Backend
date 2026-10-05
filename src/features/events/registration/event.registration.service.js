import { AppError } from "../../../utils/AppError.js";
import * as regRepo from "./event.registration.repository.js";
import * as eventRepo from "../event.repository.js";
import * as userRepo from "../../users/user.repository.js";
import {
  PAYMENT_STATUS,
  REGISTRATION_STATUS,
  REGISTRATION_TYPE,
  generateJoinCode,
} from "../event.constants.js";

export const createRegistration = async (userId, eventId, regBody) => {
  const event = await eventRepo.findEventById(eventId);
  if (!event) throw new AppError("Event not found", 404);

  if (event.registrationDeadline && new Date() > event.registrationDeadline)
    throw new AppError("Registration deadline has passed for the event", 400);

  const existing = await regRepo.findRegistrationByUserAndEventId(
    userId,
    eventId,
  );

  if (existing) throw new AppError("Duplicate registration", 409);

  const { participationMode } = event;

  const regData = {
    eventId,
    registrationType: participationMode,
    paymentStatus: PAYMENT_STATUS.PENDING,
    registeredBy: userId,
    status: REGISTRATION_STATUS.PENDING,
  };

  if (participationMode === REGISTRATION_TYPE.TEAM) {
    if (!regBody.teamName) throw new AppError("Missing team name", 400);

    regData.team = {
      teamName: regBody.teamName,
      joinCode: generateJoinCode(),
      leaderId: userId,
      members: [],
    };
  }

  return await regRepo.createRegistration(regData);
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
