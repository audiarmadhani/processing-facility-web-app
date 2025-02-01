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
          kabupaten: farmer.kecamatan,
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
          "https://cvxrcxjdirmajmkbiulc.supabase.co/storage/v1/object/sign/assets/bali_villages_minified.geojson?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJhc3NldHMvYmFsaV92aWxsYWdlc19taW5pZmllZC5nZW9qc29uIiwiaWF0IjoxNzM4Mzk1MDY5LCJleHAiOjQ4OTE5OTUwNjl9.sjFW0RqmWJoOBTxnL2cyc273vHQgsZYF-7jcubP6sz4"
        );
        const villages = await response.json();

        // Check if the data is an array and handle it accordingly
        if (Array.isArray(villages)) {
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
                coordinates: [
                  [
                    ...(village.border ? village.border.map(([lng, lat]) => [lat, lng]) : []), // Swap lat/lng and check if border exists
                    // Ensure the first and last points are the same to close the polygon
                    ...(village.border && village.border.length ? [village.border[0].map(([lng, lat]) => [lat, lng])] : [])
                  ],
                ],
              },
            })),
          };

          setBaliGeoJSON(geoJsonData);
        } else {
          console.error("Unexpected data format for villages:", villages);
        }
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
        {/* Base Map Layer */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Render GeoJSON Data */}
        {baliGeoJSON && <GeoJSON data={baliGeoJSON} style={styleFeature} />}
      </MapContainer>
    </div>
  );
};

export default BaliMap;