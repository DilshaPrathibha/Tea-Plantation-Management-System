import mongoose from 'mongoose';

const vehicleLocationSchema = new mongoose.Schema({
  driverId: { type: String, required: true, unique: true },
  latitude: Number,
  longitude: Number,
  updatedAt: Date
});

const VehicleLocation = mongoose.model('VehicleLocation', vehicleLocationSchema);
export default VehicleLocation;
