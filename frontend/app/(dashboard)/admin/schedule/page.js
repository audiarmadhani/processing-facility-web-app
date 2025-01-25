"use client";

import React, { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/material/styles";

// Initial data for columns and tasks
const initialData = {
  columns: {
    morning: {
      name: "Morning",
      tasks: [{ id: "task-1", content: "Meeting with Team A" }],
    },
    afternoon: {
      name: "Afternoon",
      tasks: [{ id: "task-2", content: "Work on Project B" }],
    },
    evening: {
      name: "Evening",
      tasks: [{ id: "task-3", content: "Client Call" }],
    },
  },
};

// Styled components for tasks
const TaskCard = styled(Card)(({ theme }) => ({
  margin: theme.spacing(1),
  padding: theme.spacing(2),
  backgroundColor: "#fff",
  boxShadow: theme.shadows[1],
  cursor: "grab",
}));

const SchedulePage = () => {
  const [data, setData] = useState(initialData);

  const handleDragStart = (event, taskId, columnId) => {
    event.dataTransfer.setData("taskId", taskId);
    event.dataTransfer.setData("sourceColumnId", columnId);
  };

  const handleDrop = (event, destinationColumnId) => {
    event.preventDefault();

    const taskId = event.dataTransfer.getData("taskId");
    const sourceColumnId = event.dataTransfer.getData("sourceColumnId");

    if (sourceColumnId === destinationColumnId) return; // No movement needed

    // Update the task data
    const sourceColumn = data.columns[sourceColumnId];
    const destinationColumn = data.columns[destinationColumnId];
    const task = sourceColumn.tasks.find((task) => task.id === taskId);

    setData((prevData) => {
      const updatedSourceTasks = sourceColumn.tasks.filter((task) => task.id !== taskId);
      const updatedDestinationTasks = [...destinationColumn.tasks, task];

      return {
        ...prevData,
        columns: {
          ...prevData.columns,
          [sourceColumnId]: { ...sourceColumn, tasks: updatedSourceTasks },
          [destinationColumnId]: { ...destinationColumn, tasks: updatedDestinationTasks },
        },
      };
    });
  };

  const handleDragOver = (event) => {
    event.preventDefault(); // Allow dropping
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
      <Box sx={{ display: "flex", gap: 4 }}>
        {Object.entries(data.columns).map(([columnId, column]) => (
          <Column
            key={columnId}
            columnId={columnId}
            column={column}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragStart={handleDragStart}
          />
        ))}
      </Box>
    </Box>
  );
};

// Component for rendering a single column
const Column = ({ columnId, column, onDrop, onDragOver, onDragStart }) => {
  const { name, tasks } = column;

  return (
    <Box
      onDrop={(event) => onDrop(event, columnId)}
      onDragOver={onDragOver}
      sx={{
        width: 300,
        backgroundColor: "#f4f4f4",
        borderRadius: 2,
        minHeight: 300,
        p: 2,
      }}
    >
      <Typography variant="h6" sx={{ textAlign: "center", mb: 2 }}>
        {name}
      </Typography>
      {tasks.map((task) => (
        <Task key={task.id} task={task} columnId={columnId} onDragStart={onDragStart} />
      ))}
    </Box>
  );
};

// Component for rendering a single task
const Task = ({ task, columnId, onDragStart }) => {
  return (
    <TaskCard
      draggable
      onDragStart={(event) => onDragStart(event, task.id, columnId)}
    >
      {task.content}
    </TaskCard>
  );
};

export default SchedulePage;