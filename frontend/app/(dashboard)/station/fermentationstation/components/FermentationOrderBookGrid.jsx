'use client';

import { Typography, Button, Card, CardContent, Tabs, Tab } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';

export default function FermentationOrderBookGrid({ book }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Fermentation Batches
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={book.fetchFermentationData}
          style={{ marginBottom: '16px' }}
        >
          Refresh Data
        </Button>
        <Tabs
          value={book.tabValue}
          onChange={(e, newValue) => book.setTabValue(newValue)}
          sx={{ marginBottom: '16px' }}
        >
          <Tab label="All Tank" value="All Tank" />
          <Tab label="Biomaster" value="Biomaster" />
          <Tab label="Carrybrew" value="Carrybrew" />
          <Tab label="Washing Track" value="Washing Track" />
          <Tab label="BB" value="Blue Barrel" />
          <Tab label="Bucket" value="Fermentation Bucket" />
          <Tab label="None" value="none" />
        </Tabs>
        <div style={{ height: 800, width: '100%' }}>
          <DataGrid
            rows={book.fermentationData.filter((row) => {
              if (book.tabValue === 'All Tank') {
                return true;
              }
              if (book.tabValue === 'Blue Barrel') {
                return row.tank?.startsWith('BB-');
              }
              if (book.tabValue === 'Fermentation Bucket') {
                return row.tank?.startsWith('BUC-');
              }
              if (book.tabValue === 'none') {
                return row.preStorage === 'yes' && (!row.tank || row.tank === '');
              }
              return row.tank === book.tabValue;
            })}
            columns={book.fermentationColumns}
            pageSize={5}
            slots={{ toolbar: GridToolbar }}
            autosizeOnMount
            autosizeOptions={{
              includeHeaders: true,
              includeOutliers: true,
              expand: true,
            }}
            rowHeight={35}
          />
        </div>
      </CardContent>
    </Card>
  );
}
