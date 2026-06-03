'use client';

import { Typography, Button, Card, CardContent, Tabs, Tab } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { BAG_TANK, getRowTanks } from '../constants';

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
          <Tab label="Bag" value={BAG_TANK} />
          <Tab label="None" value="none" />
        </Tabs>
        <div style={{ height: 800, width: '100%' }}>
          <DataGrid
            rows={book.fermentationData.filter((row) => {
              const rowTanks = getRowTanks(row);
              if (book.tabValue === 'All Tank') {
                return true;
              }
              if (book.tabValue === 'Blue Barrel') {
                return rowTanks.some((t) => t.startsWith('BB-'));
              }
              if (book.tabValue === 'Fermentation Bucket') {
                return rowTanks.some((t) => t.startsWith('BUC-'));
              }
              if (book.tabValue === BAG_TANK) {
                return rowTanks.includes(BAG_TANK);
              }
              if (book.tabValue === 'none') {
                return row.preStorage === 'yes' && rowTanks.length === 0;
              }
              return rowTanks.includes(book.tabValue);
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
