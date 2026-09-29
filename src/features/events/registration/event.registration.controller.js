import * as regService from "./event.registration.service.js";

export const registerForEvent = async (req, res, next) => {
  try {
    const registration = await regService.createRegistration(
      req.user._id,
      req.params.id,
      req.body.participation,
    );

    return res.status(200).json({
      success: true,
      message: "Registration created successfully",
      registration,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllRegistrationForEvent = async (req, res, next) => {
  try {
    const pageSize = Number(req.query.pageSize) || 10;
    const pageNumber = Number(req.query.pageNumber) || 1;
    const registrations = await regService.getRegistrationByEventId(
      req.params.id,
      pageSize,
      pageNumber,
    );

    return res.status(200).json({
      success: true,
      registrations,
    });
  } catch (error) {
    next(error);
  }
};

export const joinTeam = async (req, res, next) => {
  try {
    const newTeam = await regService.pushTeamMember(
      req.user._id,
      req.params.id,
      req.body.joinCode,
    );
    return res.status(200).json({
      success: true,
      message: "team member added successfully",
      newTeam,
    });
  } catch (error) {
    next(error);
  }
};
