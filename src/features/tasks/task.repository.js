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

export const findDepartmentByCode = async (code) => {
  return Department.findOne({ code });
};

export const findDepartmentById = async (departmentId) => {
  return Department.findById(departmentId);
};

export const createDepartment = async (departmentData) => {
  return Department.create(departmentData);
};

export const createTask = async (taskData) => {
  return Task.create(taskData);
};

export const updateDepartment = async (departmentId, departmentData) => {
  return Department.findByIdAndUpdate(departmentId, departmentData, {
    returnDocument: "after",
  });
};

export const deleteDepartment = async (departmentId) => {
  return Department.findByIdAndDelete(departmentId);
};

export const updateTask = async (taskId, taskData) => {
  return Task.findByIdAndUpdate(taskId, taskData, { returnDocument: "after" });
};

export const deleteTask = async (taskId) => {
  return Task.findByIdAndDelete(taskId);
};
