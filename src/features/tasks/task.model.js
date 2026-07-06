import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true },
  description: { type: String },
});

const taskSchema = new mongoose.Schema({
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
    required: true,
  },
  year: { type: Number, required: true },
  title: { type: String, required: true, trim: true },
  summary: { type: String, required: true },
  instructions: { type: String, required: true },
  order: { type: Number, required: true },
  isRequired: { type: Boolean, default: true },
  submission: {
    acceptsText: { type: Boolean, default: false },
    acceptsLinks: { type: Boolean, default: false },
    acceptsFiles: { type: Boolean, default: false },
    fileCategory: {
      type: String,
      enum: ["image", "video", "raw"],
    },
    maxFiles: { type: Number },
    maxFileSize: { type: Number }, // in bytes
  },
});

// indexes
taskSchema.index({ departmentId: 1, year: 1, order: 1 });

const Department = mongoose.model("Department", departmentSchema);
const Task = mongoose.model("Task", taskSchema);

export { Department, Task };
