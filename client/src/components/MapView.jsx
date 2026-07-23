import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { parchmentMapStyle } from '../styles/parchmentMapStyle';

const containerStyle = { width: '100%', height: '100vh' };

export default function MapView({ children, center }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  if (!isLoaded) return <div>Loading the map...</div>;

  return (
    <div className="map-frame">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={16}
        options={{
          styles: parchmentMapStyle,       // custom JSON theme — Part 10.4
          disableDefaultUI: true,
          gestureHandling: 'greedy',
        }}
      >
        {children}
      </GoogleMap>
    </div>
  );
}