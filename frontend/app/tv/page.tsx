"use client";

import React, { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Box, Card, CardContent, CircularProgress, Grid, Typography } from "@mui/material";
import { apiUrl } from "../(dashboard)/station/_shared/config";

const PickupPointsMap = dynamic(
  () => import("../(dashboard)/charts/PickupPointsMap"),
  { ssr: false, loading: () => <CircularProgress /> }
);

const REFRESH_MS = 60_000;

const DEFAULT_METRICS = {
  totalArabicaWeight: 0,
  totalRobustaWeight: 0,
  totalBatches: 0,
  activeFarmers: 0,
  pendingQC: 0,
  pendingProcessing: 0,
};

function formatWeight(value: number) {
  const numeric = Number(value) || 0;
  return `${new Intl.NumberFormat("de-DE").format(numeric)} kg`;
}

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card variant="outlined" sx={{ height: "100%", bgcolor: "rgba(255,255,255,0.04)" }}>
      <CardContent sx={{ py: 2 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {label}
        </Typography>
        <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function TvDashboardPage() {
  const [metrics, setMetrics] = useState(DEFAULT_METRICS);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl("/dashboard-metrics")}?timeframe=this_month`);
      if (!response.ok) return;
      const data = await response.json();
      setMetrics({
        totalArabicaWeight: data.totalArabicaWeight ?? 0,
        totalRobustaWeight: data.totalRobustaWeight ?? 0,
        totalBatches: data.totalBatches ?? 0,
        activeFarmers: data.activeFarmers ?? 0,
        pendingQC: data.pendingQC ?? 0,
        pendingProcessing: data.pendingProcessing ?? 0,
      });
      setLastUpdated(new Date());
    } catch (err) {
      console.error("TV dashboard metrics fetch failed:", err);
    } finally {
      setLoadingMetrics(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    const timer = setInterval(fetchMetrics, REFRESH_MS);
    return () => clearInterval(timer);
  }, [fetchMetrics]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        p: { xs: 1.5, md: 2 },
        gap: 2,
        bgcolor: "background.default",
        overflow: "hidden",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          BTM HEQA — Live Pickup Map
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {lastUpdated
            ? `Updated ${lastUpdated.toLocaleTimeString("id-ID")}`
            : loadingMetrics
              ? "Loading…"
              : "—"}
        </Typography>
      </Box>

      <Grid container spacing={2} sx={{ flexShrink: 0 }}>
        <Grid item xs={6} sm={4} md={2}>
          <KpiCard label="Arabica (month)" value={formatWeight(metrics.totalArabicaWeight)} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KpiCard label="Robusta (month)" value={formatWeight(metrics.totalRobustaWeight)} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KpiCard label="Total batches" value={metrics.totalBatches} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KpiCard label="Active farmers" value={metrics.activeFarmers} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KpiCard label="Pending QC" value={metrics.pendingQC} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KpiCard label="Pending processing" value={metrics.pendingProcessing} />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ flex: 1, minHeight: 0 }}>
        <Grid item xs={12} md={6} sx={{ height: { xs: "38vh", md: "100%" }, minHeight: 280 }}>
          <Card variant="outlined" sx={{ height: "100%", bgcolor: "rgba(255,255,255,0.03)" }}>
            <CardContent sx={{ height: "100%", display: "flex", flexDirection: "column", pb: "16px !important" }}>
              <Typography variant="h6" gutterBottom>
                Arabica Pickup Locations
              </Typography>
              <Box sx={{ flex: 1, minHeight: 0 }}>
                <PickupPointsMap species="Arabica" refreshIntervalMs={REFRESH_MS} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6} sx={{ height: { xs: "38vh", md: "100%" }, minHeight: 280 }}>
          <Card variant="outlined" sx={{ height: "100%", bgcolor: "rgba(255,255,255,0.03)" }}>
            <CardContent sx={{ height: "100%", display: "flex", flexDirection: "column", pb: "16px !important" }}>
              <Typography variant="h6" gutterBottom>
                Robusta Pickup Locations
              </Typography>
              <Box sx={{ flex: 1, minHeight: 0 }}>
                <PickupPointsMap species="Robusta" refreshIntervalMs={REFRESH_MS} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
