"use client";

import React, { useState } from "react";
import {
  useDrag,
  useDrop,
  monitorForElements,
} from "@atlaskit/pragmatic-drag-and-drop/react";
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

  // Function to handle drag and drop updates
  const handleDragEnd = (draggingTaskId, sourceColumnId, destinationColumnId, destinationIndex) => {
    if (sourceColumnId === destinationColumnId && destinationIndex === null) return;

    // Remove task from source column
    const sourceColumn = data.columns[sourceColumnId];
    const sourceTasks = [...sourceColumn.tasks];
    const [movedTask] = sourceTasks.splice(
      sourceTasks.findIndex((task) => task.id === draggingTaskId),
      1
    );

    // Add task to destination column
    const destinationColumn = data.columns[destinationColumnId];
    const destinationTasks = [...destinationColumn.tasks];
    destinationTasks.splice(destinationIndex, 0, movedTask);

    setData({
      ...data,
      columns: {
        ...data.columns,
        [sourceColumnId]: { ...sourceColumn, tasks: sourceTasks },
        [destinationColumnId]: { ...destinationColumn, tasks: destinationTasks },
      },
    });
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
      <Box sx={{ display: "flex", gap: 4 }}>
        {Object.entries(data.columns).map(([columnId, column]) => (
          <Column
            key={columnId}
            columnId={columnId}
            column={column}
            onDragEnd={handleDragEnd}
          />
        ))}
      </Box>
    </Box>
  );
};

// Component for rendering a single column
const Column = ({ columnId, column, onDragEnd }) => {
  const { name, tasks } = column;

  const { dropTargetRef } = useDrop({
    onDragEnter({ source, location }) {
      if (source.type === "task") {
        const destinationIndex = location?.index ?? tasks.length;
        onDragEnd(source.data.id, source.data.columnId, columnId, destinationIndex);
      }
    },
  });

  return (
    <Box ref={dropTargetRef} sx={{ width: 300 }}>
      <Typography variant="h6" sx={{ textAlign: "center", mb: 2 }}>
        {name}
      </Typography>
      <Box
        sx={{
          backgroundColor: "#f4f4f4",
          borderRadius: 2,
          minHeight: 300,
          p: 2,
        }}
      >
        {tasks.map((task, index) => (
          <Task
            key={task.id}
            task={task}
            columnId={columnId}
            index={index}
          />
        ))}
      </Box>
    </Box>
  );
};

// Component for rendering a single task
const Task = ({ task, columnId, index }) => {
  const { dragHandleRef } = useDrag({
    type: "task",
    data: { id: task.id, columnId },
    location: { index },
  });

  return (
    <TaskCard ref={dragHandleRef}>
      {task.content}
    </TaskCard>
  );
};

export default SchedulePage;