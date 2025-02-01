"use client";
import React, { useEffect, useState } from "react";
import { MapContainer, GeoJSON, TileLayer, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Box, Typography, CircularProgress } from "@mui/material";

const ArabicaMapComponent = () => {
  const [baliGeoJSON, setBaliGeoJSON] = useState(null);
  const [desaData, setDesaData] = useState({}); // Store total farmers, land area, total price, and total weight per desa
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const farmerResponse = await fetch(
          "https://processing-facility-backend.onrender.com/api/farmer"
        );
        const farmerData = await farmerResponse.json();
        const receivingResponse = await fetch(
          "https://processing-facility-backend.onrender.com/api/receiving"
        );
        const receivingData = await receivingResponse.json();

        const receivingMap = receivingData.allRows.reduce((acc, receiving) => {
          acc[receiving.farmerID] = {
            price: receiving.price || 0,
            weight: receiving.weight || 0,
          };
          return acc;
        }, {});

        const aggregatedData = farmerData.arabicaFarmers.reduce((acc, farmer) => {
          if (farmer.farmType === "Arabica") {
            const desaName = farmer.desaName; // Assuming 'desaName' is a property in the farmer data
            acc[desaName] = acc[desaName] || { farmerCount: 0, totalLandArea: 0, totalPrice: 0, totalWeight: 0 };
            acc[desaName].farmerCount += 1;
            acc[desaName].totalLandArea += farmer.landArea;
            if (receivingMap[farmer.farmerID]) {
              acc[desaName].totalPrice += receivingMap[farmer.farmerID].price * receivingMap[farmer.farmerID].weight;
              acc[desaName].totalWeight += receivingMap[farmer.farmerID].weight;
            }
          }
          return acc;
        }, {});

        // Calculate average price per unit weight
        Object.keys(aggregatedData).forEach(desaName => {
          if (aggregatedData[desaName].totalWeight > 0) {
            aggregatedData[desaName].averagePrice = Math.round(
              (aggregatedData[desaName].totalPrice / aggregatedData[desaName].totalWeight) * 100
            ) / 100;
          } else {
            aggregatedData[desaName].averagePrice = 0;
          }
        });

        setDesaData(aggregatedData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    const loadBaliGeoJSON = async () => {
      try {
          await fetch("https://cvxrcxjdirmajmkbiulc.supabase.co/storage/v1/object/sign/assets/bali_villages_minified.geojson?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJhc3NldHMvYmFsaV92aWxsYWdlc19taW5pZmllZC5nZW9qc29uIiwiaWF0IjoxNzM4Mzk2NTAxLCJleHAiOjMzMjc0Mzk2NTAxfQ.4xAAjVFAwg2x-IuLba2lFlK3L_rb-GhyERWdvFXL3wo")
          .then(response => response.json())
          .then(data => setBaliGeoJSON(data));
      } catch (error) {
        console.error("Error loading Bali GeoJSON:", error);
      }
    };

    Promise.all([fetchData(), loadBaliGeoJSON()]).then(() => setLoading(false));
  }, []);

  const styleFeature = (feature) => {
    const desaName = feature.properties.village;
    return {
      fillColor: aggregatedData[desaName] ? "green" : "transparent",
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
                const { farmerCount, totalLandArea, averagePrice } = aggregatedData[desaName];
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