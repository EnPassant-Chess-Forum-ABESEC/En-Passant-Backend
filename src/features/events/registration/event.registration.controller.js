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
