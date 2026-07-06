import * as recruitmentService from "./recruitment.service.js";

export const createApplication = async (req, res, next) => {
  const userId = req.user._id;

  try {
    const newApplication = await recruitmentService.createApplication(
      userId,
      req.body,
    );

    return res.status(201).json({
      success: true,
      message: "Application created successfully",
      newApplication,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyApplication = async (req, res, next) => {
  const userId = req.user._id;

  const currentYear = new Date().getFullYear();
  try {
    const myApplication = await recruitmentService.getMyApplication(
      userId,
      currentYear,
    );

    return res.status(200).json({
      success: true,
      myApplication,
    });
  } catch (error) {
    next(error);
  }
};

