// BACKEND/src/controllers/incidencecontroller.js
const Incidence = require('../../models/Incidence');


exports.createIncidence = async (req, res) => {
  try {
    const { 
      reporterName, 
      title, 
      location, 
      date, 
      time, 
      type, 
      severity, 
      description, 
      status,
      imageUrl // This comes from Supabase now
    } = req.body;

    const incidence = await Incidence.create({
      reporterName,
      title,
      location,
      date,
      time,
      type,
      severity,
      description,
      status,
      imageUrl: imageUrl || '', 
      reportedBy: req.user.id
    });

    res.status(201).json({ incidence });
  } catch (e) {
    console.error('[INCIDENCE create] ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.listIncidences = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 50);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Incidence.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Incidence.countDocuments()
    ]);

    res.json({ items, total, page, limit });
  } catch (e) {
    console.error('[INCIDENCE list] ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getIncidence = async (req, res) => {
  try {
    const incidence = await Incidence.findById(req.params.id);
    if (!incidence) {
      return res.status(404).json({ message: 'Incidence report not found' });
    }
    
    res.json({ incidence });
  } catch (e) {
    console.error('[INCIDENCE get] ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateIncidence = async (req, res) => {
  try {
    
    console.log('Received update data:', req.body);

    const { 
      title, 
      location, 
      date, 
      time, 
      type, 
      severity, 
      description, 
      status,
      imageUrl 
    } = req.body;

    // Check if incidence exists
    const existingIncidence = await Incidence.findById(req.params.id);
    if (!existingIncidence) {
      return res.status(404).json({ message: 'Incidence report not found' });
    }

    // Permission check: Only the reporter, admin, or worker can edit
    const isReporter = req.user._id.toString() === existingIncidence.reportedBy.toString();
    const isAdmin = req.user.role === 'admin';
    const isWorker = req.user.role === 'worker';
    
    if (!isReporter && !isAdmin && !isWorker) {
      return res.status(403).json({ message: 'Access denied. Only the reporter, admin, or worker can edit this report.' });
    }

    // Additional check for admin and worker: can only edit their own reports
    if ((isAdmin || isWorker) && !isReporter) {
      return res.status(403).json({ message: 'Admin and workers can only edit their own reports.' });
    }

    const incidence = await Incidence.findByIdAndUpdate(
      req.params.id, 
      {
        title,
        location,
        date,
        time,
        type,
        severity,
        description,
        status,
        imageUrl
      }, 
      { new: true, runValidators: true }
    );
    
    res.json({ incidence });
  } catch (e) {
    console.error('[INCIDENCE update] ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteIncidence = async (req, res) => {
  try {
    // Check if incidence exists
    const existingIncidence = await Incidence.findById(req.params.id);
    if (!existingIncidence) {
      return res.status(404).json({ message: 'Incidence report not found' });
    }

    // Permission check: Only the reporter, admin, or worker can delete
    const isReporter = req.user._id.toString() === existingIncidence.reportedBy.toString();
    const isAdmin = req.user.role === 'admin';
    const isWorker = req.user.role === 'worker';
    
    if (!isReporter && !isAdmin && !isWorker) {
      return res.status(403).json({ message: 'Access denied. Only the reporter, admin, or worker can delete this report.' });
    }

    // Additional check for admin and worker: can only delete their own reports
    if ((isAdmin || isWorker) && !isReporter) {
      return res.status(403).json({ message: 'Admin and workers can only delete their own reports.' });
    }

    const incidence = await Incidence.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Incidence report deleted successfully' });
  } catch (e) {
    console.error('[INCIDENCE delete] ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
};