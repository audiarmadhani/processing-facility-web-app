"use client";

import React, { useEffect, useState } from "react";
import { MapContainer, GeoJSON, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const BaliMap = () => {
  const [coveredAreas, setCoveredAreas] = useState([]);
  const [baliGeoJSON, setBaliGeoJSON] = useState(null);

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
          const response = await fetch(
            "https://cvxrcxjdirmajmkbiulc.supabase.co/storage/v1/object/sign/assets/bali_villages.geojson?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJhc3NldHMvYmFsaV92aWxsYWdlcy5nZW9qc29uIiwiaWF0IjoxNzM4MzA5MjY1LCJleHAiOjQ4OTE5MDkyNjV9.CwU9ps72ntnaG2Z_bDieyzxZxFj98KnEZH5luLCZpyI"          );
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
                coordinates: [village.border], // Ensure it's wrapped in an extra array
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

  // Style function for village borders
  const styleFeature = (feature) => {
    const { village, sub_district, district } = feature.properties;

    const isCovered = coveredAreas.some(
      (area) =>
        area.desa === village ||
        area.kecamatan === sub_district ||
        area.kabupaten === district
    );

    return {
      fillColor: isCovered ? "green" : "transparent", // Highlight covered villages in green
      fillOpacity: isCovered ? 0.5 : 0, // Semi-transparent for mapped areas, invisible otherwise
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
        {/* Plain White Background */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
          attribution="&copy; <a href='https://carto.com/'>CARTO</a>"
        />

        {/* Render GeoJSON Data */}
        {baliGeoJSON && <GeoJSON data={baliGeoJSON} style={styleFeature} />}
      </MapContainer>
    </div>
  );
};

export default BaliMap;