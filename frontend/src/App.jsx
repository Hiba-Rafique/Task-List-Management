import React, { useState, useEffect } from "react";
import "./App.css";
import confetti from "canvas-confetti";

const API_URL = "/api/tasks";

export default function App() {
  const [tasks, setTasks] = useState({
    todo: [],
    "in progress": [],
    done: [],
  });

  const [newTask, setNewTask] = useState("");
  const [isMinimal, setIsMinimal] = useState(true);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [xp, setXp] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch tasks from backend on mount
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  // Apply/remove body class so full viewport gets the dark bg in engaging mode
  useEffect(() => {
    if (!isMinimal) {
      document.body.classList.add("engaging-active");
    } else {
      document.body.classList.remove("engaging-active");
    }
    return () => document.body.classList.remove("engaging-active");
  }, [isMinimal]);

  const totalTasks =
    tasks.todo.length +
    tasks["in progress"].length +
    tasks.done.length;

  const completedTasks = tasks.done.length;
  const progress =
    totalTasks === 0
      ? 0
      : Math.round((completedTasks / totalTasks) * 100);

  const level = Math.floor(xp / 100) + 1;

  const fireConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const onDragStart = (e, id, sourceColumn) => {
    e.dataTransfer.setData("id", id.toString());
    e.dataTransfer.setData("sourceColumn", sourceColumn);
  };

  const onDrop = async (e, targetColumn) => {
    e.preventDefault();

    const id = e.dataTransfer.getData("id");
    const sourceColumn = e.dataTransfer.getData("sourceColumn");

    if (!id || !sourceColumn || sourceColumn === targetColumn) return;

    const taskToMove = tasks[sourceColumn]?.find((t) => t.id === id);
    if (!taskToMove) return;

    // Optimistic UI update
    setTasks((prev) => ({
      ...prev,
      [sourceColumn]: prev[sourceColumn].filter((t) => t.id !== id),
      [targetColumn]: [...prev[targetColumn], taskToMove],
    }));

    if (targetColumn === "done" && !isMinimal) {
      fireConfetti();
      setXp((prev) => prev + 20);
    }

    // Persist to backend
    try {
      await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ column: targetColumn }),
      });
    } catch (err) {
      console.error("Failed to move task:", err);
      fetchTasks();
    }
  };

  const addTask = async () => {
    if (!newTask.trim()) return;

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newTask.trim(), column: "todo" }),
      });

      const created = await res.json();

      setTasks((prev) => ({
        ...prev,
        todo: [...prev.todo, created],
      }));

      setNewTask("");

      if (!isMinimal) {
        setXp((prev) => prev + 5);
      }
    } catch (err) {
      console.error("Failed to add task:", err);
    }
  };

  const handleAdd = (e) => {
    if (e.key === "Enter") addTask();
  };

  const handleDelete = async (id, column) => {
    // Optimistic UI update
    setTasks((prev) => ({
      ...prev,
      [column]: prev[column].filter((t) => t.id !== id),
    }));

    try {
      await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete task:", err);
      fetchTasks();
    }
  };

  const startEditing = (task) => {
    setEditingTaskId(task.id);
    setEditingText(task.text);
  };

  const saveEdit = async (column, id) => {
    if (!editingText.trim()) {
      setEditingTaskId(null);
      return;
    }

    // Optimistic UI update
    setTasks((prev) => ({
      ...prev,
      [column]: prev[column].map((t) =>
        t.id === id ? { ...t, text: editingText.trim() } : t
      ),
    }));

    setEditingTaskId(null);

    try {
      await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: editingText.trim() }),
      });
    } catch (err) {
      console.error("Failed to edit task:", err);
      fetchTasks();
    }
  };

  const handleEditKeyDown = (e, column, id) => {
    if (e.key === "Enter") saveEdit(column, id);
    if (e.key === "Escape") setEditingTaskId(null);
  };

  if (loading) {
    return (
      <div className="container minimal" style={{ textAlign: "center", paddingTop: "100px" }}>
        <h1>Tasco</h1>
        <p>Loading tasks...</p>
      </div>
    );
  }

  return (
    <div className={`container ${isMinimal ? "minimal" : "engaging"}`}>
      <header>
        <div className="header-top">
          <div className="title-group">
            <h1>Tasco</h1>
            <p className="subtitle">Stop procrastinating. Start Tasco-ing.</p>
          </div>

          <div className="toggle-container">
            <span className="toggle-label">
              {isMinimal ? "Minimal UI" : "Engaging UI"}
            </span>
            <label className="switch">
              <input
                type="checkbox"
                checked={!isMinimal}
                onChange={() => setIsMinimal((prev) => !prev)}
              />
              <span className="slider round"></span>
            </label>
          </div>
        </div>

        <div className="input-group">
          <input
            type="text"
            placeholder="Add a new task..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={handleAdd}
            className="task-input"
          />
          <button className="add-btn" onClick={addTask}>
            Add Task
          </button>
        </div>
      </header>

      {!isMinimal && (
        <div className="gamification-card">
          <h3>🔥 Level {level}</h3>
          <p>{xp} XP</p>

          <div className="progress-bar big">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          <div className="stats">
            <span>✅ {completedTasks}</span>
            <span>📋 {totalTasks}</span>
          </div>
        </div>
      )}

      <div className="board">
        {Object.keys(tasks).map((column) => (
          <div
            key={column}
            className={`column column-${column.replace(" ", "-")}`}
            onDrop={(e) => onDrop(e, column)}
            onDragOver={(e) => e.preventDefault()}
          >
            <div className="column-header">
              <h2 className="column-title">{column}</h2>
              <span className="task-count">{tasks[column].length}</span>
            </div>

            <div className="task-list">
              {tasks[column].map((task) => (
                <div
                  key={task.id}
                  className={`task-card ${column === "done" ? "task-done" : ""}`}
                  draggable={editingTaskId !== task.id}
                  onDragStart={(e) => onDragStart(e, task.id, column)}
                >
                  {editingTaskId === task.id ? (
                    <input
                      autoFocus
                      className="edit-input"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onBlur={() => saveEdit(column, task.id)}
                      onKeyDown={(e) => handleEditKeyDown(e, column, task.id)}
                    />
                  ) : (
                    <span
                      className="task-text"
                      onDoubleClick={() => startEditing(task)}
                    >
                      {task.text}
                    </span>
                  )}

                  <div className="task-actions">
                    <button className="edit-btn" onClick={() => startEditing(task)}>✎</button>
                    <button className="del-btn" onClick={() => handleDelete(task.id, column)}>×</button>
                  </div>
                </div>
              ))}

              {tasks[column].length === 0 && (
                <div className="empty-state">No tasks here</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
