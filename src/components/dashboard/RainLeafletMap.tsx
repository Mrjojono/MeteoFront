import { useEffect, useMemo, useState } from "react";
import * as L from "leaflet";
import {
  ImageOverlay,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { LOCATIONS, getLocation } from "@/data/locations";
import { gridBounds, sampleGrid } from "@/lib/gridImage";
import type { GridSpec, LocationId } from "@/types/meteo";

type HoverInfo = {
  lat: number;
  lon: number;
  value: number | null;
};

type Props = {
  imageUrl: string;
  grid: GridSpec | null;
  values: (number | null)[] | null;
  locationId: LocationId;
  onLocationChange: (id: LocationId) => void;
  unit: string;
};

const cityIcon = (active: boolean) =>
  L.divIcon({
    className: "rain-marker",
    html: `<span style="display:block;width:14px;height:14px;border-radius:999px;border:2px solid white;background:${
      active ? "#154a7a" : "#64748b"
    };box-shadow:0 1px 4px rgba(0,0,0,.35)"></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -10],
  });

function MapView({ locationId }: { locationId: LocationId }) {
  const map = useMap();
  const location = getLocation(locationId);

  useEffect(() => {
    map.flyTo([location.lat, location.lon], location.zoom, { duration: 0.6 });
  }, [map, location.lat, location.lon, location.zoom]);

  return null;
}

function MapClicks({
  grid,
  values,
  onHover,
  onLocationChange,
}: {
  grid: GridSpec | null;
  values: (number | null)[] | null;
  onHover: (info: HoverInfo | null) => void;
  onLocationChange: (id: LocationId) => void;
}) {
  useMapEvents({
    click(event) {
      const { lat, lng } = event.latlng;
      const nearest = LOCATIONS.filter((item) => item.id !== "world").find(
        (item) => Math.hypot(item.lat - lat, item.lon - lng) < 1.2,
      );
      if (nearest) {
        onLocationChange(nearest.id);
        return;
      }
      if (!grid || !values) {
        onHover({ lat, lon: lng, value: null });
        return;
      }
      onHover({
        lat,
        lon: lng,
        value: sampleGrid(lat, lng, grid, values),
      });
    },
  });

  return null;
}

export default function RainLeafletMap({
  imageUrl,
  grid,
  values,
  locationId,
  onLocationChange,
  unit,
}: Props) {
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const location = getLocation(locationId);
  const cities = useMemo(
    () => LOCATIONS.filter((item) => item.id !== "world"),
    [],
  );
  const overlayBounds = useMemo(() => {
    if (!grid) return null;
    const { west, south, east, north } = gridBounds(grid);
    return [
      [south, west],
      [north, east],
    ] as L.LatLngBoundsExpression;
  }, [grid]);

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={[location.lat, location.lon]}
        zoom={location.zoom}
        className="h-full w-full"
        zoomControl
        attributionControl
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {imageUrl && overlayBounds && (
          <ImageOverlay
            url={imageUrl}
            bounds={overlayBounds}
            opacity={0.82}
            className="rain-grid-overlay"
            interactive={false}
          />
        )}
        {cities.map((city) => (
          <Marker
            key={city.id}
            position={[city.lat, city.lon]}
            icon={cityIcon(locationId === city.id)}
            eventHandlers={{
              click: () => onLocationChange(city.id),
            }}
          >
            <Popup>{city.label}</Popup>
          </Marker>
        ))}
        <MapView locationId={locationId} />
        <MapClicks
          grid={grid}
          values={values}
          onHover={setHover}
          onLocationChange={onLocationChange}
        />
      </MapContainer>
      {hover && (
        <div className="pointer-events-none absolute top-4 left-4 z-[1100] rounded-lg bg-white/95 px-3 py-2 text-xs text-slate-700 shadow">
          <p className="font-semibold">
            {hover.lat.toFixed(2)}°N, {hover.lon.toFixed(2)}°
          </p>
          <p>
            {hover.value == null
              ? "Hors grille / océan"
              : `${hover.value.toLocaleString("fr-FR")} ${unit}`}
          </p>
        </div>
      )}
    </div>
  );
}
