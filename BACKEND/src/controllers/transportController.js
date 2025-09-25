const Transport = require('../../models/Transport');

const getAllTransports = async (req, res) => {
  try {
    const transports = await Transport.find().sort({ createdAt: -1 });
    res.json(transports);
  } catch (error) {
    console.error('Error fetching transports:', error);
    res.status(500).json({ message: 'Server error while fetching transports' });
  }
};

const getTransportById = async (req, res) => {
  try {
    const transport = await Transport.findById(req.params.id);
    if (!transport) {
      return res.status(404).json({ message: 'Transport not found' });
    }
    res.json(transport);
  } catch (error) {
    console.error('Error fetching transport:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid transport ID' });
    }
    res.status(500).json({ message: 'Server error while fetching transport' });
  }
};

const createTransport = async (req, res) => {
  try {
    // Validate required fields
    const { vehicleId, vehicleType, driverName, batchId, destination } = req.body;
    
    if (!vehicleId || !vehicleType || !driverName || !batchId || !destination) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const transport = new Transport(req.body);
    const newTransport = await transport.save();
    res.status(201).json(newTransport);
  } catch (error) {
    console.error('Error creating transport:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Vehicle ID already exists' });
    }
    res.status(500).json({ message: 'Server error while creating transport' });
  }
};

const updateTransport = async (req, res) => {
  try {
    const transport = await Transport.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!transport) {
      return res.status(404).json({ message: 'Transport not found' });
    }
    
    res.json(transport);
  } catch (error) {
    console.error('Error updating transport:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid transport ID' });
    }
    res.status(500).json({ message: 'Server error while updating transport' });
  }
};

const deleteTransport = async (req, res) => {
  try {
    const transport = await Transport.findByIdAndDelete(req.params.id);
    
    if (!transport) {
      return res.status(404).json({ message: 'Transport not found' });
    }
    
    res.json({ message: 'Transport deleted successfully' });
  } catch (error) {
    console.error('Error deleting transport:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid transport ID' });
    }
    res.status(500).json({ message: 'Server error while deleting transport' });
  }
};

module.exports = {
  getAllTransports,
  getTransportById,
  createTransport,
  updateTransport,
  deleteTransport
};