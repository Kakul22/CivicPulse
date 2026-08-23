import L from "leaflet";

// A custom pin icon built as inline SVG — avoids the classic Leaflet +
// bundler broken-default-icon problem, and matches the app's brand color.
export const pinIcon = L.divIcon({
  className: "custom-pin-icon",
  html: `<svg width="28" height="36" viewBox="0 0 24 30" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 18 12 18s12-9 12-18c0-6.6-5.4-12-12-12Z" fill="#F0A93B"/>
    <circle cx="12" cy="12" r="4.5" fill="#14231D"/>
  </svg>`,
  iconSize: [28, 36],
  iconAnchor: [14, 36],
  popupAnchor: [0, -32],
});
