"use client";

import React, { useEffect, useState } from "react";
import { MapContainer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const BaliMap = () => {
  const [baliGeoJSON, setBaliGeoJSON] = useState(null);

  // Load Bali GeoJSON data (only outline and villages)
  useEffect(() => {
    const loadBaliGeoJSON = async () => {
      try {
        const response = await fetch(
          "https://cvxrcxjdirmajmkbiulc.supabase.co/storage/v1/object/sign/assets/bali_villages_minified.geojson?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJhc3NldHMvYmFsaV92aWxsYWdlc19taW5pZmllZC5nZW9qc29uIiwiaWF0IjoxNzM4Mzk1Njk2LCJleHAiOjQ4OTE5OTU2OTZ9.P1jXPEYeltq9HFoS92-_6MJX7ar1mfKSSfqzA2Futjs"
        );
        const villages = await response.json();

        if (Array.isArray(villages)) {
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
                coordinates: [village.border], // Ensure it’s correctly formatted
              },
            })),
          };

          setBaliGeoJSON(geoJsonData);
        } else {
          console.error("Unexpected data format:", villages);
        }
      } catch (error) {
        console.error("Error loading Bali GeoJSON:", error);
      }
    };

    loadBaliGeoJSON();
  }, []);

  // Style function for village borders
  const styleFeature = () => ({
    fillColor: "transparent", // No fill color
    color: "#000", // Black border for villages
    weight: 1,
  });

  return (
    <div style={{ height: "500px", width: "100%", backgroundColor: "#f0f0f0" }}>
      <MapContainer
        center={[-8.4095, 115.1889]}
        zoom={9}
        style={{ height: "100%", width: "100%", backgroundColor: "#f0f0f0" }}
        zoomControl={false}
        attributionControl={false}
      >
        {/* Render GeoJSON Data (Bali Outline & Villages) */}
        {baliGeoJSON && <GeoJSON data={baliGeoJSON} style={styleFeature} />}
      </MapContainer>
    </div>
  );
};

export default BaliMap;