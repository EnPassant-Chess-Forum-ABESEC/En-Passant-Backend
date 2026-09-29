import { EventRegistration } from "./event.registration.model.js";

export const createRegistration = async (regData) => {
  return EventRegistration.create(regData);
};

export const findRegistrationById = async (regId) => {
  return EventRegistration.findById(regId);
};

export const findRegistrationByUserAndEventId = async (userId, eventId) => {
  return EventRegistration.findOne({
    eventId,
    $or: [
      { registeredBy: userId },
      { "team.leaderId": userId },
      { "team.members.userId": userId },
    ],
  });
};
