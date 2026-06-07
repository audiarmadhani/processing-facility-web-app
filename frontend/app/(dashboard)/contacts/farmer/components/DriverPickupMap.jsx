'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '@mui/material';

const DEFAULT_CENTER = [-8.4095, 115.1889];
const DEFAULT_ZOOM = 10;

const markerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function FitBounds({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;
    const bounds = L.latLngBounds(points.map(([lat, lng]) => [lat, lng]));
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 14 });
  }, [map, points]);

  return null;
}

function formatTimestamp(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
}

function formatWeight(value) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return `${Number(value).toLocaleString()} kg`;
}

function PopupContent({ row }) {
  const hasReceiving = row.batchNumber && row.registered_farmer_name;

  return (
    <div style={{ minWidth: 200, fontSize: 13, lineHeight: 1.45 }}>
      <strong>{row.farmer_name || '—'}</strong>
      {row.farm_name ? <div>{row.farm_name}</div> : null}
      <div>
        {[row.village, row.district].filter(Boolean).join(', ') || '—'}
      </div>
      <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #ddd' }} />
      <div><strong>Arrival:</strong> {formatTimestamp(row.arrival_timestamp)}</div>
      <div><strong>Est. weight:</strong> {formatWeight(row.estimated_weight)}</div>
      <div><strong>Species:</strong> {row.species || '—'}</div>
      <div><strong>Variety:</strong> {row.variety || '—'}</div>
      {row.driver_name ? (
        <div><strong>Driver:</strong> {row.driver_name}</div>
      ) : null}
      <div><strong>Handoff:</strong> {row.handoff_code || '—'}</div>
      <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #ddd' }} />
      {hasReceiving ? (
        <>
          <div><strong>Batch #:</strong> {row.batchNumber}</div>
          <div><strong>Registered farmer:</strong> {row.registered_farmer_name}</div>
          <div><strong>Received weight:</strong> {formatWeight(row.received_weight)}</div>
        </>
      ) : (
        <div><em>Not received yet</em></div>
      )}
    </div>
  );
}

export default function DriverPickupMap({ rows }) {
  const theme = useTheme();

  const validRows = useMemo(
    () =>
      (rows || []).filter((row) => {
        const lat = Number(row.latitude);
        const lng = Number(row.longitude);
        return Number.isFinite(lat) && Number.isFinite(lng);
      }),
    [rows]
  );

  const points = useMemo(
    () => validRows.map((row) => [Number(row.latitude), Number(row.longitude)]),
    [validRows]
  );

  const tileUrl =
    theme.palette.mode === 'dark'
      ? 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png';

  return (
    <div
      style={{
        height: '100%',
        minHeight: 480,
        width: '100%',
        backgroundColor: theme.palette.background.default,
      }}
    >
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        style={{ height: '100%', width: '100%' }}
        zoomControl
        attributionControl={false}
      >
        <TileLayer url={tileUrl} attribution='&copy; CARTO contributors' />
        {points.length > 0 && <FitBounds points={points} />}
        {validRows.map((row) => (
          <Marker
            key={row.id}
            position={[Number(row.latitude), Number(row.longitude)]}
            icon={markerIcon}
          >
            <Popup>
              <PopupContent row={row} />
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
