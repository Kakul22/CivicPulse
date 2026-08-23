import { useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { pinIcon } from "../utils/mapIcon.js";

const DEFAULT_CENTER = [28.6139, 77.209]; // Delhi — just a sensible fallback view

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function LocationPicker({ value, onChange }) {
  const [locating, setLocating] = useState(false);
  const mapRef = useRef(null);

  function handleUseMyLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        onChange(coords);
        mapRef.current?.flyTo([coords.lat, coords.lng], 17);
        setLocating(false);
      },
      () => setLocating(false)
    );
  }

  function handleDragEnd(e) {
    const ll = e.target.getLatLng();
    onChange({ lat: ll.lat, lng: ll.lng });
  }

  return (
    <div>
      <div className="map-picker-actions">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={handleUseMyLocation}
          disabled={locating}
        >
          {locating ? "Getting location…" : "📍 Use my current location"}
        </button>
        <span className="field-hint">
          Not standing at the spot? Tap anywhere on the map to drop the pin there instead.
        </span>
      </div>

      <div className="map-picker-wrap">
        <MapContainer
          center={value ? [value.lat, value.lng] : DEFAULT_CENTER}
          zoom={value ? 16 : 5}
          style={{ height: 260, width: "100%" }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={onChange} />
          {value && (
            <Marker
              position={[value.lat, value.lng]}
              icon={pinIcon}
              draggable
              eventHandlers={{ dragend: handleDragEnd }}
            />
          )}
        </MapContainer>
      </div>

      {value && (
        <span className="field-hint">
          Pin set at {value.lat.toFixed(5)}, {value.lng.toFixed(5)} — drag it to fine-tune.
        </span>
      )}
    </div>
  );
}
