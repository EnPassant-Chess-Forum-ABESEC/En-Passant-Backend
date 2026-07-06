import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema({
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Recruitment",
    required: true,
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Task",
    required: true,
  },
  text: { type: String },
  links: [
    {
      type: String,
    },
  ],
  files: [
    {
      publicId: {
        type: String,
        required: true,
      },
      resourceType: {
        type: String,
        required: true,
        enum: ["image", "video", "raw"],
      },
      format: { type: String, required: true },
      originalName: { type: String, required: true },
      size: { type: Number, required: true }, // in bytes
    },
  ],
});

submissionSchema.index({ applicationId: 1, taskId: 1 }, { unique: true });

const Submission = mongoose.model("Submission", submissionSchema);

export { Submission };
