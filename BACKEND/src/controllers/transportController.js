const Transport = require('../../models/Transport');

const getAllTransports = async (req, res) => {
  try {
    const transports = await Transport.find().sort({ createdAt: -1 });
    res.json(transports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const getTransportById = async (req, res) => {
  try {
    const transport = await Transport.findById(req.params.id);
    if (!transport) return res.status(404).json({ message: 'Transport not found' });
    res.json(transport);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const createTransport = async (req, res) => {
  try {
    const transport = new Transport(req.body);
    const newTransport = await transport.save();
    res.status(201).json(newTransport);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


const updateTransport = async (req, res) => {
  try {
    const transport = await Transport.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!transport) return res.status(404).json({ message: 'Transport not found' });
    res.json(transport);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


const deleteTransport = async (req, res) => {
  try {
    const transport = await Transport.findByIdAndDelete(req.params.id);
    if (!transport) return res.status(404).json({ message: 'Transport not found' });
    res.json({ message: 'Transport deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllTransports,
  getTransportById,
  createTransport,
  updateTransport,
  deleteTransport
};