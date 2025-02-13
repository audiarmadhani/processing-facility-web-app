"use client";

import React, { useEffect, useState } from "react";
import { MapContainer, GeoJSON, TileLayer, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Box, Typography, CircularProgress, useTheme } from "@mui/material";

const RobustaMapComponent = () => {
  const [baliGeoJSON, setBaliGeoJSON] = useState(null);
  const [locationData, setLocationData] = useState({});
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const farmerResponse = await fetch("https://processing-facility-backend.onrender.com/api/farmer");
        const farmerData = await farmerResponse.json();

        const receivingResponse = await fetch("https://processing-facility-backend.onrender.com/api/receiving");
        const receivingData = await receivingResponse.json();

        const receivingMap = receivingData.allRows.reduce((acc, receiving) => {
          acc[receiving.farmerID] = {
            price: parseFloat(receiving.price) || 0,
            weight: parseFloat(receiving.weight) || 0,
          };
          return acc;
        }, {});

        const aggregatedData = farmerData.robustaFarmers.reduce((acc, farmer) => {
          if (farmer.farmType === "Robusta") {
            const kecamatanName = farmer.kecamatan?.toUpperCase() || "UNKNOWN"; // Handle missing kec.
            const desaName = farmer.desa?.toUpperCase() || "UNKNOWN";       // Handle missing desa

            if (!acc[kecamatanName]) {
              acc[kecamatanName] = {};
            }
            if (!acc[kecamatanName][desaName]) {
              acc[kecamatanName][desaName] = {
                farmerCount: 0,
                totalLandArea: 0,
                totalValue: 0,
                totalWeight: 0,
              };
            }

            acc[kecamatanName][desaName].farmerCount += 1;
            acc[kecamatanName][desaName].totalLandArea += parseFloat(farmer.farmerLandArea) || 0;

            if (receivingMap[farmer.farmerID]) {
              const { price, weight } = receivingMap[farmer.farmerID];
              acc[kecamatanName][desaName].totalValue += price * weight;
              acc[kecamatanName][desaName].totalWeight += weight;
            }
          }
          return acc;
        }, {});

        for (const kecamatanName in aggregatedData) {
          for (const desaName in aggregatedData[kecamatanName]) {
            const { totalValue, totalWeight } = aggregatedData[kecamatanName][desaName];
            aggregatedData[kecamatanName][desaName].averagePrice =
              totalWeight > 0 ? (totalValue / totalWeight).toFixed(2) : 0;
          }
        }

        setLocationData(aggregatedData);
        console.log("Location Data:", aggregatedData);

      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

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
                village: village.village?.toUpperCase() || "UNKNOWN",
                sub_district: village.sub_district?.toUpperCase() || "UNKNOWN",
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

    Promise.all([fetchData(), loadBaliGeoJSON()]).then(() => setLoading(false));
  }, []);

  const styleFeature = (feature) => {
    const kecamatanName = feature.properties.sub_district;
    const desaName = feature.properties.village;

    return {
      fillColor: locationData[kecamatanName] && locationData[kecamatanName][desaName] ? "green" : "transparent",
      fillOpacity: 0.5,
      color: theme.palette.mode === 'dark' ? "#444" : "#808080",
      weight: 0.25,
    };
  };

  const tooltipContent = (kecamatanName, desaName) => {
    const data = locationData[kecamatanName] && locationData[kecamatanName][desaName]; // Check if data exists

    if (data) {
      const { farmerCount, totalLandArea, averagePrice } = data;
      return `
        <strong>Kecamatan:</strong> ${kecamatanName}<br/>
        <strong>Desa:</strong> ${desaName}<br/>
        <strong>Total Farmers:</strong> ${farmerCount}<br/>
        <strong>Total Land Area:</strong> ${totalLandArea} m²<br/>
        <strong>Average Price (/kg):</strong> Rp${averagePrice}
      `;
    }
    return `<strong>Kecamatan:</strong> ${kecamatanName}<br/><strong>Desa:</strong> ${desaName} (No Data)`;
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 500 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div style={{ height: "500px", width: "100%", backgroundColor: theme.palette.background.default }}>
      <MapContainer
        center={[-8.4095, 115.1889]}
        zoom={10}
        style={{ height: "100%", width: "100%", backgroundColor: theme.palette.background.default }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url={
            theme.palette.mode === 'dark'
              ? "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
              : "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
          }
          attribution='&copy; <a href="https://carto.com/">CARTO</a> contributors'
        />
        {baliGeoJSON && (
          <GeoJSON
            data={baliGeoJSON}
            style={styleFeature}
            onEachFeature={(feature, layer) => {
              const kecamatanName = feature.properties.sub_district;
              const desaName = feature.properties.village;

              layer.bindTooltip(tooltipContent(kecamatanName, desaName), {
                direction: "auto",
                className: "leaflet-tooltip-custom",
                sticky: true,
                opacity: 1,
              });
              layer.on("mouseover", function (e) {
                this.openTooltip();
              });
              layer.on("mouseout", function (e) {
                this.closeTooltip();
              });
            }}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default RobustaMapComponent;