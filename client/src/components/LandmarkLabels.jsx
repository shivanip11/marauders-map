import { useEffect, useRef, useState } from 'react';
import { OverlayViewF, OVERLAY_LAYER } from '@react-google-maps/api';

const PLACE_IMPORTANCE = {
  airport: 112,
  international_airport: 120,
  subway_station: 96,
  light_rail_station: 94,
  train_station: 102,
  transit_station: 88,
  bus_station: 78,
  ferry_terminal: 82,
  university: 105,
  college: 90,
  hospital: 96,
  stadium: 94,
  sports_complex: 82,
  tourist_attraction: 93,
  cultural_landmark: 112,
  historical_landmark: 110,
  monument: 106,
  museum: 91,
  national_park: 108,
  park: 78,
  zoo: 88,
  city_hall: 88,
  courthouse: 84,
  government_office: 74,
  library: 76,
  school: 70,
  secondary_school: 72,
  primary_school: 66,
  place_of_worship: 68,
  church: 68,
  hindu_temple: 72,
  mosque: 72,
  synagogue: 72,
  police: 68,
  fire_station: 65,
  shopping_mall: 62,
  market: 58,
  pharmacy: 55,
  lodging: 50,
  supermarket: 46,
  restaurant: 34,
  cafe: 30,
};

const ZOOM_BANDS = [
  { maxZoom: 10, key: 'country', maxLabels: 4 },
  { maxZoom: 12, key: 'region', maxLabels: 6 },
  { maxZoom: 14, key: 'district', maxLabels: 9 },
  { maxZoom: 16, key: 'local', maxLabels: 13 },
  { maxZoom: Infinity, key: 'detail', maxLabels: 18 },
];

function getZoomBand(zoom) {
  return ZOOM_BANDS.find((band) => zoom <= band.maxZoom);
}

function getMinimumZoom(score) {
  if (score >= 100) return 7;
  if (score >= 84) return 10;
  if (score >= 66) return 13;
  if (score >= 48) return 15;
  return 17;
}

function getLabelTier(score) {
  if (score >= 90) return 'major';
  if (score >= 62) return 'standard';
  return 'local';
}

