import * as adminService from "./admin.service.js";
import * as paymentRepo from "../payments/payment.repository.js";
import {
  handleSuccessfulPayment,
  handleFailedPayment,
} from "../recruitment/recruitment.service.js";
import mongoose from "mongoose";
import { redisConnection } from "../../redis/redis.client.js";
import { deleteAllCloudFiles } from "../storage/storage.service.js";
import Payment from "../payments/payment.model.js";
import { enqueueReceiptGeneration } from "../payments/receipt.queue.js";

const CACHE_TTL = 300;

const clearAdminCache = async (pattern) => {
  try {
    const keys = await redisConnection.keys(pattern);
    if (keys.length > 0) {
      await redisConnection.del(...keys);
    }
  } catch (err) {
    console.error("Redis cache clearing error:", err);
  }
};
export const getAllApplications = async (req, res, next) => {
  const { status, departmentId, year } = req.query;
  const cacheKey = `admin:applications:${status || 'ALL'}:${departmentId || 'ALL'}:${year || 'ALL'}`;
  
  try {
    const cachedData = await redisConnection.get(cacheKey);
    if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData));
    }

    const applications = await adminService.getAllApplications({
      status,
      departmentId,
      year: Number(year),
    });

    const response = {
      success: true,
      message: "Applications fetched successfully",
      applications,
    };

    await redisConnection.setex(cacheKey, CACHE_TTL, JSON.stringify(response));

    return res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const exportApplications = async (req, res, next) => {
  const { status, departmentId, year } = req.query;
  try {
    const result = await adminService.exportApplicationsAsExcel({
      status,
      departmentId,
      year: year ? Number(year) : undefined,
    });

    return res.status(200).json(result);
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

export const deleteApplication = async (req, res, next) => {
  const { id } = req.params;

  try {
    await adminService.deleteApplication(id);
    await clearAdminCache("admin:applications:*");

    return res.status(200).json({
      success: true,
      message: "Application and associated data deleted successfully",
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
    await clearAdminCache("admin:applications:*");
    
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
    const cacheKey = `admin:users:${pageSize}:${pageNumber}`;

    const cachedData = await redisConnection.get(cacheKey);
    if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData));
    }

    const users = await adminService.getAllUsers(pageSize, pageNumber);

    const response = {
      success: true,
      users,
    };

    await redisConnection.setex(cacheKey, CACHE_TTL, JSON.stringify(response));

    res.status(200).json(response);
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
    
    await clearAdminCache("admin:users:*");

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
    const cacheKey = `admin:payments:${pageSize}:${pageNumber}`;

    const cachedData = await redisConnection.get(cacheKey);
    if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData));
    }

    const payments = await adminService.getAllPayments(pageSize, pageNumber);

    const response = {
      success: true,
      payments,
      metadata: {
        pageNumber,
        pageSize,
        total: await paymentRepo.countPayments(),
      },
    };

    await redisConnection.setex(cacheKey, CACHE_TTL, JSON.stringify(response));

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const exportPayments = async (req, res, next) => {
  try {
    const result = await adminService.exportPaymentsAsExcel();
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const verifyPayment = async (req, res, next) => {
  const { id } = req.params;
  const { status, reason } = req.body;

  try {
    const payment = await paymentRepo.getPaymentById(id);
    if (!payment) {
      return res
        .status(404)
        .json({ success: false, message: "Payment not found" });
    }

    if (payment.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `Payment is already ${payment.status}`,
      });
    }

    if (status === "SUCCESS") {
      await handleSuccessfulPayment(
        payment.applicationId,
        payment.utr || payment.gatewayOrderId,
      );

      const updatedPayment = await paymentRepo.updatePaymentStatus(
        payment.gatewayOrderId,
        "SUCCESS",
        payment.utr || "MANUAL_VERIFIED",
      );

      if (updatedPayment) {
        import("../payments/receipt.queue.js").then((module) => {
          module.enqueueReceiptGeneration(updatedPayment._id);
        });
      }
    } else if (status === "FAILED") {
      await handleFailedPayment(payment.applicationId, reason);

      payment.status = "FAILED";
      if (reason) payment.rejectionReason = reason;
      await payment.save();
    }
    
    await clearAdminCache("admin:payments:*");
    await clearAdminCache("admin:applications:*");

    return res.status(200).json({
      success: true,
      message: `Payment manually verified as ${status}`,
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await adminService.getDashboardStats();
    res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    next(error);
  }
};

export const syncAllUsers = async (req, res, next) => {
  try {
    const { syncQueue } = await import("../sync/sync.queue.js");
    await syncQueue.add(
      "dispatch-daily-sync",
      {},
      {
        jobId: `manual-sync-dispatcher-${Date.now()}`,
        removeOnComplete: true,
      },
    );
    res.status(200).json({
      success: true,
      message: "Sync job for all users has been triggered successfully.",
    });
  } catch (error) {
    next(error);
  }
};

export const cleanRedisSets = async (req, res, next) => {
  try {
    const keysToDelete = [
      "leaderboard:rapid",
      "leaderboard:blitz",
      "leaderboard:bullet",
    ];
    await redisConnection.del(...keysToDelete);

    return res.status(200).json({
      success: true,
      message: "Leaderboard Redis sets cleaned successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const cleanCloudFiles = async (req, res, next) => {
  try {
    await deleteAllCloudFiles();

    return res.status(200).json({
      success: true,
      message: "All Cloudinary files cleaned successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const sendDraftReminders = async (req, res, next) => {
  try {
    const result = await adminService.sendDraftReminders();
    return res.status(200).json({
      success: true,
      message: `Successfully enqueued draft reminder emails for ${result.count} users.`,
    });
  } catch (error) {
    next(error);
  }
};

export const retryMissingReceipts = async (req, res, next) => {
  try {
    const paymentsWithoutReceipts = await Payment.find({
      status: "SUCCESS",
      $or: [{ receiptUrl: null }, { receiptUrl: "" }],
    });

    for (const payment of paymentsWithoutReceipts) {
      await enqueueReceiptGeneration(payment._id);
    }

    return res.status(200).json({
      success: true,
      message: `Enqueued receipt generation for ${paymentsWithoutReceipts.length} payments.`,
    });
  } catch (error) {
    next(error);
  }
};
