import * as submissionRepo from "./submission.repository.js";
import Settings from "../settings/settings.model.js";
import {
  uploadFile,
  isValidMimeType,
  generateSignedUrl,
} from "../storage/storage.service.js";
import * as recruitmentService from "../recruitment/recruitment.service.js";
import * as taskRepo from "../tasks/task.repository.js";

export const uploadTaskSubmission = async (req, res, next) => {
  const { applicationId, taskId } = req.params;
  const { text, links } = req.body;
  const files = req.files || [];

  const currentYear = new Date().getFullYear();

  try {
    const settings = await Settings.findOne();
    if (settings && new Date() > settings.submissionEndDate) {
      return res.status(403).json({ success: false, message: "Submission window has closed" });
    }

    const application = await recruitmentService.getMyApplication(
      req.user._id,
      currentYear,
    );

    if (
      !application ||
      (application.status !== "ACTIVE" && application.status !== "TASK_SUBMITTED") ||
      application._id.toString() !== applicationId
    ) {
      return res.status(400).json({ success: false, message: "Application not found or is not active" });
    }

    const task = await taskRepo.findById(taskId);

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const preferredId = application.preferredDepartmentId?._id?.toString() || application.preferredDepartmentId?.toString();
    const secondaryIds = application.secondaryDepartmentId?.map(d => d._id?.toString() || d.toString()) || [];
    const taskDeptId = task.departmentId?._id?.toString() || task.departmentId?.toString();

    if (taskDeptId !== preferredId && !secondaryIds.includes(taskDeptId)) {
      return res.status(400).json({ success: false, message: "You have not applied for this department" });
    }

    const { submission } = task;

    if (files.length && !submission.acceptsFiles) {
      return res.status(400).json({ success: false, message: "File upload is not accepted for this task" });
    }

    if (links && !submission.acceptsLinks) {
      return res.status(400).json({ success: false, message: "Link submission is not accepted for this task" });
    }

    if (text && !submission.acceptsText) {
      return res.status(400).json({ success: false, message: "Text submission is not accepted for this task" });
    }

    if (files.length > submission.maxFiles) {
      return res.status(400).json({ success: false, message: "Number of files exceed the maximum upload limit" });
    }

    for (const file of files) {
      if (file.size > submission.maxFileSize) {
        return res.status(400).json({ success: false, message: "File size exceeds the maximum upload limit" });
      }

      if (!isValidMimeType(file.mimetype, submission.fileCategory)) {
        return res.status(400).json({ success: false, message: "Invalid file type for this task" });
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
      throw new Error("Unauthorized");
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
