import { EventRegistration } from "./event.registration.model.js";
import "../../users/user.model.js";

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

export const deleteRegistrationById = async (regId) => {
  return await EventRegistration.findByIdAndDelete(regId);
};

export const findRegistrationByEventId = async (
  eventId,
  pageSize = 10,
  pageNumber = 1,
) => {
  return await EventRegistration.find({ eventId })
    .populate("registeredBy", "userName email phoneNumber")
    .populate("team.leaderId", "userName email phoneNumber")
    .populate("team.members.userId", "userName email phoneNumber")
    .sort({ createdAt: -1 })
    .limit(Number(pageSize))
    .skip((Number(pageNumber) - 1) * Number(pageSize));
};

export const findAllRegistrationsByEventId = async (eventId, filter = {}) => {
  return await EventRegistration.find({ eventId, ...filter })
    .populate("registeredBy", "userName email phoneNumber collegeEmail chessAccounts")
    .populate("team.leaderId", "userName email phoneNumber collegeEmail chessAccounts")
    .populate("team.members.userId", "userName email phoneNumber collegeEmail chessAccounts")
    .sort({ createdAt: 1 });
};

export const getAllRegistrationsForExport = async (filter = {}) => {
  return await EventRegistration.find(filter)
    .populate("eventId", "title")
    .populate(
      "registeredBy",
      "userName email phoneNumber collegeEmail chessAccounts branch year",
    )
    .populate(
      "team.leaderId",
      "userName email phoneNumber collegeEmail chessAccounts branch year",
    )
    .populate(
      "team.members.userId",
      "userName email phoneNumber collegeEmail chessAccounts branch year",
    )
    .sort({ createdAt: -1 });
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

export const findAllRegistrationsByUserAndEventId = async (userId, eventId) => {
  return await EventRegistration.find({
    eventId,
    $or: [
      { registeredBy: userId },
      { "team.leaderId": userId },
      { "team.members.userId": userId },
    ],
  });
};

export const findRegistrationByUserAndEventId = async (
  userId,
  eventId,
  section = null,
) => {
  const query = {
    eventId,
    $or: [
      { registeredBy: userId },
      { "team.leaderId": userId },
      { "team.members.userId": userId },
    ],
  };
  if (section) {
    query.section = section.toLowerCase().trim();
  }
  return EventRegistration.findOne(query);
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

export const updateRegistrationStatus = async (regId, status, paymentStatus) => {
  const update = {};
  if (status) update.status = status;
  if (paymentStatus) update.paymentStatus = paymentStatus;
  return await EventRegistration.findByIdAndUpdate(
    regId,
    { $set: update },
    { returnDocument: "after" },
  );
};
