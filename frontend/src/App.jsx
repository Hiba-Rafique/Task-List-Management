import React, { useState, useEffect } from "react";
import "./App.css";
import confetti from "canvas-confetti"; // INSTALL THIS WITH `npm install canvas-confetti`

const initialData = {
todo: [
{ id: 1, text: "Buy groceries" },
{ id: 2, text: "Read a book" },
],
"in progress": [
{ id: 3, text: "Build a web app" }
],
done: [
{ id: 4, text: "Pay bills" },
]
};

export default function App() {
const [tasks, setTasks] = useState(() => {
try {
const saved = localStorage.getItem("minimal-tasks-v2");
return saved ? JSON.parse(saved) : initialData;
} catch {
return initialData;
}
});

const [newTask, setNewTask] = useState("");
const [isMinimal, setIsMinimal] = useState(true);
const [editingTaskId, setEditingTaskId] = useState(null);
const [editingText, setEditingText] = useState("");
const [xp, setXp] = useState(0);

useEffect(() => {
localStorage.setItem("minimal-tasks-v2", JSON.stringify(tasks));
}, [tasks]);

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
origin: { y: 0.6 }
});
};

const onDragStart = (e, id, sourceColumn) => {
e.dataTransfer.setData("id", id.toString());
e.dataTransfer.setData("sourceColumn", sourceColumn);
};

const onDrop = (e, targetColumn) => {
e.preventDefault();

const id = Number(e.dataTransfer.getData("id"));
const sourceColumn = e.dataTransfer.getData("sourceColumn");

if (!id || !sourceColumn || sourceColumn === targetColumn) return;

const taskToMove = tasks[sourceColumn]?.find(t => t.id === id);
if (!taskToMove) return;

setTasks(prev => ({
  ...prev,
  [sourceColumn]: prev[sourceColumn].filter(t => t.id !== id),
  [targetColumn]: [...prev[targetColumn], taskToMove]
}));

if (targetColumn === "done" && !isMinimal) {
  fireConfetti();
  setXp(prev => prev + 20);
}

};

const addTask = () => {
if (!newTask.trim()) return;


const newTaskObj = {
  id: Date.now(),
  text: newTask.trim()
};

setTasks(prev => ({
  ...prev,
  todo: [...prev.todo, newTaskObj]
}));

setNewTask("");

if (!isMinimal) {
  setXp(prev => prev + 5);
}


};

const handleAdd = (e) => {
if (e.key === "Enter") addTask();
};

const handleDelete = (id, column) => {
setTasks(prev => ({
...prev,
[column]: prev[column].filter(t => t.id !== id)
}));
};

const startEditing = (task) => {
setEditingTaskId(task.id);
setEditingText(task.text);
};

const saveEdit = (column, id) => {
if (!editingText.trim()) {
setEditingTaskId(null);
return;
}

setTasks(prev => ({
  ...prev,
  [column]: prev[column].map(t =>
    t.id === id ? { ...t, text: editingText.trim() } : t
  )
}));

setEditingTaskId(null);


};

const handleEditKeyDown = (e, column, id) => {
if (e.key === "Enter") saveEdit(column, id);
if (e.key === "Escape") setEditingTaskId(null);
};

return (
<div className={`container ${isMinimal ? "minimal" : "engaging"}`}> <header> <div className="header-top"> <div className="title-group"> <h1>Tasco</h1> <p className="subtitle">Stop procrastinating. Start Tasco-ing.</p> </div>

      <div className="toggle-container">
        <span className="toggle-label">
          {isMinimal ? "Minimal UI" : "Engaging UI"}
        </span>
        <label className="switch">
          <input
            type="checkbox"
            checked={!isMinimal}
            onChange={() => setIsMinimal(prev => !prev)}
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