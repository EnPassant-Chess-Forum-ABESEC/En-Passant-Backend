import * as submissionRepo from "./submission.repository.js";
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
    const application = await recruitmentService.getMyApplication(
      req.user._id,
      currentYear,
    );

    if (
      !application ||
      application.status !== "ACTIVE" ||
      application._id.toString() !== applicationId
    )
      throw new Error("application not found or is not active");

    const task = await taskRepo.findById(taskId);

    if (!task) throw new Error("Task not found");

    const { submission } = task;

    if (files.length && !submission.acceptsFiles)
      throw new Error("File upload is not accepted for this task");

    if (links && !submission.acceptsLinks)
      throw new Error("Link submission is not accepted for this task");

    if (text && !submission.acceptsText)
      throw new Error("Text submission is not accepted for this task");

    if (files.length > submission.maxFiles)
      throw new Error("Number of files exceed the maximum upload limit");

    for (const file of files) {
      if (file.size > submission.maxFileSize)
        throw new Error("File size exceeds the maximum upload limit");

      if (!isValidMimeType(file.mimetype, submission.fileCategory))
        throw new Error("Invalid file type for this task");
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
