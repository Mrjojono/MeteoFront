import type { GridSpec, PaletteStop } from "@/types/meteo";
import { colorForValue } from "@/lib/palette";

export function gridBounds(grid: GridSpec) {
  const west = grid.lon.start - grid.lon.step / 2;
  const south = grid.lat.start - grid.lat.step / 2;
  const east = grid.lon.start + (grid.nx - 1) * grid.lon.step + grid.lon.step / 2;
  const north = grid.lat.start + (grid.ny - 1) * grid.lat.step + grid.lat.step / 2;
  return { west, south, east, north };
}

export function sampleGrid(
  lat: number,
  lon: number,
  grid: GridSpec,
  values: (number | null)[],
): number | null {
  const i = Math.round((lon - grid.lon.start) / grid.lon.step);
  const j = Math.round((lat - grid.lat.start) / grid.lat.step);
  if (i < 0 || j < 0 || i >= grid.nx || j >= grid.ny) return null;
  return values[j * grid.nx + i] ?? null;
}

function cellAt(
  values: (number | null)[],
  nx: number,
  ny: number,
  col: number,
  row: number,
): number | null {
  if (col < 0 || row < 0 || col >= nx || row >= ny) return null;
  const value = values[row * nx + col];
  return value == null || Number.isNaN(value) ? null : value;
}

function sampleBilinear(
  values: (number | null)[],
  nx: number,
  ny: number,
  x: number,
  y: number,
): { value: number; coverage: number } | null {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const tx = x - x0;
  const ty = y - y0;
  const samples = [
    { weight: (1 - tx) * (1 - ty), value: cellAt(values, nx, ny, x0, y0) },
    { weight: tx * (1 - ty), value: cellAt(values, nx, ny, x0 + 1, y0) },
    { weight: (1 - tx) * ty, value: cellAt(values, nx, ny, x0, y0 + 1) },
    { weight: tx * ty, value: cellAt(values, nx, ny, x0 + 1, y0 + 1) },
  ];

  let weightSum = 0;
  let valueSum = 0;
  for (const sample of samples) {
    if (sample.value == null) continue;
    weightSum += sample.weight;
    valueSum += sample.value * sample.weight;
  }
  if (weightSum < 0.18) return null;
  return { value: valueSum / weightSum, coverage: weightSum };
}

export function buildGridImage(
  values: (number | null)[],
  grid: GridSpec,
  stops: PaletteStop[],
  scale = 12,
): string {
  const width = grid.nx * scale;
  const height = grid.ny * scale;
  const source = document.createElement("canvas");
  source.width = width;
  source.height = height;
  const srcCtx = source.getContext("2d");
  if (!srcCtx) return "";

  const image = srcCtx.createImageData(width, height);
  const { nx, ny } = grid;

  for (let py = 0; py < height; py++) {
    const ySouth = ((height - 1 - py + 0.5) / height) * ny - 0.5;
    for (let px = 0; px < width; px++) {
      const x = ((px + 0.5) / width) * nx - 0.5;
      const sample = sampleBilinear(values, nx, ny, x, ySouth);
      const idx = (py * width + px) * 4;
      if (!sample) {
        image.data[idx + 3] = 0;
        continue;
      }
      const [r, g, b] = colorForValue(sample.value, stops);
      image.data[idx] = r;
      image.data[idx + 1] = g;
      image.data[idx + 2] = b;
      image.data[idx + 3] = Math.round(235 * Math.min(1, sample.coverage / 0.7));
    }
  }
  srcCtx.putImageData(image, 0, 0);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.filter = "blur(0.45px)";
  ctx.drawImage(source, 0, 0);
  return canvas.toDataURL("image/png");
}

export function monthLabel(iso: string) {
  const date = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  return date
    .toLocaleDateString("fr-FR", { month: "short", timeZone: "UTC" })
    .replace(".", "")
    .toUpperCase();
}

export function monthRangeLabel(startIso: string, endIso: string) {
  const start = monthLabel(startIso);
  const end = monthLabel(endIso);
  return start === end ? start : `${start}–${end}`;
}
