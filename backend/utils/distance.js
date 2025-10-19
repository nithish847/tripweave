import axios from "axios";

// Haversine formula
export const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Calculate total route distance using OSRM
export const calculateTotalDistanceKm = async (places) => {
  let totalKm = 0;

  for (let i = 0; i < places.length - 1; i++) {
    const { Lat: lat1, Lon: lon1 } = places[i];
    const { Lat: lat2, Lon: lon2 } = places[i + 1];

    const url = `http://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson`;
    const res = await axios.get(url);
    const route = res.data.routes?.[0]?.geometry?.coordinates;

    if (route) {
      for (let j = 0; j < route.length - 1; j++) {
        const [lonA, latA] = route[j];
        const [lonB, latB] = route[j + 1];
        totalKm += haversineDistance(latA, lonA, latB, lonB);
      }
    }
  }

  return totalKm;
};
