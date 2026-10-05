import { EventRegistration } from "./event.registration.model.js";

export const createRegistration = async (regData) => {
  return EventRegistration.create(regData);
};

export const findRegistrationById = async (regId) => {
  return EventRegistration.findById(regId);
};

export const deleteRegistration = async (eventId, regId) => {
  return await EventRegistration.deleteOne({
    _id: regId,
    eventId: eventId,
  });
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

export const getAllMyRegistrations = async (userId) => {
  return await EventRegistration.find({
    $or: [
      { registeredBy: userId },
      { "team.leaderId": userId },
      { "team.members.userId": userId },
    ],
  }).populate("eventId");
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

export const findRegistrationByJoinCode = async (eventId, joinCode) => {
  return await EventRegistration.findOne({
    eventId,
    "team.joinCode": joinCode,
  });
};

export const pushTeamMember = async (regId, member) => {
  return await EventRegistration.findByIdAndUpdate(
    regId,
    { $push: { "team.members": member } },
    { returnDocument: "after" },
  );
};

export const removeTeamMember = async (regId, member) => {
  return await EventRegistration.updateOne(
    {
      _id: regId,
    },
    {
      $pull: { "team.members": member },
    },
  );
};

export const transferLeadership = async (regId, oldLeaderId, newLeaderId) => {
  await EventRegistration.updateOne(
    { _id: regId },
    {
      $set: { "team.leaderId": newLeaderId },
      $pull: { "team.members": { userId: newLeaderId } },
    },
  );

  return await EventRegistration.findByIdAndUpdate(
    regId,
    {
      $push: { "team.members": { userId: oldLeaderId } },
    },
    { returnDocument: "after" },
  );
};

export const deleteLeader = async (regId, newLeaderId) => {
  return await EventRegistration.findByIdAndUpdate(
    regId,
    {
      $set: { "team.leaderId": newLeaderId },
      $pull: { "team.members": { userId: newLeaderId } },
    },
    { returnDocument: "after" },
  );
};
