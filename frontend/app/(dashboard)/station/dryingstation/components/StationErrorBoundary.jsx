'use client';

import React from 'react';
import { Button, Typography, Card } from '@mui/material';

export default class StationErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card variant="outlined" sx={{ p: 2, m: 2 }}>
          <Typography color="error">
            Something went wrong: {this.state.error?.message || 'Unknown error'}
          </Typography>
          <Button onClick={() => this.setState({ hasError: false, error: null })}>Retry</Button>
        </Card>
      );
    }
    return this.props.children;
  }
}
