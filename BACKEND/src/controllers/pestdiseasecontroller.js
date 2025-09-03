const PestDisease = require('../../models/PestDisease');

// Create a new pest/disease report
exports.createPestDiseaseReport = async (req, res) => {
  try {
    if (!req.user || !req.user.name || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized: user info missing in token.' });
    }
    const { 
      issueType, 
      pestDiseaseName, 
      location, 
      mapCoordinates, 
      date, 
      severity, 
      description, 
      affectedArea, 
      requestedActions, 
      status 
    } = req.body;

    const pestDisease = new PestDisease({
      reporterName: req.user.name,
      reporterId: req.user.id,
      issueType,
      pestDiseaseName,
      location,
      mapCoordinates,
      date,
      severity,
      description,
      affectedArea,
      requestedActions,
      status
    });
    await pestDisease.save();
    res.status(201).json({ pestDisease });
  } catch (e) {
    console.error('[PESTDISEASE create] ERROR:', e && e.stack ? e.stack : e);
    res.status(500).json({ message: 'Server error', error: e && e.message ? e.message : e });
  }
};

// Get all pest/disease reports
exports.listPestDiseaseReports = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 50);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      PestDisease.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      PestDisease.countDocuments()
    ]);

    res.json({ items, total, page, limit });
  } catch (e) {
    console.error('[PESTDISEASE list] ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a single pest/disease report
exports.getPestDiseaseReport = async (req, res) => {
  try {
    const pestDisease = await PestDisease.findById(req.params.id);
    if (!pestDisease) return res.status(404).json({ message: 'Pest/Disease report not found' });
    
    res.json({ pestDisease });
  } catch (e) {
    console.error('[PESTDISEASE get] ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a pest/disease report
exports.updatePestDiseaseReport = async (req, res) => {
  try {
    const { 
      issueType, 
      pestDiseaseName, 
      location, 
      mapCoordinates, 
      severity, 
      description, 
      affectedArea, 
      requestedActions, 
      status 
    } = req.body;

    const pestDisease = await PestDisease.findByIdAndUpdate(
      req.params.id, 
      {
        issueType,
        pestDiseaseName,
        location,
        mapCoordinates,
        severity,
        description,
        affectedArea,
        requestedActions,
        status
      }, 
      { new: true, runValidators: true }
    );
    
    if (!pestDisease) return res.status(404).json({ message: 'Pest/Disease report not found' });
    
    res.json({ pestDisease });
  } catch (e) {
    console.error('[PESTDISEASE update] ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a pest/disease report
exports.deletePestDiseaseReport = async (req, res) => {
  try {
    const pestDisease = await PestDisease.findById(req.params.id);
    
    if (!pestDisease) return res.status(404).json({ message: 'Pest/Disease report not found' });
    
    // Check if status is Resolved
    if (pestDisease.status !== 'Resolved') {
      return res.status(400).json({ message: 'Only resolved reports can be deleted' });
    }
    
    await PestDisease.findByIdAndDelete(req.params.id);
    res.json({ message: 'Pest/Disease report deleted successfully' });
  } catch (e) {
    console.error('[PESTDISEASE delete] ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// Request inventory items
exports.requestInventory = async (req, res) => {
  try {
    const pestDisease = await PestDisease.findByIdAndUpdate(
      req.params.id, 
      { inventoryRequested: true }, 
      { new: true }
    );
    
    if (!pestDisease) return res.status(404).json({ message: 'Pest/Disease report not found' });
    
    res.json({ message: 'Inventory request submitted', pestDisease });
  } catch (e) {
    console.error('[PESTDISEASE inventory] ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
};