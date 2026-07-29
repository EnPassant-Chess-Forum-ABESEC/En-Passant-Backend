import * as eventRepo from "./event.repository.js";

export const createEvent = async (userId, eventData) => {
  try {
    return await eventRepo.createEvent({
      ...eventData,
      createdBy: userId,
    });
  } catch (error) {
    throw new Error(`createEvent failed: ${error.message}`);
  }
};

export const getAllEvents = async () => {
  try {
    const [events, total] = await Promise.all([
      eventRepo.findAllEvents(),
      eventRepo.countEvents(),
    ]);

    return { events, total };
  } catch (error) {
    throw new Error(`getAllEvents failed: ${error.message}`);
  }
};

export const getEventById = async (eventId) => {
  try {
    const event = await eventRepo.findEventById(eventId);

    if (!event) throw new Error("Event not found");

    return event;
  } catch (error) {
    throw new Error(`getEventById failed: ${error.message}`);
  }
};

export const updateEvent = async (eventId, updateData) => {
  try {
    const existing = await eventRepo.findEventById(eventId);

    if (!existing) throw new Error("Event not found");

    return await eventRepo.updateEvent(eventId, updateData);
  } catch (error) {
    throw new Error(`updateEvent failed: ${error.message}`);
  }
};

export const deleteEvent = async (eventId) => {
  try {
    const existing = await eventRepo.findEventById(eventId);

    if (!existing) throw new Error("Event not found");

    return await eventRepo.deleteEvent(eventId);
  } catch (error) {
    throw new Error(`deleteEvent failed: ${error.message}`);
  }
};
