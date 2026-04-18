const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, "Task text is required"],
      trim: true,
      maxlength: [200, "Task text cannot exceed 200 characters"],
    },
    column: {
      type: String,
      required: true,
      enum: ["todo", "in progress", "done"],
      default: "todo",
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

module.exports = mongoose.model("Task", taskSchema);