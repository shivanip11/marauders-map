import { useEffect, useRef } from 'react';

export function useGeolocation(onUpdate) {
  const sequenceRef = useRef(0);

  useEffect(() => {
    if (!navigator.geolocation) {
      console.error('Geolocation not supported by this browser');
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        sequenceRef.current += 1;
        onUpdate({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          sequenceNumber: sequenceRef.current,
          recordedAt: new Date().toISOString(),
        });
      },
      (err) => console.error('Geolocation error', err),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [onUpdate]);
}