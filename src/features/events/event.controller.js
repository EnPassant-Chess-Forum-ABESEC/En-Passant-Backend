import * as eventService from "./event.service.js";


export const createEvent = async (req, res, next) => {
  try {
    const event = await eventService.createEvent(req.user._id, req.body);

    return res.status(201).json({
      success: true,
      message: "Event created successfully",
      event,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllEvents = async (req, res, next) => {
  try {

    const { events, total } = await eventService.getAllEvents();

    return res.status(200).json({
      success: true,
      events,
      total,
    });
  } catch (error) {
    next(error);
  }
};

export const getEventById = async (req, res, next) => {
  try {
    const event = await eventService.getEventById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    return res.status(200).json({
      success: true,
      event,
    });
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }
    next(error);
  }
};

export const updateEvent = async (req, res, next) => {
  try {
    const updatedEvent = await eventService.updateEvent(req.params.id, req.body);

    return res.status(200).json({
      success: true,
      message: "Event updated successfully",
      updatedEvent,
    });
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }
    next(error);
  }
};

export const deleteEvent = async (req, res, next) => {
  try {
    const deleteEvent = await eventService.deleteEvent(req.params.id);

    if (!deleteEvent) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }
    next(error);
  }
};
