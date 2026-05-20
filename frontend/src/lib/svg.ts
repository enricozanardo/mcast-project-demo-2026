
export interface RobotArt {
  name: string;
  accent: string; // CSS color, e.g. "#D97706"
}

export function robotSvg({ name, accent }: RobotArt): string {
  // Sanitize: SVG text must not contain `<` or `&` raw.
  const safe = name.replace(/[<&>]/g, "").slice(0, 12);
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="#0F4C81"/>
  <rect x="40" y="60" width="120" height="100" rx="14" fill="${accent}"/>
  <circle cx="80"  cy="100" r="10" fill="#fff"/>
  <circle cx="120" cy="100" r="10" fill="#fff"/>
  <rect x="70" y="135" width="60" height="10" fill="#fff" rx="4"/>
  <text x="100" y="40" text-anchor="middle"
        font-family="monospace" font-size="14" fill="#fff">${safe}</text>
</svg>`;
  if (typeof btoa === "function") {
    return "data:image/svg+xml;base64," + btoa(svg);
  }
  // Node / SSR fallback (only used by unit tests).
  return "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64");
}

export const ACCENT_PALETTE = [
  "#D97706",
  "#10B981",
  "#EF4444",
  "#6366F1",
  "#EC4899",
  "#0EA5E9",
];
