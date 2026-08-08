import Settings from "./settings.model.js";

const getSettingsDoc = async () => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({
      applicationStartDate: new Date(),
      applicationEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      taskRevealDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      submissionEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    });
  }
  return settings;
};

export const getRecruitmentPhases = async (req, res, next) => {
  try {
    const settings = await getSettingsDoc();
    res.status(200).json({
      success: true,
      data: {
        applicationStartDate: settings.applicationStartDate,
        applicationEndDate: settings.applicationEndDate,
        taskRevealDate: settings.taskRevealDate,
        submissionEndDate: settings.submissionEndDate,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateRecruitmentPhases = async (req, res, next) => {
  try {
    const {
      applicationStartDate,
      applicationEndDate,
      taskRevealDate,
      submissionEndDate,
    } = req.body;

    let settings = await getSettingsDoc();

    settings.applicationStartDate =
      applicationStartDate || settings.applicationStartDate;
    settings.applicationEndDate =
      applicationEndDate || settings.applicationEndDate;
    settings.taskRevealDate = taskRevealDate || settings.taskRevealDate;
    settings.submissionEndDate =
      submissionEndDate || settings.submissionEndDate;

    await settings.save();

    res.status(200).json({
      success: true,
      message: "Recruitment phases updated successfully",
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};
