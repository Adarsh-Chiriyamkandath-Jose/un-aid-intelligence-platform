/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MAPBOX_ACCESS_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  // Mapbox GL JS is loaded via a <script> tag in index.html
  mapboxgl: any;
}

// react-plotly.js ships without type declarations
declare module "react-plotly.js";
