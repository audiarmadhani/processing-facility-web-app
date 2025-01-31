"use client";

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import L from "leaflet";
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

  // Load Bali GeoJSON data (you need a GeoJSON file for Bali)
  useEffect(() => {
    const loadBaliGeoJSON = async () => {
      try {
        const response = await fetch("https://cvxrcxjdirmajmkbiulc.supabase.co/storage/v1/object/sign/assets/bali_villages.geojson?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJhc3NldHMvYmFsaV92aWxsYWdlcy5nZW9qc29uIiwiaWF0IjoxNzM4MzA4ODI2LCJleHAiOjQ4OTE5MDg4MjZ9.gbHgxuvbdZSoArJ5gVP2UXrV0Xs6S0-ZGT3R2afhMN4"); // Replace with your GeoJSON file path
        const data = await response.json();
        setBaliGeoJSON(data);
      } catch (error) {
        console.error("Error loading Bali GeoJSON:", error);
      }
    };

    loadBaliGeoJSON();
  }, []);

  // Style function for highlighting covered areas
  const styleFeature = (feature) => {
    const isCovered = coveredAreas.some(
      (area) =>
        area.desa === feature.properties.desa ||
        area.kecamatan === feature.properties.kecamatan ||
        area.kabupaten === feature.properties.kabupaten
    );

    return {
      fillColor: isCovered ? "green" : "gray",
      fillOpacity: 0.7,
      color: "white",
      weight: 1,
    };
  };

  // Handle click events on map features
  const onEachFeature = (feature, layer) => {
    const { desa, kecamatan, kabupaten } = feature.properties;
    layer.bindPopup(
      `<b>Desa:</b> ${desa}<br><b>Kecamatan:</b> ${kecamatan}<br><b>Kabupaten:</b> ${kabupaten}`
    );
  };

  return (
    <div style={{ height: "500px", width: "100%" }}>
      <MapContainer
        center={[-8.4095, 115.1889]} // Center of Bali
        zoom={9} // Zoom level for Bali
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {baliGeoJSON && (
          <GeoJSON
            data={baliGeoJSON}
            style={styleFeature}
            onEachFeature={onEachFeature}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default BaliMap;