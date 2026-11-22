import { Router } from "express";
import { reverseGeocode } from "../utils/geocode.js";

const router = Router();

// GET /api/geocode?lat=..&lng=.. -> { state, city }
router.get("/", async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  if (Number.isNaN(lat) || Number.isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return res.status(400).json({ error: "Valid lat and lng are required" });
  }
  const { state, city } = await reverseGeocode(lat, lng);
  res.json({ state, city });
});

export default router;
