import * as taskRepo from "./task.repository.js";

export const getAllTasksByDepartment = async (departmentId, year) => {
  return taskRepo.findByDepartmentAndYear(departmentId, year);
};

export const getAllTasksForYear = async (year) => {
  return taskRepo.findAllByYear(year);
};
