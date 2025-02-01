"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

// Dynamically import the map components with no SSR
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const GeoJSON = dynamic(
  () => import("react-leaflet").then((mod) => mod.GeoJSON),
  { ssr: false }
);

const ArabicaMapComponent = () => {
  const [baliGeoJSON, setBaliGeoJSON] = useState(null);
  const [desaStats, setDesaStats] = useState(new Map());
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    setMapReady(true);
  }, []);

  // Fetch farmer data and process statistics
  useEffect(() => {
    const fetchFarmerData = async () => {
      try {
        const response = await fetch(
          "https://processing-facility-backend.onrender.com/api/farmer"
        );
        const data = await response.json();

        // Process farmer data to group by desa
        const statsMap = new Map();
        data.allRows.forEach((farmer) => {
          if (!statsMap.has(farmer.desa)) {
            statsMap.set(farmer.desa, {
              totalFarmers: 0,
              totalLandArea: 0,
            });
          }
          const stats = statsMap.get(farmer.desa);
          stats.totalFarmers += 1;
          stats.totalLandArea += farmer.farmerLandArea || 0;
        });

        setDesaStats(statsMap);
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
          "https://cvxrcxjdirmajmkbiulc.supabase.co/storage/v1/object/sign/assets/bali_villages_minified.geojson?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJhc3NldHMvYmFsaV92aWxsYWdlc19taW5pZmllZC5nZW9qc29uIiwiaWF0IjoxNzM4Mzk2NTAxLCJleHAiOjMzMjc0Mzk2NTAxfQ.4xAAjVFAwg2x-IuLba2lFlK3L_rb-GhyERWdvFXL3wo"
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
                coordinates: [village.border],
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
  const styleFeature = (feature) => {
    const desaName = feature.properties.village;
    const hasData = desaStats.has(desaName);

    return {
      fillColor: hasData ? "green" : "transparent",
      fillOpacity: 0.5,
      color: "#808080",
      weight: 0.25,
    };
  };

  // Function to handle popup content for each feature
  const onEachFeature = (feature, layer) => {
    const desaName = feature.properties.village;
    const stats = desaStats.get(desaName);
    
    if (stats) {
      layer.bindTooltip(
        `<div class="p-2">
          <strong>${desaName}</strong><br/>
          Total Farmers: ${stats.totalFarmers}<br/>
          Total Land Area: ${stats.totalLandArea.toLocaleString()} m²
        </div>`,
        {
          permanent: false,
          direction: 'top',
          className: 'custom-tooltip'
        }
      );
    }
  };

  if (!mapReady) {
    return <div className="p-4">Initializing map...</div>;
  }

  return (
    <div className="w-full h-[500px] bg-gray-100 rounded-lg shadow-md overflow-hidden">
      <MapContainer
        center={[-8.4095, 115.1889]}
        zoom={9}
        className="h-full w-full"
        zoomControl={false}
        attributionControl={false}
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

export default ArabicaMapComponent;