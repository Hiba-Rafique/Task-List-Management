// App.jsx
import React, { useState, useEffect } from "react";
import "./App.css";

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
    const saved = localStorage.getItem("minimal-tasks-v2");
    if (saved) return JSON.parse(saved);
    return initialData;
  });

  const [newTask, setNewTask] = useState("");
  const [isMinimal, setIsMinimal] = useState(true);

  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingText, setEditingText] = useState("");

  useEffect(() => {
    localStorage.setItem("minimal-tasks-v2", JSON.stringify(tasks));
  }, [tasks]);

  const onDragStart = (e, id, sourceColumn) => {
    e.dataTransfer.setData("id", id);
    e.dataTransfer.setData("sourceColumn", sourceColumn);
  };

  const onDrop = (e, targetColumn) => {
    const id = parseInt(e.dataTransfer.getData("id"));
    const sourceColumn = e.dataTransfer.getData("sourceColumn");
    
    if (sourceColumn === targetColumn) return;

    const taskToMove = tasks[sourceColumn].find(t => t.id === id);
    if (!taskToMove) return;
    
    setTasks(prev => ({
      ...prev,
      [sourceColumn]: prev[sourceColumn].filter(t => t.id !== id),
      [targetColumn]: [...prev[targetColumn], taskToMove]
    }));
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  const addTask = () => {
    if (newTask.trim() !== "") {
      const newTaskObj = { id: Date.now(), text: newTask.trim() };
      setTasks(prev => ({
        ...prev,
        todo: [...prev.todo, newTaskObj]
      }));
      setNewTask("");
    }
  };

  const handleAdd = (e) => {
    if (e.key === "Enter") {
      addTask();
    }
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
    if (editingText.trim() === "") {
      setEditingTaskId(null);
      return;
    }
    setTasks(prev => ({
      ...prev,
      [column]: prev[column].map(t => t.id === id ? { ...t, text: editingText.trim() } : t)
    }));
    setEditingTaskId(null);
  };

  const handleEditKeyDown = (e, column, id) => {
    if (e.key === "Enter") saveEdit(column, id);
    if (e.key === "Escape") setEditingTaskId(null);
  };

  const toggleDesign = () => {
    // Logic left empty for now as requested
    setIsMinimal(!isMinimal);
  };

  return (
    <div className="container">
      <header>
        <div className="header-top">
          <div className="title-group">
            <h1>Tasco</h1>
            <p className="subtitle">Stop procrastinating. Start Tasco-ing.</p>
          </div>
          <div className="toggle-container">
            <span className="toggle-label">{isMinimal ? "Minimal UI" : "Engaging UI"}</span>
            <label className="switch">
              <input type="checkbox" checked={!isMinimal} onChange={toggleDesign} />
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
          <button className="add-btn" onClick={addTask}>Add Task</button>
        </div>
      </header>

      <div className="board">
        {Object.keys(tasks).map(column => (
          <div 
            key={column} 
            className={`column column-${column.replace(' ', '-')}`}
            onDrop={(e) => onDrop(e, column)}
            onDragOver={onDragOver}
          >
            <div className="column-header">
              <h2 className="column-title">{column}</h2>
              <span className="task-count">{tasks[column].length}</span>
            </div>
            <div className="task-list">
              {tasks[column].map(task => (
                <div 
                  key={task.id} 
                  className={`task-card ${column === 'done' ? 'task-done' : ''}`}
                  draggable={editingTaskId !== task.id}
                  onDragStart={(e) => onDragStart(e, task.id, column)}
                >
                  {editingTaskId === task.id ? (
                    <input 
                      autoFocus
                      className="edit-input"
                      value={editingText}
                      onChange={e => setEditingText(e.target.value)}
                      onBlur={() => saveEdit(column, task.id)}
                      onKeyDown={(e) => handleEditKeyDown(e, column, task.id)}
                    />
                  ) : (
                    <span 
                      className="task-text" 
                      onDoubleClick={() => startEditing(task)}
                      title="Double-click to edit"
                    >
                      {task.text}
                    </span>
                  )}
                  <div className="task-actions">
                    <button className="edit-btn" title="Edit" onClick={() => startEditing(task)}>✎</button>
                    <button className="del-btn" title="Delete" onClick={() => handleDelete(task.id, column)}>&times;</button>
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