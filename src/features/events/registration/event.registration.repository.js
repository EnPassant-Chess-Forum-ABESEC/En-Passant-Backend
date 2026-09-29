import { EventRegistration } from "./event.registration.model.js";

export const createRegistration = async (regData) => {
  return EventRegistration.create(regData);
};

export const findRegistrationById = async (regId) => {
  return EventRegistration.findById(regId);
};

export const findRegistrationByEventId = async (
  eventId,
  pageSize = 10,
  pageNumber = 1,
) => {
  return await EventRegistration.find({ eventId })
    .sort({ createdAt: -1 })
    .limit(Number(pageSize))
    .skip((Number(pageNumber) - 1) * Number(pageSize));
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
