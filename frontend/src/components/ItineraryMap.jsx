
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icon creator
const createCustomIcon = (color) =>
  new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

const startIcon = createCustomIcon('green');
const endIcon = createCustomIcon('red');
const waypointIcon = createCustomIcon('blue');
const highlightedIcon = createCustomIcon('orange');

// Safe coordinate extraction
const getCoordinates = (place) => {
  if (!place) return null;
  
  // Handle different property names for coordinates
  const lat = place.lat || place.Lat || place.latitude;
  const lng = place.lng || place.Lon || place.longitude;
  
  // Validate coordinates exist and are valid numbers
  if (lat !== undefined && lng !== undefined && 
      !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng)) &&
      parseFloat(lat) >= -90 && parseFloat(lat) <= 90 &&
      parseFloat(lng) >= -180 && parseFloat(lng) <= 180) {
    return [parseFloat(lat), parseFloat(lng)];
  }
  return null;
};

// Format coordinates for OSRM API
const formatCoordinates = (coords) => {
  return coords.map(coord => `${coord[1]},${coord[0]}`).join(';');
};

// Map bounds controller
const MapController = ({ coordinates }) => {
  const map = useMap();
  useEffect(() => {
    if (coordinates && coordinates.length > 0) {
      try {
        const group = new L.featureGroup(coordinates.map(coord => L.marker(coord)));
        map.fitBounds(group.getBounds(), { padding: [20, 20] });
      } catch (error) {
        console.warn('Error fitting bounds, using fallback:', error);
        map.setView(coordinates[0], 10);
      }
    }
  }, [map, coordinates]);

  return null;
};

const ItineraryMap = ({ source, destination, itineraryPlaces = [], highlightDay }) => {
  const mapRef = useRef();
  const [routeGeometry, setRouteGeometry] = useState(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);

  // Memoize coordinates for performance
  const sourceCoords = useMemo(() => getCoordinates(source), [source]);
  const destCoords = useMemo(() => getCoordinates(destination), [destination]);
  const waypointCoords = useMemo(() =>
    itineraryPlaces.map(getCoordinates).filter(Boolean), [itineraryPlaces]);

  // All coordinates for the route
  const allRouteCoords = useMemo(() => {
    if (sourceCoords && destCoords) {
      return [sourceCoords, ...waypointCoords, destCoords];
    }
    return [];
  }, [sourceCoords, destCoords, waypointCoords]);

  // All coordinates for the map controller
  const allCoordinates = useMemo(() => {
    const coords = [];
    if (sourceCoords) coords.push(sourceCoords);
    coords.push(...waypointCoords);
    if (destCoords) coords.push(destCoords);
    return coords;
  }, [sourceCoords, destCoords, waypointCoords]);

  // Fetch shortest road route using OSRM
  useEffect(() => {
    const fetchShortestRoute = async () => {
      if (allRouteCoords.length < 2) {
        setRouteGeometry(null);
        setRouteInfo(null);
        return;
      }

      setIsLoadingRoute(true);
      try {
        const coordinatesString = formatCoordinates(allRouteCoords);
        
        // Use OSRM with shortest path (distance-based) routing
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${coordinatesString}?overview=full&geometries=geojson&alternatives=false&steps=true`
        );
        
        const data = await response.json();
        
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          
          // Convert GeoJSON coordinates to Leaflet format [lat, lng]
          const routeCoords = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
          setRouteGeometry(routeCoords);
          
          // Extract route information
          setRouteInfo({
            distance: (route.distance / 1000).toFixed(1), // Convert to km
            duration: Math.ceil(route.duration / 60), // Convert to minutes
            instructions: route.legs?.[0]?.steps?.map(step => step.maneuver.instruction) || []
          });
        } else {
          console.warn('No route found, using straight line');
          setRouteGeometry(allRouteCoords);
          setRouteInfo(null);
        }
      } catch (error) {
        console.error('Error fetching route:', error);
        // Fallback to straight line if routing service fails
        setRouteGeometry(allRouteCoords);
        setRouteInfo(null);
      } finally {
        setIsLoadingRoute(false);
      }
    };

    fetchShortestRoute();
  }, [allRouteCoords]);

  if (!sourceCoords || !destCoords) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
          <p className="text-sm text-red-500 mt-2">Waiting for valid location data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <MapContainer 
        center={sourceCoords} 
        zoom={10} 
        style={{ height: '100%', width: '100%' }} 
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        <MapController coordinates={allCoordinates} />

        {/* Start Marker */}
        <Marker position={sourceCoords} icon={startIcon}>
          <Popup>
            <div className="text-center">
              <strong>Start: {source?.name || source?.Name || "Starting Point"}</strong>
            </div>
          </Popup>
        </Marker>

        {/* Waypoints */}
        {itineraryPlaces.map((place, index) => {
          const pos = waypointCoords[index];
          if (!pos) return null;
          const isHighlighted = highlightDay === index + 1;
          return (
            <Marker 
              key={place._id || index} 
              position={pos} 
              icon={isHighlighted ? highlightedIcon : waypointIcon}
            >
              <Popup>
                <div className="text-center">
                  <strong>Stop {index + 1}: {place.name || place.Name || "Unknown Place"}</strong>
                  {place.TimeNeededHrs && <p>Time needed: {place.TimeNeededHrs}h</p>}
                  {place.EntranceFee && <p>Entrance fee: ₹{place.EntranceFee}</p>}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* End Marker */}
        <Marker position={destCoords} icon={endIcon}>
          <Popup>
            <div className="text-center">
              <strong>Destination: {destination?.name || destination?.Name || "Destination"}</strong>
            </div>
          </Popup>
        </Marker>

        {/* Shortest Route Polyline */}
        {routeGeometry && routeGeometry.length >= 2 && (
          <Polyline 
            positions={routeGeometry} 
            color="#10B981" 
            weight={6} 
            opacity={0.8}
            smoothFactor={1}
          />
        )}

        {/* Fallback straight line if no route found */}
        {!routeGeometry && allRouteCoords.length >= 2 && (
          <Polyline 
            positions={allRouteCoords} 
            color="#93C5FD" 
            weight={4} 
            opacity={0.5}
            dashArray="5, 10"
          />
        )}
      </MapContainer>

      {/* Route Information Panel */}
      {routeInfo && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-xs z-[1000]">
          <h3 className="font-bold text-gray-800 mb-2">Route Information</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Distance:</span>
              <span className="font-semibold text-green-600">{routeInfo.distance} km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Estimated Time:</span>
              <span className="font-semibold text-blue-600">{routeInfo.duration} min</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Route Type:</span>
              <span className="font-semibold text-purple-600">Shortest Path</span>
            </div>
          </div>
        </div>
      )}

      {/* Route Loading Indicator */}
      {isLoadingRoute && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-[1000]">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Finding shortest route...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItineraryMap;