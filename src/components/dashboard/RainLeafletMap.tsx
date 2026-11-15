import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
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
import { gridBounds, sampleGrid, summarizeZone, type ZoneSummary } from "@/lib/gridImage";
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
  selecting: boolean;
  onSelectingChange: (next: boolean) => void;
  onZone: (zone: ZoneSummary) => void;
  onZoneClear: () => void;
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
  suspended,
}: {
  grid: GridSpec | null;
  values: (number | null)[] | null;
  onHover: (info: HoverInfo | null) => void;
  onLocationChange: (id: LocationId) => void;
  suspended: boolean;
}) {
  useMapEvents({
    click(event) {
      if (suspended) return;
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

function ZoneDraw({
  active,
  shapeRef,
  onComplete,
}: {
  active: boolean;
  shapeRef: MutableRefObject<L.Rectangle | null>;
  onComplete: (box: { south: number; north: number; west: number; east: number }) => void;
}) {
  const map = useMap();
  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;

  useEffect(() => {
    const container = map.getContainer();
    if (!active) {
      map.dragging.enable();
      container.classList.remove("is-selecting");
      return;
    }

    map.dragging.disable();
    container.classList.add("is-selecting");
    let start: L.LatLng | null = null;
    let draftShape: L.Rectangle | null = null;

    const down = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest(".leaflet-control, .leaflet-marker-icon, button")) return;
      start = map.mouseEventToLatLng(event);
      try {
        container.setPointerCapture(event.pointerId);
      } catch {
        /* Le tracé continue même si le pointeur n’est pas capturable. */
      }
      const draft = L.rectangle(L.latLngBounds(start, start), {
        color: "#154a7a",
        weight: 2,
        fillColor: "#154a7a",
        fillOpacity: 0.16,
      }).addTo(map);
      draftShape = draft;
    };
    const move = (event: PointerEvent) => {
      if (!start || !draftShape) return;
      draftShape.setBounds(L.latLngBounds(start, map.mouseEventToLatLng(event)));
    };
    const up = (event: PointerEvent) => {
      if (!start || !draftShape) return;
      const bounds = L.latLngBounds(start, map.mouseEventToLatLng(event));
      start = null;
      const tall = Math.abs(bounds.getNorth() - bounds.getSouth());
      const wide = Math.abs(bounds.getEast() - bounds.getWest());
      if (tall < 0.15 && wide < 0.15) {
        draftShape.remove();
        draftShape = null;
        return;
      }
      shapeRef.current?.remove();
      shapeRef.current = draftShape;
      draftShape = null;
      completeRef.current({
        south: bounds.getSouth(),
        north: bounds.getNorth(),
        west: bounds.getWest(),
        east: bounds.getEast(),
      });
    };

    container.addEventListener("pointerdown", down);
    container.addEventListener("pointermove", move);
    container.addEventListener("pointerup", up);
    return () => {
      draftShape?.remove();
      map.dragging.enable();
      container.classList.remove("is-selecting");
      container.removeEventListener("pointerdown", down);
      container.removeEventListener("pointermove", move);
      container.removeEventListener("pointerup", up);
    };
  }, [active, map, shapeRef]);

  return null;
}

export default function RainLeafletMap({
  imageUrl,
  grid,
  values,
  locationId,
  onLocationChange,
  unit,
  selecting,
  onSelectingChange,
  onZone,
  onZoneClear,
}: Props) {
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const [drawn, setDrawn] = useState(false);
  const shapeRef = useRef<L.Rectangle | null>(null);
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

  function clearZone() {
    shapeRef.current?.remove();
    shapeRef.current = null;
    setDrawn(false);
    onSelectingChange(false);
    onZoneClear();
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || (!drawn && !selecting)) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("textarea, input")) return;
      clearZone();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawn, selecting]);

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={[location.lat, location.lon]}
        zoom={location.zoom}
        className={`h-full w-full ${selecting ? "is-selecting" : ""}`}
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
          suspended={selecting}
        />
        <ZoneDraw
          active={selecting}
          shapeRef={shapeRef}
          onComplete={(box) => {
            if (!grid || !values) return;
            setDrawn(true);
            onZone(summarizeZone(grid, values, box));
          }}
        />
      </MapContainer>
      <div className="absolute top-20 left-4 z-[1100] flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onSelectingChange(!selecting)}
          aria-pressed={selecting}
          className={`rounded-full px-3 py-2 text-sm font-semibold shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#154a7a] ${
            selecting ? "bg-[#154a7a] text-white" : "bg-white text-[#154a7a]"
          }`}
        >
          {selecting ? "Annuler le tracé" : "Sélectionner une zone"}
        </button>
        {drawn && (
          <button
            type="button"
            onClick={clearZone}
            className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-[#154a7a] shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#154a7a]"
          >
            Effacer la zone
          </button>
        )}
      </div>
      {hover && (
        <div className="pointer-events-none absolute top-16 left-4 z-[1100] rounded-lg bg-white/95 px-3 py-2 text-xs text-slate-700 shadow">
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
