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

export const getMyRegistration = async (userId, eventId) => {
  const event = await eventRepo.findEventById(eventId);
  if (!event) throw new AppError("Event not found", 404);

  const registration = await regRepo.findRegistrationByUserAndEventId(userId, eventId);
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
  if (currentTeamSize < event.teamConfig.maxSize)
    throw new AppError("Team is already full", 409);

  return await regRepo.pushTeamMember(registration._id, { userId: memId });
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

export const removeTeamMember = async (memId, eventId, joinCode) => {
  const event = await eventRepo.findEventById(eventId);
  if (!event) throw new AppError("Event not found", 404);

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

  const currentTeamSize = registration.team.members.length;

  if (currentTeamSize === 0)
    throw new AppError("Team size is zero, can not remove", 400);

  return await regRepo.removeTeamMember(registration._id, { userId: memId });
};
