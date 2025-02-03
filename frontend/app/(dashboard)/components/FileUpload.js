import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button, Typography, Box, List, ListItem } from '@mui/material';
import { styled } from '@mui/system';

const FileUpload = ({ onDrop }) => {
  const [files, setFiles] = useState([]);
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'application/pdf': [],
    },
    onDrop: acceptedFiles => {
      setFiles(acceptedFiles);
      if (onDrop) {
        onDrop(acceptedFiles);
      }
    },
    noClick: true, // Prevents file dialog from opening on click (only via the button)
  });

  return (
    <StyledDropzone {...getRootProps()}>
      <input {...getInputProps()} />
      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
        Drag & Drop
      </Typography>
      <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
        or
      </Typography>
      <Button variant="contained" onClick={open}>
        Browse
      </Button>
      {files.length > 0 && (
        <Box sx={{ mt: 2, textAlign: 'left', width: '100%' }}>
          <Typography variant="subtitle1">Selected Files:</Typography>
          <List dense>
            {files.map((file, index) => (
              <ListItem key={index} sx={{ fontSize: '0.875rem' }}>
                {file.name}
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </StyledDropzone>
  );
};

// Styled component for the dropzone to match MUI TextField styles
const StyledDropzone = styled(Box)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`, // Matches TextField border color
  borderRadius: theme.shape.borderRadius, // Matches TextField border radius
  padding: theme.spacing(4),
  textAlign: 'center',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '160px', // Twice the normal height
  margin: theme.spacing(2, 0), // Adds margin top & bottom
  transition: 'border-color 0.3s ease',
  '&:hover': {
    borderColor: theme.palette.primary.main,
  },
}));

export default FileUpload;