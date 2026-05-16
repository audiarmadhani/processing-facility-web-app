'use client';

import { Grid } from '@mui/material';
import { useSession } from 'next-auth/react';
import StationAccessGate from '../_shared/components/StationAccessGate';
import StationSnackbar from '../_shared/components/StationSnackbar';
import { TRANSPORT_ALLOWED_ROLES } from './constants';
import { useTransportStation } from './hooks/useTransportStation';
import TransportForm from './components/TransportForm';
import TransportDataGrid from './components/TransportDataGrid';

function TransportStation() {
  const { data: session, status } = useSession();
  const station = useTransportStation(status);

  return (
    <StationAccessGate
      status={status}
      session={session}
      allowedRoles={TRANSPORT_ALLOWED_ROLES}
      deniedMessage="Access Denied"
    >
      <Grid container spacing={3} sx={{ p: 2 }}>
        <Grid item xs={12} md={4}>
          <TransportForm station={station} />
        </Grid>
        <Grid item xs={12} md={8}>
          <TransportDataGrid
            rows={station.transportData}
            onDownloadInvoices={station.handleDownloadInvoices}
          />
        </Grid>
      </Grid>
      <StationSnackbar {...station.snackbar.snackbarProps} />
    </StationAccessGate>
  );
}

export default TransportStation;
