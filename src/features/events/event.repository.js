import Event from "./event.model.js";

export const createEvent = async (eventData) => {
  return Event.create(eventData);
};

export const findEventById = async (eventId) => {
  return Event.findById(eventId)
};

export const findAllEvents = async () => {
  return Event.find()
};

export const countEvents = async () => {
  return Event.countDocuments();
};

export const updateEvent = async (eventId, updateData) => {
  return Event.findByIdAndUpdate(eventId, updateData, {
    returnDocument: "after",
  });
};

export const deleteEvent = async (eventId) => {
  return Event.findByIdAndDelete(eventId);
};