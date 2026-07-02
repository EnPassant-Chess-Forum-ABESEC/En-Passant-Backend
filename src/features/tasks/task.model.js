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
  description: { type: String, required: true },
  order: { type: Number, required: true },
  submissionType: {
    type: String,
    enum: ["file", "link", "both"],
    required: true,
  },
  isRequired: { type: Boolean, default: true },
});

// indexes
taskSchema.index({ departmentId: 1, year: 1, order: 1 });

const Department = mongoose.model("Department", departmentSchema);
const Task = mongoose.model("Task", taskSchema);

export default { Department, Task };
