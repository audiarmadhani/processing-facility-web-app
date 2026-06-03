'use client';

import { useEffect, useRef, useState } from 'react';
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
  TextField,
  Chip,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import Webcam from 'react-webcam';
import axios from 'axios';
import dayjs from 'dayjs';
import { API_BASE_URL } from '../../constants';

function TabPanel({ children, value, index }) {
  if (value !== index) return null;
  return <Box sx={{ pt: 2 }}>{children}</Box>;
}

export default function CheckInDialog({
  open,
  row,
  activePeriod,
  busy,
  webcamRef,
  onClose,
  onSubmit,
}) {
  const [tab, setTab] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [notes, setNotes] = useState('');
  const [todayCheckIns, setTodayCheckIns] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const fileInputRef = useRef(null);

  const periodLabel = activePeriod === 'evening' ? 'Evening check-in' : 'Morning check-in';
  const batchLabel = row?.batchNumber || 'TBD';

  useEffect(() => {
    if (!open || !row?.id) {
      setTodayCheckIns([]);
      return;
    }

    let cancelled = false;
    setLoadingHistory(true);

    axios
      .get(`${API_BASE_URL}/api/fermentation/${row.id}/check-ins`)
      .then((response) => {
        if (cancelled) return;
        const today = dayjs().format('YYYY-MM-DD');
        const items = (response.data || []).filter(
          (item) => item.checkInDate === today || item.checkInDate?.slice?.(0, 10) === today
        );
        setTodayCheckIns(items);
      })
      .catch(() => {
        if (!cancelled) setTodayCheckIns([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingHistory(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, row?.id]);

  const resetLocalState = () => {
    setTab(0);
    setPreviewUrl(null);
    setSelectedFile(null);
    setNotes('');
  };

  const handleClose = () => {
    if (busy) return;
    resetLocalState();
    onClose();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmitCamera = async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) return;
    const blob = await fetch(imageSrc).then((res) => res.blob());
    const file = new File([blob], `checkin_${Date.now()}.jpg`, { type: 'image/jpeg' });
    await onSubmit({ notes, imageFile: file, period: activePeriod });
    resetLocalState();
  };

  const handleSubmitFile = async () => {
    if (!selectedFile) return;
    await onSubmit({ notes, imageFile: selectedFile, period: activePeriod });
    resetLocalState();
  };

  const hasImage = tab === 0 || Boolean(selectedFile);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Fermentation check-in — {batchLabel}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Chip label={periodLabel} color="primary" size="small" />
          {(row?.tank || row?.tanks?.length) && (
            <Typography variant="body2" color="text.secondary">
              Tank: {row.tanks?.length ? row.tanks.join(', ') : row.tank}
            </Typography>
          )}
        </Box>

        {loadingHistory ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <CircularProgress size={18} />
            <Typography variant="body2">Loading today&apos;s check-ins…</Typography>
          </Box>
        ) : todayCheckIns.length > 0 ? (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Today&apos;s check-ins
            </Typography>
            <List dense disablePadding>
              {todayCheckIns.map((item) => (
                <ListItem key={item.id} disableGutters>
                  <ListItemText
                    primary={`${item.period === 'morning' ? 'Morning' : 'Evening'} — ${item.createdBy || 'Unknown'}`}
                    secondary={item.notes || 'No notes'}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        ) : null}

        <TextField
          label="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          fullWidth
          multiline
          minRows={2}
          margin="normal"
          disabled={busy}
        />

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mt: 1 }}>
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
                  width: 1280,
                  height: 720,
                  facingMode: 'environment',
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
              Select a JPEG or PNG photo of the fermentation tank.
            </Typography>
          )}
        </TabPanel>

        {busy && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
            <CircularProgress size={24} />
            <Typography variant="body2">Uploading and saving check-in…</Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={busy}>
          Cancel
        </Button>
        {tab === 0 ? (
          <Button
            variant="contained"
            onClick={handleSubmitCamera}
            disabled={busy || !hasImage}
          >
            Submit check-in
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleSubmitFile}
            disabled={busy || !selectedFile}
          >
            Submit check-in
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
