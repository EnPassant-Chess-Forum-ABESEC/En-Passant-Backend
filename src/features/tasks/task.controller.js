import * as taskRepo from "./task.repository.js";

export const getAllTasksByDepartment = async (req, res, next) => {
  const { departmentId, year } = req.query;
  try {
    if (!departmentId) {
      throw new Error("departmentId is required");
    }
    if (!year) {
      throw new Error("year is required");
    }

    const tasks = await taskRepo.findByDepartmentAndYear(
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

    const tasks = await taskRepo.findAllByYear(Number(year));
    return res.status(200).json({ tasks });
  } catch (error) {
    next(error);
  }
};
