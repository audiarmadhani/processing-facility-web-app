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
const ZoomControl = dynamic(
  () => import("react-leaflet").then((mod) => mod.ZoomControl),
  { ssr: false }
);

const BaliMap = ({ apiUrl, geoJsonUrl }) => {
  const [coveredAreas, setCoveredAreas] = useState([]);
  const [baliGeoJSON, setBaliGeoJSON] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    setMapReady(true);
  }, []);

  // Fetch farmer data from the API
  useEffect(() => {
    const fetchFarmerData = async () => {
      try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const covered = data.allRows.map((farmer) => ({
          desa: farmer.desa?.toLowerCase(),
          kecamatan: farmer.kecamatan?.toLowerCase(),
          kabupaten: farmer.kabupaten?.toLowerCase(),
        }));
        setCoveredAreas(covered);
      } catch (error) {
        console.error("Error fetching farmer data:", error);
        setError("Failed to load farmer data");
      }
    };

    if (apiUrl) {
      fetchFarmerData();
    }
  }, [apiUrl]);

  // Process coordinates to handle both single and nested arrays
  const processCoordinates = (border) => {
    if (!border || !Array.isArray(border)) return [];

    // Check if it's already a nested array
    if (Array.isArray(border[0]) && Array.isArray(border[0][0])) {
      return border.map(ring => ring.map(([lng, lat]) => [lat, lng]));
    }

    // If it's a single array of coordinates
    return [border.map(([lng, lat]) => [lat, lng])];
  };

  // Load Bali GeoJSON data
  useEffect(() => {
    const loadBaliGeoJSON = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(geoJsonUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const villages = await response.json();

        if (!Array.isArray(villages)) {
          throw new Error("Invalid GeoJSON format");
        }

        const geoJsonData = {
          type: "FeatureCollection",
          features: villages.map((village) => ({
            type: "Feature",
            properties: {
              village: village.village,
              sub_district: village.sub_district,
              district: village.district,
              province: village.province
            },
            geometry: {
              type: "Polygon",
              coordinates: processCoordinates(village.border)
            },
          })).filter(feature => 
            feature.geometry.coordinates.length > 0 && 
            feature.geometry.coordinates[0].length > 0
          ),
        };

        setBaliGeoJSON(geoJsonData);
      } catch (error) {
        console.error("Error loading Bali GeoJSON:", error);
        setError("Failed to load map data");
      } finally {
        setIsLoading(false);
      }
    };

    if (geoJsonUrl) {
      loadBaliGeoJSON();
    }
  }, [geoJsonUrl]);

  // Style function for village borders
  const styleFeature = (feature) => {
    const { village, sub_district, district } = feature.properties;
    
    const isCovered = coveredAreas.some(
      (area) =>
        (village && area.desa === village.toLowerCase()) ||
        (sub_district && area.kecamatan === sub_district.toLowerCase()) ||
        (district && area.kabupaten === district.toLowerCase())
    );

    return {
      fillColor: isCovered ? "#4CAF50" : "transparent",
      fillOpacity: isCovered ? 0.6 : 0,
      color: "#666",
      weight: 1,
      opacity: 0.8,
    };
  };

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  if (isLoading) {
    return <div className="p-4">Loading map...</div>;
  }

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
      >
        <ZoomControl position="bottomright" />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {baliGeoJSON && (
          <GeoJSON 
            data={baliGeoJSON} 
            style={styleFeature}
            onEachFeature={(feature, layer) => {
              const { village, sub_district, district, province } = feature.properties;
              layer.bindPopup(`
                <div class="p-2">
                  <strong>${village || 'N/A'}</strong><br/>
                  Sub-district: ${sub_district || 'N/A'}<br/>
                  District: ${district || 'N/A'}<br/>
                  Province: ${province || 'N/A'}
                </div>
              `);
            }}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default BaliMap;