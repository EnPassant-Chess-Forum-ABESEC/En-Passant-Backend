import * as taskRepo from "./task.repository.js";
import Settings from "../settings/settings.model.js";

export const getAllTasksByDepartment = async (req, res, next) => {
  const { departmentId, year } = req.query;
  try {
    if (!departmentId) {
      throw new Error("departmentId is required");
    }
    if (!year) {
      throw new Error("year is required");
    }

    let tasks = await taskRepo.findByDepartmentAndYear(
      departmentId,
      Number(year),
    );

    const settings = await Settings.findOne();
    let isRevealed = true;
    let revealDate = null;

    if (settings) {
      revealDate = settings.taskRevealDate;
      if (new Date() < settings.taskRevealDate && req.user?.role !== "admin") {
        isRevealed = false;
        tasks = tasks.map((task) => {
          const t = task.toObject ? task.toObject() : { ...task };
          delete t.summary;
          delete t.instructions;
          delete t.submission;
          t.title = "Task Details Hidden";
          return t;
        });
      }
    }

    return res.status(200).json({ tasks, isRevealed, revealDate });
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

    let tasks = await taskRepo.findAllByYear(Number(year));

    const settings = await Settings.findOne();
    let isRevealed = true;
    let revealDate = null;

    if (settings) {
      revealDate = settings.taskRevealDate;
      if (new Date() < settings.taskRevealDate && req.user?.role !== "admin") {
        isRevealed = false;
        tasks = tasks.map((task) => {
          const t = task.toObject ? task.toObject() : { ...task };
          delete t.summary;
          delete t.instructions;
          delete t.submission;
          t.title = "Task Details Hidden";
          return t;
        });
      }
    }

    return res.status(200).json({ tasks, isRevealed, revealDate });
  } catch (error) {
    next(error);
  }
};

export const getAllDepartments = async (req, res, next) => {
  try {
    const departments = await taskRepo.findAllDepartments();
    return res.status(200).json({ success: true, departments });
  } catch (error) {
    next(error);
  }
};
