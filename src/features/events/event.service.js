import { AppError } from "../../utils/AppError.js";
import * as eventRepo from "./event.repository.js";

export const createEvent = async (userId, eventData) => {
  try {
    return await eventRepo.createEvent({
      ...eventData,
      createdBy: userId,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(`createEvent failed: ${error.message}`, 500);
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
    if (error instanceof AppError) throw error;
    throw new AppError(`getAllEvents failed: ${error.message}`, 500);
  }
};

export const getEventById = async (eventId) => {
  try {
    const event = await eventRepo.findEventById(eventId);

    if (!event) throw new AppError("Event not found", 404);

    return event;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(`getEventById failed: ${error.message}`, 500);
  }
};

export const updateEvent = async (eventId, updateData) => {
  try {
    const existing = await eventRepo.findEventById(eventId);

    if (!existing) throw new AppError("Event not found", 404);

    return await eventRepo.updateEvent(eventId, updateData);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(`updateEvent failed: ${error.message}`, 500);
  }
};

export const deleteEvent = async (eventId) => {
  try {
    const existing = await eventRepo.findEventById(eventId);

    if (!existing) throw new AppError("Event not found", 404);

    return await eventRepo.deleteEvent(eventId);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(`deleteEvent failed: ${error.message}`, 500);
  }
};
