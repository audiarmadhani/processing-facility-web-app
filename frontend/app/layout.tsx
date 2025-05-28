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
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import StorefrontIcon from '@mui/icons-material/Storefront';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import ShoppingCartCheckoutIcon from '@mui/icons-material/ShoppingCartCheckout';

export const metadata = {
  title: "BTM HEQA Platform",
  description: "BTM HEQA Processing Facility Platform",
  // icons: {
    // icon: "https://cvxrcxjdirmajmkbiulc.supabase.co/storage/v1/object/sign/assets/favicon%20(1).ico?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJhc3NldHMvZmF2aWNvbiAoMSkuaWNvIiwiaWF0IjoxNzM4NTU1NTU5LCJleHAiOjEwMzc4NTU1NTU5fQ.rqew4VRFFxA7l_Q6sgpYAVOpHkTbG_h9F0CqIKQODd8",
  // },
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
      { segment: "receivingstation", title: "Receiving Station", icon: <WarehouseIcon /> },
      { segment: "transportstation", title: "Cherry Inbound Transport", icon: <LocalShippingIcon /> },
      { segment: "qcstation", title: "Cherry QC Station", icon: <NoteAltIcon /> },

      { kind: "divider" },

      { segment: "preprocessingstation", title: "Pre-Processing Station", icon: <FactoryIcon /> },
      { segment: "wetmillstation", title: "Wet Mill Station", icon: <FactoryIcon /> },
      { segment: "dryingstation", title: "Drying Station", icon: <FactoryIcon /> },
      { segment: "drymillstation", title: "Dry Mill Station", icon: <FactoryIcon /> },
      // { segment: "postprocessingstation", title: "Post-Processing Station", icon: <LocalShippingOutlinedIcon /> },

      { kind: "divider" },

      { segment: "postprocessingqcstation", title: "GB QC Station", icon: <NoteAltIcon /> },
    ],
  },

  { kind: "divider" },

  {
    segment: "oms",
    title: "Order Management System",
    icon: <ShoppingCartIcon />,
    children: [
      { segment: "dashboard", title: "OMS Dashboard", icon: <StorefrontIcon /> },
      { segment: "ordercreation", title: "New Order", icon: <AddShoppingCartIcon /> },
    ],
  },

  { kind: "divider" },

  {
    segment: "ims",
    title: "Inventory Management System",
    icon: <WarehouseIcon />,
    children: [
      { segment: "dashboard", title: "IMS Dashboard", icon: <WarehouseIcon /> },
    ],
  },

  { kind: "divider" },
  
  {
    segment: "finance",
    title: "Finance",
    icon: <AttachMoneyIcon />,
    children: [
      { segment: "payment", title: "Payment", icon: <RequestQuoteIcon /> },
      { segment: "expenses", title: "Expenses", icon: <AttachMoneyIcon /> },
    ],
  },
  
  { kind: "divider" },

  { segment: "calendar", title: "Calendar", icon: <CalendarMonthIcon /> },

  { kind: "divider" },

  
  {
    segment: "admin",
    title: "Admin",
    icon: <AdminPanelSettingsIcon />,
    children: [
      { segment: "database", title: "Database", icon: <StorageIcon /> },
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
                // logo: <img src="https://cvxrcxjdirmajmkbiulc.supabase.co/storage/v1/object/sign/assets/favicon%20(1).ico?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJhc3NldHMvZmF2aWNvbiAoMSkuaWNvIiwiaWF0IjoxNzM4NTU1NTU5LCJleHAiOjEwMzc4NTU1NTU5fQ.rqew4VRFFxA7l_Q6sgpYAVOpHkTbG_h9F0CqIKQODd8" alt="Kopi Fabriek" width={32} height={32} />,
                title: "BTM HEQA Platform",
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