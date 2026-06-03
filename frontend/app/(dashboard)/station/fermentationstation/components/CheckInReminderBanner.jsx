'use client';

import { Alert, Button, Stack, Typography } from '@mui/material';

function periodLabel(period) {
  return period === 'evening' ? 'Evening' : 'Morning';
}

export default function CheckInReminderBanner({ reminders, onCheckIn }) {
  if (!reminders.showBanner) return null;

  const { activePeriod, dueItems, totalDue } = reminders;
  const periodText = activePeriod ? periodLabel(activePeriod).toLowerCase() : 'overdue';

  return (
    <Alert severity="warning" sx={{ mb: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        {activePeriod
          ? `${periodLabel(activePeriod)} check-in due for ${totalDue} active fermentation${totalDue === 1 ? '' : 's'}.`
          : `${totalDue} fermentation check-in${totalDue === 1 ? '' : 's'} overdue today.`}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Check-ins are required twice daily (morning 06:00–12:00 WITA, evening 17:00–21:00 WITA).
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {dueItems.map((item) => (
          <Button
            key={`${item.id}-${item.missingPeriod}`}
            size="small"
            variant="outlined"
            color="inherit"
            onClick={() => onCheckIn(item, item.missingPeriod)}
          >
            Check in — {item.batchNumber} ({periodLabel(item.missingPeriod || periodText)})
          </Button>
        ))}
      </Stack>
    </Alert>
  );
}
