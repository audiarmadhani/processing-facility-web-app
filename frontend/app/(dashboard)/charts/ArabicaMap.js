"use client";

import React, { useEffect, useState } from "react";
import { MapContainer, GeoJSON, TileLayer, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Box, Typography, CircularProgress } from "@mui/material";

const ArabicaMapComponent = () => {
  const [baliGeoJSON, setBaliGeoJSON] = useState(null);
  const [desaData, setDesaData] = useState({}); // Store total farmers, land area, total value, and total weight per desa
  const [loading, setLoading] = useState(true);

  // Fetch farmer data and calculate aggregated info
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch farmer data
        const farmerResponse = await fetch(
          "https://processing-facility-backend.onrender.com/api/farmer"
        );
        const farmerData = await farmerResponse.json();

        // Fetch receiving data
        const receivingResponse = await fetch(
          "https://processing-facility-backend.onrender.com/api/receiving"
        );
        const receivingData = await receivingResponse.json();

        // Log the receiving data to check its structure
        console.log("Receiving Data:", receivingData);

        // Create a map of farmerID to receiving data (price and weight) for quick lookup
        const receivingMap = receivingData.allRows.reduce((acc, receiving) => {
          acc[receiving.farmerID] = {
            price: parseFloat(receiving.price) || 0,
            weight: parseFloat(receiving.weight) || 0,
          };
          return acc;
        }, {});

        // Log the receivingMap to check its structure
        console.log("Receiving Map:", receivingMap);

        // Aggregate data by desa
        const aggregatedData = farmerData.arabicaFarmers.reduce((acc, farmer) => {
          if (farmer.farmType === "Arabica") {
            const desaName = farmer.desa;
            if (!acc[desaName]) {
              acc[desaName] = {
                farmerCount: 0,
                totalLandArea: 0,
                totalValue: 0,
                totalWeight: 0,
              };
            }
            acc[desaName].farmerCount += 1;
            acc[desaName].totalLandArea += parseFloat(farmer.farmerLandArea) || 0;

            // Add value and weight if available in the receivingMap
            if (receivingMap[farmer.farmerID]) {
              const { price, weight } = receivingMap[farmer.farmerID];
              acc[desaName].totalValue += price * weight;
              acc[desaName].totalWeight += weight;
            }
          }
          return acc;
        }, {});

        // Log the aggregated data to check its structure
        console.log("Aggregated Data:", aggregatedData);

        // Calculate average price per unit weight per desa
        for (const desaName in aggregatedData) {
          const { totalValue, totalWeight } = aggregatedData[desaName];
          aggregatedData[desaName].averagePrice =
            totalWeight > 0 ? (totalValue / totalWeight).toFixed(2) : 0;
        }

        // Log the final desa data to check the average price
        console.log("Final Desa Data:", aggregatedData);

        setDesaData(aggregatedData);
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

    Promise.all([fetchData(), loadBaliGeoJSON()]).then(() => setLoading(false));
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

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 500 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (Object.keys(desaData).length === 0) {
    return (
      <Box sx={{ textAlign: "center", padding: 2 }}>
        <Typography variant="h6">No data available</Typography>
      </Box>
    );
  }

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
                const { farmerCount, totalLandArea, averagePrice } = desaData[desaName];
                const tooltipContent = `
                  <strong>Desa:</strong> ${desaName}<br/>
                  <strong>Total Farmers:</strong> ${farmerCount}<br/>
                  <strong>Total Land Area:</strong> ${totalLandArea} m²<br/>
                  <strong>Average Price (/kg):</strong> Rp${averagePrice}
                `;
                layer.bindTooltip(tooltipContent, {
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
              }
            }}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default ArabicaMapComponent;