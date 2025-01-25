"use client"

import React, { useState } from "react";
import { DragDropContext, Draggable, Droppable } from "@atlaskit/pragmatic-drag-and-drop-react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/material/styles";

// Initial data for columns and tasks
const initialData = {
  columns: {
    "morning": {
      name: "Morning",
      tasks: [{ id: "task-1", content: "Meeting with Team A" }],
    },
    "afternoon": {
      name: "Afternoon",
      tasks: [{ id: "task-2", content: "Work on Project B" }],
    },
    "evening": {
      name: "Evening",
      tasks: [{ id: "task-3", content: "Client Call" }],
    },
  },
};

// Styled components for tasks and columns
const TaskCard = styled(Card)(({ theme }) => ({
  margin: theme.spacing(1),
  padding: theme.spacing(2),
}));

const SchedulePage = () => {
  const [data, setData] = useState(initialData);

  const onDragEnd = ({ source, destination }) => {
    // If dropped outside any droppable area, return
    if (!destination) return;

    // Handle task movement between columns
    const sourceColumn = data.columns[source.droppableId];
    const destinationColumn = data.columns[destination.droppableId];
    const sourceTasks = Array.from(sourceColumn.tasks);
    const destinationTasks = Array.from(destinationColumn.tasks);

    // Remove the dragged task from the source column
    const [movedTask] = sourceTasks.splice(source.index, 1);

    // Add it to the destination column
    destinationTasks.splice(destination.index, 0, movedTask);

    setData({
      ...data,
      columns: {
        ...data.columns,
        [source.droppableId]: { ...sourceColumn, tasks: sourceTasks },
        [destination.droppableId]: { ...destinationColumn, tasks: destinationTasks },
      },
    });
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
      <DragDropContext onDragEnd={onDragEnd}>
        <Box sx={{ display: "flex", gap: 4 }}>
          {Object.entries(data.columns).map(([columnId, column]) => (
            <Box key={columnId} sx={{ width: 300 }}>
              <Typography variant="h6" sx={{ textAlign: "center", mb: 2 }}>
                {column.name}
              </Typography>
              <Droppable droppableId={columnId}>
                {(provided) => (
                  <Box
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    sx={{
                      backgroundColor: "#f4f4f4",
                      borderRadius: 2,
                      minHeight: 300,
                      p: 2,
                    }}
                  >
                    {column.tasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided) => (
                          <TaskCard
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            {task.content}
                          </TaskCard>
                        )}
                      </Draggable>
                    ))}
                  </Box>
                )}
              </Droppable>
            </Box>
          ))}
        </Box>
      </DragDropContext>
    </Box>
  );
};

export default SchedulePage;