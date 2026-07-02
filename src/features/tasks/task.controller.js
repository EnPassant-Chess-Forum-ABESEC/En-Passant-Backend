import * as taskService from "./task.service.js";

export const getAllTasksByDepartment = async (req, res, next) => {
  const { departmentId, year } = req.query;
  try {
    if (!departmentId) {
      throw new Error("departmentId is required");
    }
    if (!year) {
      throw new Error("year is required");
    }

    const tasks = await taskService.getAllTasksByDepartment(
      departmentId,
      Number(year),
    );

    return res.status(200).json({ tasks });
  } catch (error) {
    next(error);
  }
};

export const getAllTasksForYear = async (req, res, next) => {
  const { year } = req.query;
  try {
    if (!year) {
      throw new Error("year is required");
    }

    const tasks = await taskService.getAllTasksForYear(Number(year));
    return res.status(200).json({ tasks });
  } catch (error) {
    next(error);
  }
};
