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
        <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <filter id="handDrawnWobble">
          <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="2" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="6" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        </svg>
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