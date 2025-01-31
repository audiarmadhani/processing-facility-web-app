import { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const BaliMap = () => {
  const [geoData, setGeoData] = useState(null);
  const [coveredDesa, setCoveredDesa] = useState(new Set());

  // Load GeoJSON data (assuming bali_villages.json is in /public)
  useEffect(() => {
    fetch("/bali_villages.json")
      .then((res) => res.json())
      .then((data) => setGeoData(data))
      .catch((err) => console.error("Error loading GeoJSON:", err));
  }, []);

  // Fetch API data and extract desa names
  useEffect(() => {
    fetch("https://processing-facility-backend.onrender.com/api/farmer")
      .then((res) => res.json())
      .then((data) => {
        const desaNames = new Set(data.allRows.map((row) => row.desa.toUpperCase()));
        setCoveredDesa(desaNames);
      })
      .catch((err) => console.error("Error fetching farmer data:", err));
  }, []);

  // Style function for highlighting covered desa
  const getStyle = (feature) => {
    const desaName = feature.properties.village.toUpperCase();
    return {
      fillColor: coveredDesa.has(desaName) ? "green" : "gray",
      color: "black",
      weight: 1,
      fillOpacity: 0.6,
    };
  };

  return (
    <MapContainer center={[-8.4095, 115.1889]} zoom={10} style={{ height: "500px", width: "100%" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {geoData && <GeoJSON data={geoData} style={getStyle} />}
    </MapContainer>
  );
};

export default BaliMap;