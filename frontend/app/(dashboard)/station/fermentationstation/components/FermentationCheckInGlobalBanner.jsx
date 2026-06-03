'use client';

import { useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Alert, Button, Collapse, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { FERMENTATION_ALLOWED_ROLES } from '../constants';
import { useFermentationCheckInReminders } from '../hooks/useFermentationCheckInReminders';

export default function FermentationCheckInGlobalBanner() {
  const { data: session } = useSession();
  const [dismissed, setDismissed] = useState(false);

  const hasAccess = useMemo(() => {
    const role = session?.user?.role?.toLowerCase?.();
    return role && FERMENTATION_ALLOWED_ROLES.includes(role);
  }, [session?.user?.role]);

  const reminders = useFermentationCheckInReminders({ enabled: hasAccess });

  if (!hasAccess || dismissed || !reminders.showBanner) {
    return null;
  }

  const periodLabel = reminders.activePeriod === 'evening' ? 'Evening' : 'Morning';
  const message = reminders.activePeriod
    ? `${periodLabel} fermentation check-in due for ${reminders.totalDue} active batch${reminders.totalDue === 1 ? '' : 'es'}.`
    : `${reminders.totalDue} fermentation check-in${reminders.totalDue === 1 ? '' : 's'} overdue today.`;

  return (
    <Collapse in={!dismissed}>
      <Alert
        severity="warning"
        sx={{ mb: 2 }}
        action={
          <>
            <Button
              color="inherit"
              size="small"
              component={Link}
              href="/station/fermentationstation"
            >
              Open Fermentation Station
            </Button>
            <IconButton
              aria-label="dismiss"
              color="inherit"
              size="small"
              onClick={() => setDismissed(true)}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          </>
        }
      >
        {message}
      </Alert>
    </Collapse>
  );
}
