'use client';

import { useRef, useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Tabs,
  Tab,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import Webcam from 'react-webcam';

function TabPanel({ children, value, index }) {
  if (value !== index) return null;
  return <Box sx={{ pt: 2 }}>{children}</Box>;
}

export default function CherryQcCaptureDialog({
  open,
  onClose,
  webcamRef,
  batchNumber,
  busy,
  onCaptureFromCamera,
  onCaptureFromFile,
}) {
  const [tab, setTab] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleClose = () => {
    if (busy) return;
    setTab(0);
    setPreviewUrl(null);
    setSelectedFile(null);
    onClose();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUploadAnalyze = () => {
    if (selectedFile) onCaptureFromFile(selectedFile);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xl" fullWidth>
      <DialogTitle>
        Capture cherry sample
        {batchNumber ? ` — ${batchNumber}` : ''}
      </DialogTitle>
      <DialogContent>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Live camera" />
          <Tab label="Upload photo" />
        </Tabs>

        <TabPanel value={tab} index={0}>
          <Card variant="outlined" sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CardContent>
              <Webcam
                audio={false}
                ref={webcamRef}
                videoConstraints={{
                  width: 1920,
                  height: 1080,
                  facingMode: 'user',
                }}
                screenshotFormat="image/jpeg"
                onUserMediaError={(error) => console.error('Webcam error:', error)}
              />
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={tab} index={1}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleFileChange}
          />
          <Button
            variant="outlined"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            sx={{ mb: 2 }}
          >
            Choose image
          </Button>
          {previewUrl && (
            <Box
              component="img"
              src={previewUrl}
              alt="Upload preview"
              sx={{ maxWidth: '100%', maxHeight: 400, display: 'block' }}
            />
          )}
          {!previewUrl && (
            <Typography variant="body2" color="text.secondary">
              Select a JPEG or PNG photo of the cherry sample.
            </Typography>
          )}
        </TabPanel>

        {busy && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
            <CircularProgress size={24} />
            <Typography variant="body2">Analyzing and uploading…</Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
        {tab === 0 && (
          <Button
            onClick={onCaptureFromCamera}
            color="primary"
            variant="contained"
            disabled={busy}
          >
            Capture
          </Button>
        )}
        {tab === 1 && (
          <Button
            onClick={handleUploadAnalyze}
            color="primary"
            variant="contained"
            disabled={busy || !selectedFile}
          >
            Analyze &amp; save
          </Button>
        )}
        <Button onClick={handleClose} color="secondary" variant="contained" disabled={busy}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}