function getDistanceInMetres(from, to) {
  const earthRadius = 6371000;
  const toRadians = (degrees) => degrees * Math.PI / 180;
  const latitudeDelta = toRadians(to.lat - from.lat);
  const longitudeDelta = toRadians(to.lng - from.lng);
  const firstLatitude = toRadians(from.lat);
  const secondLatitude = toRadians(to.lat);
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(firstLatitude) * Math.cos(secondLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return 2 * earthRadius * Math.asin(Math.sqrt(haversine));
}

function getSearchRadius(map, center) {
  const northEast = map.getBounds()?.getNorthEast();
  if (!northEast) return 1500;

  return Math.min(50000, Math.max(250, getDistanceInMetres(center, {
    lat: northEast.lat(),
    lng: northEast.lng(),
  })));
}

function normalizePlace(place, rank) {
  const location = place.location || place.geometry?.location;
  const rawName = place.displayName || place.name;
  const name = typeof rawName === 'string' ? rawName : rawName?.text;

  if (!location || !name) return null;

  const primaryType = place.primaryType || place.types?.[0] || 'point_of_interest';
  const typeScore = PLACE_IMPORTANCE[primaryType] ?? 38;
  const score = typeScore + Math.max(0, 20 - rank);

  return {
    id: place.id || place.place_id || `${name}-${location.lat()}-${location.lng()}`,
    name,
    position: { lat: location.lat(), lng: location.lng() },
    primaryType,
    score,
    minZoom: getMinimumZoom(score),
    tier: getLabelTier(score),
  };
}

function intersects(first, second, padding = 9) {
  return !(
    first.right + padding < second.left
    || first.left - padding > second.right
    || first.bottom + padding < second.top
    || first.top - padding > second.bottom
  );
}

function getScreenPoint(map, position, zoom) {
  const projection = map.getProjection();
  const bounds = map.getBounds();
  const maps = window.google?.maps;
  if (!projection || !bounds || !maps) return null;

  const northEast = bounds.getNorthEast();
  const southWest = bounds.getSouthWest();
  const topLeft = projection.fromLatLngToPoint(new maps.LatLng(northEast.lat(), southWest.lng()));
  const point = projection.fromLatLngToPoint(new maps.LatLng(position));
  if (!topLeft || !point) return null;

  const scale = 2 ** zoom;
  const worldWidth = 256 * scale;
  let x = (point.x - topLeft.x) * scale;
  const y = (point.y - topLeft.y) * scale;

  if (x < -worldWidth / 2) x += worldWidth;
  if (x > worldWidth / 2) x -= worldWidth;

  return { x, y };
}

function selectVisibleLabels(map, places, zoom) {
  const band = getZoomBand(zoom);
  const mapBounds = map.getDiv().getBoundingClientRect();
  const occupied = [];
  const visible = [];

  const sortedPlaces = [...places]
    .filter((place) => place.minZoom <= zoom)
    .sort((first, second) => second.score - first.score || first.name.localeCompare(second.name));

  for (const place of sortedPlaces) {
    if (visible.length >= band.maxLabels) break;

    const point = getScreenPoint(map, place.position, zoom);
    if (!point) continue;

    const averageCharacterWidth = place.tier === 'major' ? 10.2 : 8.4;
    const estimatedWidth = Math.min(230, Math.max(74, place.name.length * averageCharacterWidth + 22));
    const estimatedHeight = place.name.length > 24 ? 42 : 28;
    const rectangle = {
      left: point.x - estimatedWidth / 2,
      right: point.x + estimatedWidth / 2,
      top: point.y - estimatedHeight / 2,
      bottom: point.y + estimatedHeight / 2,
    };

    const outsideSafeArea = rectangle.left < 28
      || rectangle.right > mapBounds.width - 28
      || rectangle.top < 28
      || rectangle.bottom > mapBounds.height - 48;

    if (outsideSafeArea || occupied.some((other) => intersects(rectangle, other))) continue;

    occupied.push(rectangle);
    visible.push(place);
  }

  return visible;
}

function labelOffset(width, height) {
  return { x: -(width / 2), y: -(height / 2) };
}

function labelTilt(name) {
  const total = [...name].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return `${((total % 7) - 3) * 0.12}deg`;
}

async function searchWithLegacyPlaces(map, center, radius) {
  const places = window.google?.maps?.places;
  if (!places?.PlacesService) return [];

  const service = new places.PlacesService(map);
  return new Promise((resolve) => {
    service.nearbySearch({ location: center, radius }, (results, status) => {
      if (status === places.PlacesServiceStatus.OK) resolve(results || []);
      else resolve([]);
    });
  });
}

async function searchNearbyLandmarks(map, center, radius) {
  try {
    const { Place, SearchNearbyRankPreference } = await window.google.maps.importLibrary('places');
    const { places } = await Place.searchNearby({
      fields: ['id', 'displayName', 'location', 'primaryType'],
      locationRestriction: { center, radius },
      maxResultCount: 20,
      rankPreference: SearchNearbyRankPreference.POPULARITY,
    });
    return places;
  } catch (error) {
    console.warn('Modern Places search unavailable; trying the legacy label source.', error);
    return searchWithLegacyPlaces(map, center, radius);
  }
}

export default function LandmarkLabels({ map }) {
  const [labels, setLabels] = useState([]);
  const lastSearchRef = useRef(null);
  const requestNumberRef = useRef(0);

  useEffect(() => {
    if (!map) return undefined;

    let refreshTimer;
    let isMounted = true;

    async function refreshLabels() {
      const zoom = Math.round(map.getZoom() || 16);
      const mapCenter = map.getCenter();
      if (!mapCenter || !map.getBounds() || !map.getProjection()) return;

      const center = { lat: mapCenter.lat(), lng: mapCenter.lng() };
      const radius = getSearchRadius(map, center);
      const band = getZoomBand(zoom);
      const previousSearch = lastSearchRef.current;
      const canReusePlaces = previousSearch
        && previousSearch.band === band.key
        && getDistanceInMetres(previousSearch.center, center) < previousSearch.radius * 0.35;

      if (canReusePlaces) {
        setLabels(selectVisibleLabels(map, previousSearch.places, zoom));
        return;
      }

      const requestNumber = ++requestNumberRef.current;
      const results = await searchNearbyLandmarks(map, center, radius);
      if (!isMounted || requestNumber !== requestNumberRef.current) return;

      const normalizedPlaces = results
        .map((place, index) => normalizePlace(place, index))
        .filter(Boolean);

      lastSearchRef.current = { band: band.key, center, radius, places: normalizedPlaces };
      setLabels(selectVisibleLabels(map, normalizedPlaces, zoom));
    }

    function scheduleRefresh() {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(refreshLabels, 320);
    }

    const idleListener = map.addListener('idle', scheduleRefresh);
    scheduleRefresh();

    return () => {
      isMounted = false;
      window.clearTimeout(refreshTimer);
      idleListener.remove();
    };
  }, [map]);

  return labels.map((label) => (
    <OverlayViewF
      key={label.id}
      position={label.position}
      mapPaneName={OVERLAY_LAYER}
      getPixelPositionOffset={labelOffset}
    >
      <span
        className={`landmark-label landmark-label--${label.tier}${label.name.length > 24 ? ' landmark-label--long' : ''}`}
        style={{ '--label-tilt': labelTilt(label.name) }}
      >
        {label.name}
      </span>
    </OverlayViewF>
  ));
}
