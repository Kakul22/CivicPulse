// One-off: fill state/city for issues created before the location feature.
// Run from the backend folder:  node scripts/backfillLocations.js
import pool from "../src/config/db.js";
import { reverseGeocode } from "../src/utils/geocode.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const { rows } = await pool.query(
  "SELECT id, latitude, longitude FROM issues WHERE state IS NULL OR city IS NULL ORDER BY id"
);
console.log(`${rows.length} issues to backfill`);

for (const row of rows) {
  const { state, city } = await reverseGeocode(row.latitude, row.longitude);
  if (state || city) {
    await pool.query("UPDATE issues SET state = $1, city = $2 WHERE id = $3", [state, city, row.id]);
  }
  console.log(`#${row.id}: ${city || "-"}, ${state || "-"}`);
  await sleep(1100); // Nominatim allows at most 1 request/second
}

console.log("Done");
await pool.end();
