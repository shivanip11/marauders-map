import { useEffect, useRef, useState } from 'react';

export function useGeolocation(onUpdate) {
  const onUpdateRef = useRef(onUpdate);
  const [error, setError] = useState('');
  useEffect(() => { onUpdateRef.current = onUpdate; }, [onUpdate]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Your browser does not support location access.');
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setError('');
        onUpdateRef.current({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          recordedAt: new Date(pos.timestamp).toISOString(),
        });
      },
      (err) => setError(err.code === 1
        ? 'Allow location access in your browser to place yourself on the map.'
        : 'Waiting for your location. Check that location services are enabled.'),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);
  return error;
}
