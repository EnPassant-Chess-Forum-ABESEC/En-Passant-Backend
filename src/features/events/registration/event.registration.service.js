import { AppError } from "../../../utils/AppError.js";
import * as regRepo from "./event.registration.repository.js";
import * as eventRepo from "../event.repository.js";
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

export const getRegistrationByEventId = async (eventId) => {
  const event = await eventRepo.findEventById(eventId);
  if (!event) throw new AppError("Event not found", 404);

  return await regRepo.findRegistrationByEventId(eventId, pageSize, pageNumber);
};
