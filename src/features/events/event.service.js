import { AppError } from "../../utils/AppError.js";
import * as eventRepo from "./event.repository.js";

export const createEvent = async (userId, eventData) => {
  return eventRepo.createEvent({ ...eventData, createdBy: userId });
};

export const getAllEvents = async () => {
  return eventRepo.findAllEvents();
};

export const getEventById = async (eventId) => {
  const event = await eventRepo.findEventById(eventId);
  if (!event) throw new AppError("Event not found", 404);
  return event;
};

export const updateEvent = async (eventId, updateData) => {
  const event = await eventRepo.updateEvent(eventId, updateData);
  if (!event) throw new AppError("Event not found", 404);
  return event;
};

export const deleteEvent = async (eventId) => {
  const event = await eventRepo.deleteEvent(eventId);
  if (!event) throw new AppError("Event not found", 404);
  return event;
};