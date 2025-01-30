import * as React from 'react';
import { NextAppProvider } from '@toolpad/core/nextjs';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import type { Navigation } from '@toolpad/core/AppProvider';
import { SessionProvider, signIn, signOut } from 'next-auth/react';
import theme from '../theme';
import { auth } from '../auth';

import DashboardIcon from "@mui/icons-material/Dashboard";
import WarehouseIcon from "@mui/icons-material/Warehouse";
import NoteAltIcon from "@mui/icons-material/NoteAlt";
import FactoryIcon from "@mui/icons-material/Factory";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import CottageIcon from "@mui/icons-material/Cottage";
import GroupsIcon from "@mui/icons-material/Groups";
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AdjustIcon from '@mui/icons-material/Adjust';
import SummarizeIcon from '@mui/icons-material/Summarize';
import VideocamIcon from '@mui/icons-material/Videocam';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import StorageIcon from '@mui/icons-material/Storage';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';

export const metadata = {
  title: "Kopi Fabriek Platform",
  description: "Processing Facility Platform",
  icons: {
    icon: "https://cvxrcxjdirmajmkbiulc.supabase.co/storage/v1/object/sign/assets/favicon.ico?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJhc3NldHMvZmF2aWNvbi5pY28iLCJpYXQiOjE3MzgxMzA1NTgsImV4cCI6NDg5MTczMDU1OH0.wZVenbG-M5jCkBJksWVHlNwHyR6rVtClKvSfXrkn734",
  },
};

const NAVIGATION: Navigation = [
  { kind: "header", title: "Main items" },
  { segment: "", title: "Dashboard", icon: <DashboardIcon /> },

  { kind: "divider" },

  { segment: "farmer", title: "Our Farmers", icon: <GroupsIcon /> },

  { kind: "divider" },

  {
    segment: "station",
    title: "Station",
    icon: <CottageIcon />,
    children: [
      { segment: "receivingstation", title: "Receiving", icon: <WarehouseIcon /> },
      { segment: "transportstation", title: "Transport", icon: <LocalShippingIcon /> },
      { segment: "qcstation", title: "Quality Control", icon: <NoteAltIcon /> },
      { segment: "preprocessingstation", title: "Pre-Processing", icon: <FactoryIcon /> },
      { segment: "postprocessingstation", title: "Post-Processing", icon: <LocalShippingOutlinedIcon /> },
    ],
  },
  
  { kind: "divider" },
  
  {
    segment: "admin",
    title: "Admin",
    icon: <AdminPanelSettingsIcon />,
    children: [
      { segment: "target", title: "Target", icon: <AdjustIcon /> },
      { segment: "database", title: "Database", icon: <StorageIcon /> },
      { segment: "schedule", title: "Schedule", icon: <CalendarMonthIcon /> },
      { segment: "payment", title: "Payment", icon: <RequestQuoteIcon /> },
      { segment: "report", title: "Report (WIP)", icon: <SummarizeIcon /> },
      { segment: "cctv", title: "CCTV (WIP)", icon: <VideocamIcon /> },
    ],
  },
];

const AUTHENTICATION = {
  signIn,
  signOut,
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  return (
    <html lang="en" data-toolpad-color-scheme="dark">
      <body>
        <SessionProvider session={session}>
          <AppRouterCacheProvider options={{ enableCssLayer: true }}>
            <NextAppProvider
              theme={theme}
              navigation={NAVIGATION}
              session={session}
              authentication={AUTHENTICATION}
              branding={{
                logo: <img src="https://cvxrcxjdirmajmkbiulc.supabase.co/storage/v1/object/sign/assets/favicon-32x32.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJhc3NldHMvZmF2aWNvbi0zMngzMi5wbmciLCJpYXQiOjE3MzgxMzA1MjcsImV4cCI6NDg5MTczMDUyN30.ZjDi5VhN4muZ2Nu3DWnvU1-wETCgdo1fo8fwND9wj_o" alt="Kopi Fabriek" width={32} height={32} />,
                title: "Kopi Fabriek Platform",
                homeUrl: "/",
              }}
            >
              {children}
            </NextAppProvider>
          </AppRouterCacheProvider>
        </SessionProvider>
      </body>
    </html>
  );
}