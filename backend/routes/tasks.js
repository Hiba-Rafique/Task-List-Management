const express = require("express");
const router = express.Router();
const Task = require("../models/Task");

// ─── GET /api/tasks ─────────────────────────────────────────
// Fetch all tasks, grouped by column for the frontend
router.get("/", async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: 1 });

    // Group tasks into the three columns the frontend expects
    const grouped = {
      todo: [],
      "in progress": [],
      done: [],
    };

    tasks.forEach((task) => {
      grouped[task.column].push({
        id: task._id,
        text: task.text,
        column: task.column,
        createdAt: task.createdAt,
      });
    });

    res.json(grouped);
  } catch (err) {
    console.error("GET /api/tasks error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── POST /api/tasks ────────────────────────────────────────
// Create a new task
router.post("/", async (req, res) => {
  try {
    const { text, column } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Task text is required" });
    }

    const task = await Task.create({
      text: text.trim(),
      column: column || "todo",
    });

    res.status(201).json({
      id: task._id,
      text: task.text,
      column: task.column,
      createdAt: task.createdAt,
    });
  } catch (err) {
    console.error("POST /api/tasks error:", err.message);

    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ error: messages.join(", ") });
    }

    res.status(500).json({ error: "Server error" });
  }
});

// ─── PUT /api/tasks/:id ─────────────────────────────────────
// Update a task (move column, edit text, or both)
router.put("/:id", async (req, res) => {
  try {
    const { text, column } = req.body;

    const updateFields = {};
    if (text !== undefined) updateFields.text = text.trim();
    if (column !== undefined) updateFields.column = column;

    const task = await Task.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,          // return the updated document
      runValidators: true, // enforce schema validation on update
    });

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json({
      id: task._id,
      text: task.text,
      column: task.column,
      createdAt: task.createdAt,
    });
  } catch (err) {
    console.error("PUT /api/tasks/:id error:", err.message);

    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ error: messages.join(", ") });
    }

    res.status(500).json({ error: "Server error" });
  }
});

// ─── DELETE /api/tasks/:id ──────────────────────────────────
// Delete a task
router.delete("/:id", async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json({ message: "Task deleted", id: task._id });
  } catch (err) {
    console.error("DELETE /api/tasks/:id error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;