import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Button, Typography, Box } from '@mui/material';

const FileUpload = ({ onDrop }) => {
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'application/pdf': [],
    },
    onDrop,
    noClick: true, // Prevents opening file explorer when clicking anywhere in the drop zone
  });

  return (
    <Box {...getRootProps()} sx={dropzoneStyle}>
      <input {...getInputProps()} />
      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Drag & Drop</Typography>
      <Typography variant="body2" sx={{ mb: 2, color: 'gray' }}>or</Typography>
      <Button variant="contained" onClick={open}>Browse</Button>
    </Box>
  );
};

const dropzoneStyle = {
  border: '2px solid rgb(144, 144, 144)',
  borderRadius: '16px',
  padding: '40px', // Increased padding for taller height
  textAlign: 'center',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '160px', // Adjusted for double height
};

export default FileUpload;