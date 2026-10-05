import * as regService from "./event.registration.service.js";

export const registerForEvent = async (req, res, next) => {
  try {
    const registration = await regService.createRegistration(
      req.user._id,
      req.params.id,
      req.body,
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

export const deleteRegistration = async (req, res, next) => {
  try {
    await regService.deleteUserRegistration(req.user._id, req.params.id);
    return res.status(200).json({
      success: true,
      message: "Registration deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};



export const getAllMyRegistrations = async (req, res, next) => {
  try {
    const registrations = await regService.getAllMyRegistrations(req.user._id);
    return res.status(200).json({
      success: true,
      registrations,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyRegistration = async (req, res, next) => {
  try {
    const registration = await regService.getMyRegistration(
      req.user._id,
      req.params.id,
    );

    return res.status(200).json({
      success: true,
      registration,
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
      message: "Team member added successfully",
      newTeam,
    });
  } catch (error) {
    next(error);
  }
};

export const leaveTeam = async (req, res, next) => {
  try {
    await regService.removeTeamMember(
      req.user._id,
      req.params.id,
      req.body.joinCode,
    );
    return res
      .status(200)
      .json({ success: true, message: "Member deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export const transferLeadership = async (req, res, next) => {
  try {
    await regService.transferLeadership(
      req.user._id,
      req.params.id,
      req.body.newLeaderId,
    );
    return res.status(200).json({
      success: true,
      message: "Leadership transferred successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const leaveTeamAsLeader = async (req, res, next) => {
  try {
    await regService.leaveTeamAsLeader(
      req.user._id,
      req.params.id,
      req.body.newLeaderId,
    );
    return res.status(200).json({
      success: true,
      message: "Leadership transferred and left team successfully",
    });
  } catch (error) {
    next(error);
  }
};
