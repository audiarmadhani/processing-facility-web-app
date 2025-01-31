"use client";

import React, { useEffect, useState } from "react";
import { MapContainer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const BaliMap = () => {
  const [coveredAreas, setCoveredAreas] = useState([]);
  const [baliGeoJSON, setBaliGeoJSON] = useState([]);

  // Fetch farmer data from the API
  useEffect(() => {
    const fetchFarmerData = async () => {
      try {
        const response = await fetch(
          "https://processing-facility-backend.onrender.com/api/farmer"
        );
        const data = await response.json();
        const covered = data.allRows.map((farmer) => ({
          desa: farmer.desa,
          kecamatan: farmer.kecamatan,
          kabupaten: farmer.kabupaten,
        }));
        setCoveredAreas(covered);
      } catch (error) {
        console.error("Error fetching farmer data:", error);
      }
    };

    fetchFarmerData();
  }, []);

  // Load Bali GeoJSON data
  useEffect(() => {
    const loadBaliGeoJSON = async () => {
      try {
        const response = await fetch("https://cvxrcxjdirmajmkbiulc.supabase.co/storage/v1/object/sign/assets/bali_villages.geojson?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJhc3NldHMvYmFsaV92aWxsYWdlcy5nZW9qc29uIiwiaWF0IjoxNzM4MzA5MjY1LCJleHAiOjQ4OTE5MDkyNjV9.CwU9ps72ntnaG2Z_bDieyzxZxFj98KnEZH5luLCZpyI"); // Replace with your GeoJSON file path
        const data = await response.json();
        setBaliGeoJSON(data);
      } catch (error) {
        console.error("Error loading Bali GeoJSON:", error);
      }
    };

    loadBaliGeoJSON();
  }, []);

  // Style function for village borders
  const styleFeature = (feature) => {
    const isCovered = coveredAreas.some(
      (area) =>
        area.desa === feature.properties.village ||
        area.kecamatan === feature.properties.sub_district ||
        area.kabupaten === feature.properties.district
    );

    return {
      fillColor: isCovered ? "green" : "transparent", // Highlight covered areas in green
      fillOpacity: 0.5, // Semi-transparent fill
      color: "#333", // Border color
      weight: 1, // Border thickness
    };
  };

  return (
    <div style={{ height: "500px", width: "100%", backgroundColor: "#f0f0f0" }}>
      <MapContainer
        center={[-8.4095, 115.1889]} // Center of Bali
        zoom={9} // Zoom level for Bali
        style={{ height: "100%", width: "100%", backgroundColor: "#f0f0f0" }}
        zoomControl={false} // Disable zoom controls
        attributionControl={false} // Disable attribution
      >
        {baliGeoJSON.map((feature, index) => (
          <GeoJSON
            key={index}
            data={{
              type: "Feature",
              properties: feature.properties,
              geometry: {
                type: "Polygon",
                coordinates: feature.border,
              },
            }}
            style={styleFeature}
          />
        ))}
      </MapContainer>
    </div>
  );
};

export default BaliMap;