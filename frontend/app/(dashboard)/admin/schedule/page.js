"use client";

import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/material/styles";
import axios from "axios";

// Initial data for columns and tasks
const initialData = {
  columns: {
    morning: {
      name: "To Do",
      tasks: [],
    },
    afternoon: {
      name: "In Progress",
      tasks: [],
    },
    evening: {
      name: "Done",
      tasks: [],
    },
  },
};

// Styled components for tasks and columns
const TaskCard = styled(Card)(({ theme }) => ({
  margin: theme.spacing(1),
  padding: theme.spacing(2),
  backgroundColor: "rgba(42, 42, 42, 0.1)",
  border: "1px solid #e0e0e0",
  boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
}));

const ColumnBox = styled(Box)(({ theme }) => ({
  backgroundColor: "rgba(37, 37, 37, 0.1)",
  borderRadius: "8px",
  padding: theme.spacing(2),
  minHeight: "800px", // Adjust this value for the desired minimum height
  height: "auto", // Set this to a fixed height if needed
}));

const SchedulePage = () => {
  const [data, setData] = useState(initialData);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await axios.get('https://processing-facility-backend.onrender.com/api/targets/this-week');
        const tasks = response.data.map(task => ({
          id: task.id, // Ensure unique ID for each task
          type: task.type,
          processingType: task.processingType,
          quality: task.quality,
          targetValue: task.targetValue,
        }));

        // Initialize your columns with fetched tasks
        setData({
          columns: {
            morning: {
              name: "To Do",
              tasks: tasks, // Assign fetched tasks to the To Do column
            },
            afternoon: {
              name: "In Progress",
              tasks: [],
            },
            evening: {
              name: "Done",
              tasks: [],
            },
          },
        });
      } catch (error) {
        console.error("Error fetching tasks:", error);
      }
    };

    fetchTasks();
  }, []); // Run once on component mount

  const onDragEnd = (result) => {
    const { source, destination } = result;

    // If dropped outside a droppable area, do nothing
    if (!destination) return;

    // If dropped in the same column and position, do nothing
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // Move the task
    const sourceColumn = data.columns[source.droppableId];
    const destinationColumn = data.columns[destination.droppableId];

    const sourceTasks = Array.from(sourceColumn.tasks);
    const [movedTask] = sourceTasks.splice(source.index, 1);

    const destinationTasks = Array.from(destinationColumn.tasks);
    destinationTasks.splice(destination.index, 0, movedTask);

    setData({
      ...data,
      columns: {
        ...data.columns,
        [source.droppableId]: {
          ...sourceColumn,
          tasks: sourceTasks,
        },
        [destination.droppableId]: {
          ...destinationColumn,
          tasks: destinationTasks,
        },
      },
    });
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
      <DragDropContext onDragEnd={onDragEnd}>
        <Box sx={{ display: "flex", gap: 4 }}>
          {Object.entries(data.columns).map(([columnId, column]) => (
            <Box key={columnId} sx={{ width: 400 }}>
              <Typography
                variant="h6"
                sx={{ textAlign: "center", mb: 2, fontWeight: "bold" }}
              >
                {column.name}
              </Typography>
              <Droppable droppableId={columnId}>
                {(provided) => (
                  <ColumnBox
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    {column.tasks.map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={index}
                      >
                        {(provided) => (
                          <TaskCard
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <Typography variant="body1">
                              Type: {task.type}
                            </Typography>
                            <Typography variant="body1">
                              Processing: {task.processingType}
                            </Typography>
                            <Typography variant="body1">
                              Quality: {task.quality}
                            </Typography>
                            <Typography variant="body1">
                              Target: {task.targetValue} kg
                            </Typography>
                          </TaskCard>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </ColumnBox>
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