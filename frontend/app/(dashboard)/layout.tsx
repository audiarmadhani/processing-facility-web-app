import * as React from 'react';
import { DashboardLayout } from '@toolpad/core/DashboardLayout';
import { PageContainer } from '@toolpad/core/PageContainer';
import SidebarFooterAccount, { ToolbarAccountOverride } from './SidebarFooterAccount';
import FermentationCheckInGlobalBanner from './station/fermentationstation/components/FermentationCheckInGlobalBanner';

export default function Layout(props: { children: React.ReactNode }) {
  return (
    <DashboardLayout
      slots={{
        toolbarAccount: ToolbarAccountOverride,
        sidebarFooter: SidebarFooterAccount,
      }}
    >
      <PageContainer maxWidth={false}>
        <FermentationCheckInGlobalBanner />
        {props.children}
      </PageContainer>
    </DashboardLayout>
  );
}