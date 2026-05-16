'use client';

import { Typography } from '@mui/material';

export default function StationAccessGate({
  status,
  session,
  allowedRoles,
  loadingMessage = 'Loading...',
  deniedMessage = 'Access Denied. You do not have permission to view this page.',
  children,
}) {
  if (status === 'loading') {
    return <p>{loadingMessage}</p>;
  }

  if (!session?.user || !allowedRoles.includes(session.user.role)) {
    return <Typography variant="h6">{deniedMessage}</Typography>;
  }

  return children;
}
