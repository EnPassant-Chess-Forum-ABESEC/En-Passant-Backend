import * as recruitmentService from "./recruitment.service.js";
import Settings from "../settings/settings.model.js";

export const createApplication = async (req, res, next) => {
  const userId = req.user._id;

  const { name, collegeEmail, phone } = req.body;
  if (
    (req.user.userName && name && req.user.userName !== name) ||
    (req.user.collegeEmail && collegeEmail && req.user.collegeEmail !== collegeEmail) ||
    (req.user.phoneNumber && phone && req.user.phoneNumber !== phone)
  ) {
    return res.status(400).json({ success: false, message: "Mismatch data: Your details do not match your profile. Please use the correct details." });
  }

  try {
    const settings = await Settings.findOne();
    if (settings) {
      const now = new Date();
      if (now < settings.applicationStartDate) {
        return res.status(403).json({ success: false, message: "Applications have not opened yet" });
      }
      if (now > settings.applicationEndDate) {
        return res.status(403).json({ success: false, message: "Applications have closed" });
      }
    }

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
    if (error.message === "Application not found") {
      return res.status(200).json({
        success: true,
        myApplication: null,
      });
    }
    next(error);
  }
};
