import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { pinIcon } from "../utils/mapIcon.js";
import StatusStamp from "./StatusStamp.jsx";

const DEFAULT_CENTER = [28.6139, 77.209]; // Delhi fallback when there's nothing to center on

export default function IssueMap({ issues }) {
  const withCoords = issues.filter((i) => i.latitude && i.longitude);

  const center =
    withCoords.length > 0
      ? [
          withCoords.reduce((sum, i) => sum + Number(i.latitude), 0) / withCoords.length,
          withCoords.reduce((sum, i) => sum + Number(i.longitude), 0) / withCoords.length,
        ]
      : DEFAULT_CENTER;

  return (
    <div className="issue-map-wrap">
      <MapContainer center={center} zoom={withCoords.length ? 13 : 5} style={{ height: 480, width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {withCoords.map((issue) => (
          <Marker key={issue.id} position={[Number(issue.latitude), Number(issue.longitude)]} icon={pinIcon}>
            <Popup>
              <div className="map-popup">
                <strong>{issue.title}</strong>
                <p>{issue.address || "Location pinned"}</p>
                <StatusStamp status={issue.status} />
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
