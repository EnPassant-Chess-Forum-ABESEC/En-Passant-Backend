import { AppError } from "../../utils/AppError.js";
import * as submissionRepo from "./submission.repository.js";
import Settings from "../settings/settings.model.js";
import {
  uploadFile,
  isValidMimeType,
  generateSignedUrl,
} from "../storage/storage.service.js";
import * as recruitmentService from "../recruitment/recruitment.service.js";
import * as taskRepo from "../tasks/task.repository.js";
import { Task } from "../tasks/task.model.js";
import { fileTypeFromBuffer } from "file-type";

export const uploadTaskSubmission = async (req, res, next) => {
  const { applicationId, taskId } = req.params;
  const { text, links } = req.body;
  const files = req.files || [];
  const hasText = text && text.trim().length > 0;
  const hasLinks = Array.isArray(links)
    ? links.length > 0
    : links && links.trim().length > 0;

  if (!hasText && !hasLinks && files.length === 0) {
    return res.status(400).json({
      success: false,
      message:
        "Submission cannot be empty. Please provide at least one text, link, or file.",
    });
  }

  const linksArray = Array.isArray(links) ? links : links ? [links] : [];
  for (const link of linksArray) {
    if (link.trim() !== "") {
      try {
        const urlObj = new URL(link);
        if (urlObj.protocol !== "http:" && urlObj.protocol !== "https:") {
          return res.status(400).json({
            success: false,
            message: "Only HTTP/HTTPS links are allowed",
          });
        }
      } catch (err) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid URL provided" });
      }
    }
  }

  const currentYear = new Date().getFullYear();

  try {
    const settings = await Settings.findOne();
    if (settings) {
      if (new Date() < settings.applicationEndDate) {
        return res.status(403).json({
          success: false,
          message: "Submissions will open after the registration deadline",
        });
      }
      if (new Date() > settings.submissionEndDate) {
        return res
          .status(403)
          .json({ success: false, message: "Submission window has closed" });
      }
    }

    const application = await recruitmentService.getMyApplication(
      req.user._id,
      currentYear,
    );

    if (
      !application ||
      (application.status !== "ACTIVE" &&
        application.status !== "TASK_SUBMITTED") ||
      application._id.toString() !== applicationId
    ) {
      return res.status(400).json({
        success: false,
        message: "Application not found or is not active",
      });
    }

    const task = await taskRepo.findById(taskId);

    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    const preferredId =
      application.preferredDepartmentId?._id?.toString() ||
      application.preferredDepartmentId?.toString();
    const secondaryIds =
      application.secondaryDepartmentId?.map(
        (d) => d._id?.toString() || d.toString(),
      ) || [];
    const taskDeptId =
      task.departmentId?._id?.toString() || task.departmentId?.toString();

    if (taskDeptId !== preferredId && !secondaryIds.includes(taskDeptId)) {
      return res.status(400).json({
        success: false,
        message: "You have not applied for this department",
      });
    }

    const allSubmissions =
      await submissionRepo.findSubmissionsByApplicationId(applicationId);

    const alreadySubmitted = allSubmissions.some((sub) => {
      const subTaskId = sub.taskId?._id?.toString() || sub.taskId?.toString();
      return subTaskId === taskId;
    });

    if (alreadySubmitted) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted this task.",
      });
    }

    const isPrimaryDept = taskDeptId === preferredId;

    if (!(isPrimaryDept && task.isRequired)) {
      const requiredPrimaryTaskExists = await Task.exists({
        departmentId: preferredId,
        isRequired: true,
        year: currentYear,
      });

      if (requiredPrimaryTaskExists) {
        const hasRequiredPrimarySubmission = allSubmissions.some((sub) => {
          const deptId =
            sub.taskId?.departmentId?._id?.toString() ||
            sub.taskId?.departmentId?.toString();
          return deptId === preferredId && sub.taskId?.isRequired === true;
        });

        if (!hasRequiredPrimarySubmission) {
          return res.status(400).json({
            success: false,
            message:
              "You must complete the required task for your primary department before submitting any other tasks.",
          });
        }
      }
    }

    if (!isPrimaryDept && !task.isRequired) {
      const requiredSecondaryTaskExists = await Task.exists({
        departmentId: taskDeptId,
        isRequired: true,
        year: currentYear,
      });

      if (requiredSecondaryTaskExists) {
        const hasRequiredSecondarySubmission = allSubmissions.some((sub) => {
          const deptId =
            sub.taskId?.departmentId?._id?.toString() ||
            sub.taskId?.departmentId?.toString();
          return deptId === taskDeptId && sub.taskId?.isRequired === true;
        });

        if (!hasRequiredSecondarySubmission) {
          return res.status(400).json({
            success: false,
            message:
              "You must complete the required task for this department before submitting its optional tasks.",
          });
        }
      }
    }

    const { submission } = task;

    if (files.length && !submission.acceptsFiles) {
      return res.status(400).json({
        success: false,
        message: "File upload is not accepted for this task",
      });
    }

    if (links && !submission.acceptsLinks) {
      return res.status(400).json({
        success: false,
        message: "Link submission is not accepted for this task",
      });
    }

    if (text && !submission.acceptsText) {
      return res.status(400).json({
        success: false,
        message: "Text submission is not accepted for this task",
      });
    }

    if (files.length > submission.maxFiles) {
      return res.status(400).json({
        success: false,
        message: "Number of files exceed the maximum upload limit",
      });
    }

    for (const file of files) {
      if (file.size > submission.maxFileSize) {
        return res.status(400).json({
          success: false,
          message: "File size exceeds the maximum upload limit",
        });
      }

      if (!isValidMimeType(file.mimetype, submission.fileCategory)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid file type for this task" });
      }

      const detectedType = await fileTypeFromBuffer(file.buffer);
      if (
        !detectedType ||
        !isValidMimeType(detectedType.mime, submission.fileCategory)
      ) {
        return res.status(400).json({
          success: false,
          message: "File signature validation failed. Malicious file detected.",
        });
      }
    }

    const uploadedFiles = [];

    for (const file of files) {
      const uploadOptions = {
        folder: `recruitment/${application.year}/${task.departmentId.code}/${applicationId}`,
        resource_type: "auto",
      };

      const result = await uploadFile(file.buffer, uploadOptions);

      uploadedFiles.push({
        publicId: result.public_id,
        resourceType: result.resource_type,
        format: result.format,
        originalName: file.originalname,
        size: file.size,
      });
    }

    const newSubmission = await submissionRepo.upsertSubmission(
      applicationId,
      taskId,
      {
        text,
        links,
        files: uploadedFiles,
      },
    );

    if (application.status === "ACTIVE") {
      await recruitmentService.transitionStatus(
        applicationId,
        "TASK_SUBMITTED",
      );
    }

    return res.status(200).json({ success: true, submission: newSubmission });
  } catch (error) {
    next(error);
  }
};

export const getTaskSubmission = async (req, res, next) => {
  const { applicationId, taskId } = req.params;

  const currentYear = new Date().getFullYear();

  try {
    const application = await recruitmentService.getMyApplication(
      req.user._id,
      currentYear,
    );
    if (!application || application._id.toString() !== applicationId) {
      throw new AppError("Unauthorized", 403);
    }

    const submission = await submissionRepo.findSubmission(
      applicationId,
      taskId,
    );

    if (!submission)
      return res
        .status(404)
        .json({ success: false, message: "submission not found" });

    const files = submission.files?.map((file) => ({
      ...file,
      url: generateSignedUrl(file.publicId, {
        resource_type: file.resourceType,
      }),
    }));

    return res
      .status(200)
      .json({ success: true, submission: { ...submission, files } });
  } catch (error) {
    next(error);
  }
};
