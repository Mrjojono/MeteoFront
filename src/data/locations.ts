import type { LocationId } from "@/types/meteo";

export type MapLocation = {
  id: LocationId;
  label: string;
  lat: number;
  lon: number;
  zoom: number;
};

export const LOCATIONS: MapLocation[] = [
  {
    id: "world",
    label: "Afrique de l'Ouest / Sahel",
    lat: 8.5,
    lon: 0,
    zoom: 4,
  },
  {
    id: "dakar",
    label: "Dakar",
    lat: 14.7,
    lon: -17.4,
    zoom: 6,
  },
  {
    id: "niamey",
    label: "Niamey",
    lat: 13.5,
    lon: 2.1,
    zoom: 6,
  },
  {
    id: "ouagadougou",
    label: "Ouagadougou",
    lat: 12.4,
    lon: -1.5,
    zoom: 6,
  },
];

export function getLocation(id: LocationId): MapLocation {
  return LOCATIONS.find((item) => item.id === id) ?? LOCATIONS[0];
}
