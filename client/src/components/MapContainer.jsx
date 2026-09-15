import { useState, useEffect, useCallback } from 'react';
import { throttle } from 'lodash-es';
import MapView from './MapView';
import FootstepMarker from './FootstepMarker';
import { useSocket } from '../hooks/useSocket';
import { useGeolocation } from '../hooks/useGeolocation';

export default function MapContainer({ token, sessionId, selfName }) {
  const { socket, connected } = useSocket(token, sessionId);
  const [others, setOthers] = useState({}); // { [userId]: { lat, lng, name } }
  const [selfPosition, setSelfPosition] = useState(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('location:broadcast', ({ userId, lat, lng, name }) => {
      setOthers((prev) => ({ ...prev, [userId]: { lat, lng, name } }));
    });

    socket.on('user:offline', ({ userId }) => {
      setOthers((prev) => {
        const next = { ...prev };
        delete next[userId]; // marker disappears from every viewer's map
        return next;
      });
    });

    return () => {
      socket.off('location:broadcast');
      socket.off('user:offline');
    };
  }, [socket]);

  const sendLocation = useCallback(
    throttle((coords) => {
      setSelfPosition({ lat: coords.lat, lng: coords.lng });
      socket?.emit('location:update', { sessionId, ...coords });
    }, 2000),
    [socket, sessionId]
  );
  useGeolocation(sendLocation);

  // Default to a placeholder center (London) until the browser's first real
  // GPS reading comes in — this is why the map may briefly show the wrong
  // city for a second or two on first load, then snap to your real position.
  const center = selfPosition || { lat: 51.5, lng: -0.12 };

  return (
    <MapView center={center}>
      {selfPosition && <FootstepMarker position={selfPosition} name={selfName} />}
      {Object.entries(others).map(([userId, u]) => (
        <FootstepMarker key={userId} position={u} name={u.name} />
      ))}
    </MapView>
  );
}