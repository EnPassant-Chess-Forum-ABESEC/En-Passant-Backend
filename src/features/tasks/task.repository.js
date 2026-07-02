import { Task } from "./task.model.js";

export const findByDepartmentAndYear = async (departmentId, year) => {
  return Task.find({ departmentId, year }).sort({ order: 1 });
};

export const findById = async (taskId) => {
  return Task.findOne({ _id: taskId }).populate("departmentId");
};

export const findAllByYear = async (year) => {
  return Task.find({ year }).populate("departmentId");
};
