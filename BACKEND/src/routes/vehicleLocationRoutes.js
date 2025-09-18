import express from 'express';
import VehicleLocation from '../../models/vehicleLocation.js';

const router = express.Router();

// GET /api/vehicle-location
router.get('/vehicle-location', async (req, res) => {
  try {
    // Find the latest location (assuming only one driver)
    const location = await VehicleLocation.findOne();
    if (!location) {
      return res.status(404).json({ message: 'No location found' });
    }
    res.json({
      driverId: location.driverId,
      latitude: location.latitude,
      longitude: location.longitude,
      updatedAt: location.updatedAt
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching location' });
  }
});

// POST /api/vehicle-location
router.post('/vehicle-location', async (req, res) => {
  const { driverId, latitude, longitude } = req.body;
  try {
    await VehicleLocation.findOneAndUpdate(
      { driverId },
      { latitude, longitude, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ message: 'Location updated' });
  } catch (err) {
    res.status(500).json({ message: 'Error saving location' });
  }
});

export default router;
