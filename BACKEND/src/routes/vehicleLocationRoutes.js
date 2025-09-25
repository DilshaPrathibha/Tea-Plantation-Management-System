const express = require('express');
const VehicleLocation = require('../../models/vehicleLocation');

const router = express.Router();

// GET /api/vehicle-location
router.get('/vehicle-location', async (req, res) => {
  console.log('🚗 GET /api/vehicle-location - Request received');
  try {
    // Find the latest location by most recent update
    console.log('🔍 Searching for vehicle location...');
    const location = await VehicleLocation.findOne().sort({ updatedAt: -1 });
    console.log('📍 Location found:', location);
    
    if (!location) {
      console.log('❌ No location found in database');
      return res.status(404).json({ message: 'No location found' });
    }
    
    const response = {
      driverId: location.driverId,
      latitude: location.latitude,
      longitude: location.longitude,
      updatedAt: location.updatedAt
    };
    console.log('✅ Sending response:', response);
    res.json(response);
  } catch (err) {
    console.error('❌ Error in GET /api/vehicle-location:', err);
    res.status(500).json({ message: 'Error fetching location', error: err.message });
  }
});

// POST /api/vehicle-location
router.post('/vehicle-location', async (req, res) => {
  const { driverId, latitude, longitude } = req.body;
  console.log('🚗 POST /api/vehicle-location - Request received');
  console.log('📝 Request body:', { driverId, latitude, longitude });
  
  try {
    console.log('💾 Updating vehicle location...');
    const result = await VehicleLocation.findOneAndUpdate(
      { driverId },
      { latitude, longitude, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    console.log('✅ Location updated successfully:', result);
    res.json({ message: 'Location updated', result });
  } catch (err) {
    console.error('❌ Error in POST /api/vehicle-location:', err);
    res.status(500).json({ message: 'Error saving location', error: err.message });
  }
});

module.exports = router;