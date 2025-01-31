"use client";

import React, { useEffect, useState } from "react";
import { MapContainer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const BaliMap = () => {
  const [baliGeoJSON, setBaliGeoJSON] = useState(null);

  // Load Bali GeoJSON data
  useEffect(() => {
    const loadBaliGeoJSON = async () => {
      try {
        const response = await fetch(
        "https://cvxrcxjdirmajmkbiulc.supabase.co/storage/v1/object/sign/assets/bali_villages.geojson?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJhc3NldHMvYmFsaV92aWxsYWdlcy5nZW9qc29uIiwiaWF0IjoxNzM4MzA5MjY1LCJleHAiOjQ4OTE5MDkyNjV9.CwU9ps72ntnaG2Z_bDieyzxZxFj98KnEZH5luLCZpyI"
        );
        const villages = await response.json();

        // Convert to valid GeoJSON structure
        const geoJsonData = {
          type: "FeatureCollection",
          features: villages.map((village) => ({
            type: "Feature",
            properties: {
              village: village.village,
              sub_district: village.sub_district,
              district: village.district,
            },
            geometry: {
              type: "Polygon",
              coordinates: [village.border], // Ensure it's a properly nested array
            },
          })),
        };

        setBaliGeoJSON(geoJsonData);
      } catch (error) {
        console.error("Error loading Bali GeoJSON:", error);
      }
    };

    loadBaliGeoJSON();
  }, []);

  // Style function for village borders (outline only)
  const styleFeature = () => ({
    fillColor: "transparent", // No fill color
    fillOpacity: 0, // Fully transparent
    color: "#000", // Black outline
    weight: 1, // Thin border
  });

  return (
    <div style={{ height: "500px", width: "100%", backgroundColor: "#f0f0f0" }}>
      <MapContainer
        center={[-8.4095, 115.1889]} // Center of Bali
        zoom={9} // Zoom level for Bali
        style={{ height: "100%", width: "100%", backgroundColor: "#f0f0f0" }}
        zoomControl={false} // Disable zoom controls
        attributionControl={false} // Disable attribution
      >
        {/* Render GeoJSON Data (only village borders) */}
        {baliGeoJSON && <GeoJSON data={baliGeoJSON} style={styleFeature} />}
      </MapContainer>
    </div>
  );
};

export default BaliMap;