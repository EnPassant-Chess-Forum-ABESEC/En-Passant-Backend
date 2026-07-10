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

export const updateDepartment = async (req, res, next) => {
  try {
    const updatedDepartment = await adminService.updateDepartment(
      req.params.id,
      req.body,
    );

    return res.status(200).json({
      success: true,
      message: "Department updated successfully",
      updatedDepartment,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDepartment = async (req, res, next) => {
  try {
    await adminService.deleteDepartment(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Department deleted successfully",
    });
  } catch (error) {
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

export const updateTask = async (req, res, next) => {
  try {
    const updatedTask = await adminService.updateTask(req.params.id, req.body);

    return res.status(200).json({
      success: true,
      message: "Task updated successfully",
      updatedTask,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    await adminService.deleteTask(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const user = await adminService.getUserById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const pageSize = Number(req.query.pageSize) || 10;
    const pageNumber = Number(req.query.pageNumber) || 1;

    const users = await adminService.getAllUsers(pageSize, pageNumber);

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const updatedUser = await adminService.updateUserRole(
      req.params.id,
      req.body.role,
    );

    res.status(200).json({
      success: true,
      message: "User role updated successfully",
      updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllPayments = async (req, res, next) => {
  try {
    const pageSize = Number(req.query.pageSize) || 10;
    const pageNumber = Number(req.query.pageNumber) || 1;

    const payments = await adminService.getAllPayments(pageSize, pageNumber);

    res.status(200).json({
      success: true,
      payments,
      metadata: {
        pageNumber,
        pageSize,
        total: await paymentRepo.countPayments(),
      },
    });
  } catch (error) {
    next(error);
  }
};
