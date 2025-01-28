"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/material/styles";
import axios from "axios";

// Initial data for columns and tasks
const initialData = {
  columns: {
    todo: {
      name: "To Do",
      tasks: [],
    },
    inprogress: {
      name: "In Progress",
      tasks: [],
    },
    done: {
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
  boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
}));

const ColumnBox = styled(Box)(({ theme }) => ({
  backgroundColor: "rgba(37, 37, 37, 0.1)",
  borderRadius: "8px",
  padding: theme.spacing(2),
  minHeight: "800px",
  height: "auto",
}));

const SchedulePage = () => {
  const { data: session, status } = useSession(); // Move this here
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true); // Loading state

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true); // Set loading to true when fetching starts
      try {
        const response = await axios.get('https://processing-facility-backend.onrender.com/api/targets/this-week');
        const tasks = response.data.map(task => ({
          id: String(task.id),
          type: task.type,
          processingType: task.processingType,
          quality: task.quality,
          targetValue: task.targetValue,
          achievement: task.achievement,
          columnName: task.columnName, // Ensure you have columnName here
        }));
    
        // Initialize your columns with fetched tasks based on their columnName
        const newColumns = {
          todo: {
            name: "To Do",
            tasks: tasks.filter(task => task.columnName === "todo"),
          },
          inprogress: {
            name: "In Progress",
            tasks: tasks.filter(task => task.columnName === "inprogress"),
          },
          done: {
            name: "Done",
            tasks: tasks.filter(task => task.columnName === "done"),
          },
        };
    
        setData({ columns: newColumns });
      } catch (error) {
        console.error("Error fetching tasks:", error);
      } finally {
        setLoading(false); // Set loading to false after data is fetched
      }
    };

    fetchTasks();
  }, []);

  // Show loading indicator while tasks are being fetched
  if (loading) {
    return <Typography variant="h6">Loading tasks...</Typography>;
  }

  const onDragEnd = async (result) => {
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
    const [movedTask] = sourceTasks.splice(source.index, 1); // Remove the task from the source

    const destinationTasks = Array.from(destinationColumn.tasks);
    destinationTasks.splice(destination.index, 0, movedTask); // Add the task to the destination

    // Update state
    setData({
      ...data,
      columns: {
        ...data.columns,
        [source.droppableId]: {
          ...sourceColumn,
          tasks: sourceTasks, // Updated source tasks
        },
        [destination.droppableId]: {
          ...destinationColumn,
          tasks: destinationTasks, // Updated destination tasks
        },
      },
    });

    // Make API call to update the task's column name in the database
    try {
      await axios.put(`https://processing-facility-backend.onrender.com/api/targets/${movedTask.id}`, {
        columnName: destination.droppableId, // Send the new column name
      });
    } catch (error) {
      console.error("Error updating column name:", error);
      // Optionally handle UI feedback for the error
    }
  };

  if (status === "loading") {
    return <p>Loading...</p>;
  }
  
  if (!session || session.user.role !== "admin") {
    return (
      <Typography variant="h6">
        Access Denied. You do not have permission to view this page.
      </Typography>
    );
  }

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
                    ref={provided.innerRef} // Ensure this is passed
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
                            ref={provided.innerRef} // Ensure this is passed
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            {/* Task Content */}
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