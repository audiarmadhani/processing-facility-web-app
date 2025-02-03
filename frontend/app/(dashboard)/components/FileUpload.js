// FileUpload.js
import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Button, Typography } from '@mui/material';

const FileUpload = ({ onDrop }) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'application/pdf': [],
    },
    onDrop,
  });

  return (
    <div {...getRootProps()} style={dropzoneStyle}>
      <input {...getInputProps()} />
      {isDragActive ? (
        <Typography variant="body1">Drop the files here ...</Typography>
      ) : (
        <Typography variant="body1">Drag 'n' drop some files here, or click to select files</Typography>
      )}
      <Button variant="contained" style={{ marginTop: '10px' }}>
        Browse Files
      </Button>
    </div>
  );
};

const dropzoneStyle = {
  border: '2px dashed #cccccc',
  borderRadius: '5px',
  padding: '20px',
  textAlign: 'center',
  cursor: 'pointer',
};

export default FileUpload;