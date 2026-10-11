import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { throttle } from 'lodash-es';
import MapView from './MapView';
import FootstepMarker from './FootstepMarker';
import { useSocket } from '../hooks/useSocket';
import { useGeolocation } from '../hooks/useGeolocation';
import { api } from '../services/api';

export default function MapContainer({ token, sessionId, selfName }) {
  const { socket, connected, error: connectionError } = useSocket(token, sessionId);
  const [others, setOthers] = useState({});
  const [selfPosition, setSelfPosition] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fitPositions, setFitPositions] = useState(null);
  const sequenceRef = useRef(0);
  const sharing = permissions?.sharingEnabled && permissions.visibleTo !== 'nobody';

  useEffect(() => {
    let cancelled = false;
    api.get('/api/users/me/permissions', { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => { if (!cancelled) setPermissions(data); })
      .catch(() => { if (!cancelled) setError('Could not load sharing settings. Refresh to try again.'); });
    return () => { cancelled = true; };
  }, [token]);

  useEffect(() => {
    if (!socket) return;
    const updateLocation = (location) => {
      setOthers((previous) => ({ ...previous, [location.userId]: location }));
    };
    const removeUser = ({ userId }) => {
      setOthers((previous) => {
        const next = { ...previous };
        delete next[userId];
        return next;
      });
    };
    const snapshot = (locations) => {
      setOthers(Object.fromEntries(locations.map((location) => [location.userId, location])));
    };
    const subscribe = () => { if (socket.connected) socket.emit('map:subscribe'); };
    const clearMap = () => setOthers({});
    const mapError = (message) => setError(message.error);
    socket.on('location:broadcast', updateLocation);
    socket.on('location:removed', removeUser);
    socket.on('user:offline', removeUser);
    socket.on('map:snapshot', snapshot);
    socket.on('map:refresh', subscribe);
    socket.on('sharing:changed', setPermissions);
    socket.on('map:error', mapError);
    socket.on('disconnect', clearMap);
    subscribe();
    return () => {
      socket.off('location:broadcast', updateLocation);
      socket.off('location:removed', removeUser);
      socket.off('user:offline', removeUser);
      socket.off('map:snapshot', snapshot);
      socket.off('map:refresh', subscribe);
      socket.off('sharing:changed', setPermissions);
      socket.off('map:error', mapError);
      socket.off('disconnect', clearMap);
    };
  }, [socket, connected]);

  const receiveLocation = useCallback((position) => setSelfPosition(position), []);
  const locationError = useGeolocation(receiveLocation);
  const sendLocation = useMemo(() => throttle((position) => {
    if (!socket?.connected || !sharing) return;
    sequenceRef.current = Math.max(Date.now(), sequenceRef.current + 1);
    socket.timeout(5000).emit('location:update', {
      sessionId, ...position, sequenceNumber: sequenceRef.current,
    }, (timeout, result) => {
      if (timeout || !result?.ok) setError(result?.error || 'Could not share your location. Check your connection.');
      else setError('');
    });
  }, 2000), [socket, sessionId, sharing]);

  useEffect(() => () => sendLocation.cancel(), [sendLocation]);
  // Resend even a stationary position after reconnecting or enabling sharing.
  useEffect(() => {
    if (connected && sharing && selfPosition) sendLocation(selfPosition);
  }, [connected, sharing, selfPosition, sendLocation]);

  async function setSharing(sharingEnabled) {
    setSaving(true);
    setError('');
    try {
      const { data } = await api.patch('/api/users/me/permissions', {
        sharingEnabled, visibleTo: 'everyone',
      }, { headers: { Authorization: `Bearer ${token}` } });
      setPermissions(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not change sharing. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const visibleUsers = Object.values(others);
  const center = selfPosition || { lat: 51.5, lng: -0.12 };
  return (
    <div className="map-screen">
      <MapView center={center} fitPositions={fitPositions}>
        {selfPosition && <FootstepMarker position={selfPosition} name={selfName} />}
        {visibleUsers.map((user) => (
          <FootstepMarker key={user.userId} position={user} name={user.name} />
        ))}
      </MapView>
      <section className="map-sharing-panel" aria-label="Map sharing">
        <strong>{selfName}</strong>
        <p role="status">{connected ? 'Connected to the map' : 'Connecting to the map…'}</p>
        <p>{sharing
          ? permissions.visibleTo === 'everyone' ? 'Your location is shared with everyone on this map.' : 'Your location is shared with friends.'
          : 'Your location is private. Only you can see your footsteps.'}</p>
        <button type="button" disabled={!permissions || saving || !connected} onClick={() => setSharing(!sharing)}>
          {saving ? 'Saving…' : sharing ? 'Stop sharing my location' : 'Share with everyone on this map'}
        </button>
        <p>{visibleUsers.length} other {visibleUsers.length === 1 ? 'person' : 'people'} visible</p>
        {visibleUsers.length > 0 && (
          <>
            <button type="button" onClick={() => setFitPositions([selfPosition, ...visibleUsers].filter(Boolean))}>
              Show everyone
            </button>
            <ul>
              {visibleUsers.map((user) => (
                <li key={user.userId}>
                  <button type="button" onClick={() => setFitPositions([user])}>{user.name}</button>
                </li>
              ))}
            </ul>
          </>
        )}
        {(connectionError || error || locationError) && <p className="map-sharing-error" role="alert">{connectionError || error || locationError}</p>}
      </section>
    </div>
  );
}
