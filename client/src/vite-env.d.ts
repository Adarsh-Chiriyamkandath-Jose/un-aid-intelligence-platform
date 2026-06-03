/// <reference types="vite/client" />

interface ImportMeta {
  readonly env: Record<string, string | undefined>;
}

interface Window {
  // MapLibre GL JS is loaded via a <script> tag in index.html (token-free Mapbox GL drop-in)
  maplibregl: any;
}

// react-plotly.js ships without type declarations
declare module "react-plotly.js";
