"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Box, CircularProgress, Typography, useTheme } from "@mui/material";
import { apiUrl } from "../station/_shared/config";

const BALI_CENTER = [-8.4095, 115.1889];
const DEFAULT_ZOOM = 10;

function FitBounds({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;
    const bounds = L.latLngBounds(points.map((p) => [p.latitude, p.longitude]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [points, map]);

  return null;
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatWeight(value) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return `${new Intl.NumberFormat("de-DE").format(Number(value))} kg`;
}

function PickupTooltipContent({ point }) {
  const farmerName = point.linkedToReceiving
    ? point.receivingFarmerName
    : point.driverFarmerName;

  return (
    <Box sx={{ fontSize: 13, lineHeight: 1.45 }}>
      <div><strong>Batch:</strong> {point.batchNumber || "Not linked yet"}</div>
      <div><strong>Farmer:</strong> {farmerName || "—"}</div>
      <div><strong>Farm:</strong> {point.driverFarmName || "—"}</div>
      <div><strong>Weight:</strong> {formatWeight(point.estimatedWeight)}</div>
      <div><strong>Date:</strong> {formatDate(point.arrivalTimestamp || point.createdAt)}</div>
      <div><strong>Location:</strong> {point.village || "—"}, {point.district || "—"}</div>
      {point.handoffCode ? <div><strong>Handoff:</strong> {point.handoffCode}</div> : null}
    </Box>
  );
}

const PickupPointsMap = ({ species, refreshIntervalMs = 0, height = "100%" }) => {
  const theme = useTheme();
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPoints = useCallback(async () => {
    try {
      setError(null);
      const params = new URLSearchParams();
      if (species) params.set("species", species);
      const url = `${apiUrl("/driver-pickups/map")}?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load pickup map (${response.status})`);
      }
      const data = await response.json();
      setPoints(Array.isArray(data.points) ? data.points : []);
    } catch (err) {
      console.error("Error fetching pickup map points:", err);
      setError(err.message || "Failed to load pickup locations.");
      setPoints([]);
    } finally {
      setLoading(false);
    }
  }, [species]);

  useEffect(() => {
    fetchPoints();
  }, [fetchPoints]);

  useEffect(() => {
    if (!refreshIntervalMs || refreshIntervalMs < 1000) return undefined;
    const timer = setInterval(fetchPoints, refreshIntervalMs);
    return () => clearInterval(timer);
  }, [fetchPoints, refreshIntervalMs]);

  const markerColors = useMemo(
    () => ({
      linked: theme.palette.success.main,
      unlinked: theme.palette.warning.main,
    }),
    [theme]
  );

  const tileUrl =
    theme.palette.mode === "dark"
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: height === "100%" ? 400 : height }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: height === "100%" ? 400 : height, px: 2 }}>
        <Typography variant="body2" color="error" align="center">
          {error}
        </Typography>
      </Box>
    );
  }

  if (points.length === 0) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: height === "100%" ? 400 : height }}>
        <Typography variant="body2" color="text.secondary">
          No pickup GPS points recorded yet{species ? ` for ${species}` : ""}.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height, width: "100%", minHeight: 300 }}>
      <MapContainer
        center={BALI_CENTER}
        zoom={DEFAULT_ZOOM}
        style={{ height: "100%", width: "100%", backgroundColor: theme.palette.background.default }}
        zoomControl
        attributionControl={false}
      >
        <TileLayer url={tileUrl} attribution='&copy; <a href="https://carto.com/">CARTO</a>' />
        <FitBounds points={points} />
        {points.map((point) => {
          const color = point.linkedToReceiving ? markerColors.linked : markerColors.unlinked;
          return (
            <CircleMarker
              key={point.id}
              center={[point.latitude, point.longitude]}
              radius={point.linkedToReceiving ? 8 : 6}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: point.linkedToReceiving ? 0.85 : 0.35,
                weight: point.linkedToReceiving ? 2 : 1.5,
              }}
            >
              <Tooltip sticky direction="auto">
                <PickupTooltipContent point={point} />
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </Box>
  );
};

export default PickupPointsMap;
