import type { PaletteStop } from "@/types/meteo";

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const n = Number.parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function colorForValue(
  value: number,
  stops: PaletteStop[],
  clamp = true,
): [number, number, number, number] {
  if (stops.length === 0) return [0, 0, 0, 0];
  const sorted = [...stops].sort((a, b) => a.value - b.value);
  const min = sorted[0].value;
  const max = sorted[sorted.length - 1].value;
  const v = clamp ? Math.min(max, Math.max(min, value)) : value;

  if (v <= sorted[0].value) {
    const [r, g, b] = hexToRgb(sorted[0].color);
    return [r, g, b, 220];
  }
  if (v >= sorted[sorted.length - 1].value) {
    const [r, g, b] = hexToRgb(sorted[sorted.length - 1].color);
    return [r, g, b, 220];
  }

  for (let i = 0; i < sorted.length - 1; i++) {
    const left = sorted[i];
    const right = sorted[i + 1];
    if (v >= left.value && v <= right.value) {
      const t = (v - left.value) / (right.value - left.value || 1);
      const [r1, g1, b1] = hexToRgb(left.color);
      const [r2, g2, b2] = hexToRgb(right.color);
      return [
        Math.round(lerp(r1, r2, t)),
        Math.round(lerp(g1, g2, t)),
        Math.round(lerp(b1, b2, t)),
        220,
      ];
    }
  }

  const [r, g, b] = hexToRgb(sorted[sorted.length - 1].color);
  return [r, g, b, 220];
}

export function cssGradient(stops: PaletteStop[]) {
  const sorted = [...stops].sort((a, b) => a.value - b.value);
  const min = sorted[0].value;
  const max = sorted[sorted.length - 1].value;
  const span = max - min || 1;
  return `linear-gradient(90deg, ${sorted
    .map((stop) => `${stop.color} ${((stop.value - min) / span) * 100}%`)
    .join(", ")})`;
}

export function formatTick(value: number, precision: number) {
  const abs = Math.abs(value);
  if (abs >= 1000) {
    const k = value / 1000;
    return `${k.toFixed(k >= 10 ? 0 : 1)}K`;
  }
  return value.toLocaleString("fr-FR", {
    maximumFractionDigits: precision,
    minimumFractionDigits: 0,
  });
}
