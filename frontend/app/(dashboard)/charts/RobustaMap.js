"use client";

import React, { useEffect, useState } from "react";
import { MapContainer, GeoJSON, TileLayer, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const RobustaMapComponent = () => {
  const [baliGeoJSON, setBaliGeoJSON] = useState(null);
  const [desaData, setDesaData] = useState({}); // Store total farmers and land area per desa

  // Fetch farmer data and calculate aggregated info
  useEffect(() => {
    const fetchFarmerData = async () => {
      try {
        const response = await fetch(
          "https://processing-facility-backend.onrender.com/api/farmer"
        );
        const data = await response.json();

        // Aggregate farmer count and land area per desa
        const aggregatedData = data.robustaFarmers.reduce((acc, farmer) => {
          if (farmer.farmType === "Robusta") {
            const desaName = farmer.desa;
            if (!acc[desaName]) {
              acc[desaName] = { farmerCount: 0, totalLandArea: 0 };
            }
            acc[desaName].farmerCount += 1;
            acc[desaName].totalLandArea += farmer.farmerLandArea || 0;
          }
          return acc;
        }, {});

        setDesaData(aggregatedData);
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

    return {
      fillColor: desaData[desaName] ? "green" : "transparent",
      fillOpacity: 0.5,
      color: "#808080",
      weight: 0.25,
    };
  };

  return (
    <div style={{ height: "500px", width: "100%", backgroundColor: "#f0f0f0" }}>
      <MapContainer
        center={[-8.4095, 115.1889]}
        zoom={9}
        style={{ height: "100%", width: "100%", backgroundColor: "#f0f0f0" }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a> contributors'
        />

        {baliGeoJSON && (
          <GeoJSON
            data={baliGeoJSON}
            style={styleFeature}
            onEachFeature={(feature, layer) => {
              const desaName = feature.properties.village;
              if (desaData[desaName]) {
                const { farmerCount, totalLandArea } = desaData[desaName];

                layer.bindTooltip(
                  `Desa: ${desaName}<br/>Total Farmers: ${farmerCount}<br/>Total Land Area: ${totalLandArea} m²`,
                  {
                    sticky: true, // Tooltip follows cursor
                    direction: "auto",
                    className: "leaflet-tooltip-custom",
                  }
                );
              }
            }}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default RobustaMapComponent;