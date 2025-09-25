const TransportManagementReport = require('../../models/TransportManagementReport');
const Transport = require('../../models/Transport');

exports.generateTransportReport = async (req, res) => {
  try {
    const { vehicleId } = req.body; // Changed from startDate, endDate to vehicleId
    
    // Find transport by vehicle ID
    const transport = await Transport.findOne({ vehicleId });
    
    if (!transport) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    const summary = {
      totalTransports: 1,
      scheduled: transport.status === 'scheduled' ? 1 : 0,
      inTransit: transport.status === 'in-transit' ? 1 : 0,
      delivered: transport.status === 'delivered' ? 1 : 0
    };

    const reportId = 'TR' + Date.now().toString().slice(-6);

    const transportReport = new TransportManagementReport({
      reportId,
      vehicleId: transport.vehicleId, // Add vehicle ID to report
      period: {
        start: transport.departureTime,
        end: transport.actualArrival || transport.estimatedArrival
      },
      transports: [{
        vehicleId: transport.vehicleId,
        vehicleType: transport.vehicleType,
        driverName: transport.driverName,
        batchId: transport.batchId,
        destination: transport.destination,
        status: transport.status,
        departureTime: transport.departureTime,
        estimatedArrival: transport.estimatedArrival,
        actualArrival: transport.actualArrival
      }],
      summary
    });

    await transportReport.save();
    res.status(201).json({ transportReport });
  } catch (error) {
    console.error('Error generating transport report:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getTransportReports = async (req, res) => {
  try {
    const reports = await TransportManagementReport.find().sort({ generatedDate: -1 });
    res.json({ reports });
  } catch (error) {
    console.error('Error fetching transport reports:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteTransportReport = async (req, res) => {
  try {
    const report = await TransportManagementReport.findByIdAndDelete(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Transport report not found' });
    }
    res.json({ message: 'Transport report deleted successfully' });
  } catch (error) {
    console.error('Error deleting transport report:', error);
    res.status(500).json({ message: 'Server error' });
  }
};