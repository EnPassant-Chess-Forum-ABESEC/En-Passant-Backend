import * as adminService from "./admin.service.js";

export const getAllApplications = async (req, res, next) => {
  const { status, departmentId, year } = req.query;
  try {
    const applications = await adminService.getAllApplications({
      status,
      departmentId,
      year: Number(year),
    });

    return res.status(200).json({
      success: true,
      message: "Applications fetched successfully",
      applications,
    });
  } catch (error) {
    next(error);
  }
};

export const getApplicationById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const { application, submission } =
      await adminService.getApplicationById(id);

    return res.status(200).json({
      success: true,
      message: "Application fetched successfully",
      application,
      submission,
    });
  } catch (error) {
    next(error);
  }
};

export const updateApplicationStatus = async (req, res, next) => {
  const { id } = req.params;

  const { status } = req.body;

  try {
    const updatedApplication = await adminService.updateApplicationStatus(
      id,
      status,
    );
    return res.status(200).json({
      success: true,
      message: "Application status updated successfully",
      updatedApplication,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllDepartments = async (req, res, next) => {
  try {
    const departments = await adminService.getAllDepartments();

    return res.status(200).json({
      success: true,
      message: "Departments fetched successfully",
      departments,
    });
  } catch (error) {
    next(error);
  }
};

export const createDepartment = async (req, res, next) => {
  try {
    const department = await adminService.createDepartment(req.body);

    return res.status(201).json({
      success: true,
      message: "Department created successfully",
      department,
    });
  } catch (error) {
    if (error.message.includes("already exists")) {
      return res.status(409).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const createTask = async (req, res, next) => {
  try {
    const task = await adminService.createTask(req.body);

    return res.status(201).json({
      success: true,
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    next(error);
  }
};
