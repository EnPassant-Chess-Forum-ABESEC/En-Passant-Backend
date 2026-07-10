import { Department, Task } from "./task.model.js";

export const findByDepartmentAndYear = async (departmentId, year) => {
  return Task.find({ departmentId, year }).sort({ order: 1 });
};

export const findById = async (taskId) => {
  return Task.findOne({ _id: taskId }).populate("departmentId");
};

export const findAllByYear = async (year) => {
  return Task.find({ year }).populate("departmentId");
};

export const findAllDepartments = async () => {
  return Department.find().sort({ name: 1 });
};

export const findByDepartmentByCode = async (code) => {
  return Department.findOne({ code });
};

export const createDepartment = async (departmentData) => {
  return Department.create(departmentData);
};

export const createTask = async (taskData) => {
  return Task.create(taskData);
};
