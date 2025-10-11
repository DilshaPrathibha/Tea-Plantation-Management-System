const PestDisease = require('../../models/PestDisease');

exports.createPestDisease = async (req, res) => {
  try {
    console.log('Received request body:', req.body);
    console.log('User from request:', req.user);
    
    const { 
      reporterName, 
      title, 
      location, 
      date, 
      type, 
      urgency, 
      economicImpact,
      description, 
      affectedArea,
      requestedActions,
      otherAction,
      mapCoordinates,
      status,
      imageUrl
    } = req.body;

    // Validate required fields first
    if (!reporterName || !title || !location || !date || !type || !urgency || !economicImpact || !description) {
      return res.status(400).json({ message: 'All required fields must be filled' });
    }

    // Validate date is not in future
    const reportDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (reportDate > today) {
      return res.status(400).json({ message: 'Date cannot be in the future' });
    }

    // Validate affected area range (0.5 - 2000 perch)
    if (affectedArea < 0.5 || affectedArea > 2000) {
      return res.status(400).json({ message: 'Affected area must be between 0.5 and 2000 perch' });
    }

    // Validate requestedActions if Other is selected
    if (requestedActions && requestedActions.includes('Other') && (!otherAction || otherAction.trim() === '')) {
      return res.status(400).json({ message: 'Please specify the other action required' });
    }

    // Ensure we have the user ID
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User authentication required' });
    }

    const pestDiseaseData = {
      reporterName,
      title,
      location,
      date: reportDate,
      type,
      urgency,
      economicImpact,
      description,
      affectedArea: parseFloat(affectedArea),
      requestedActions: requestedActions || [],
      otherAction: otherAction || '',
      mapCoordinates: mapCoordinates || { lat: null, lng: null },
      status: status || 'Pending',
      imageUrl: imageUrl || '', 
      reportedBy: req.user.id
    };

    console.log('Creating pest disease with data:', pestDiseaseData);

    const pestDisease = await PestDisease.create(pestDiseaseData);

    console.log('Pest disease created successfully:', pestDisease._id);

    res.status(201).json({ pestDisease });
  } catch (e) {
    console.error('[PESTDISEASE create] ERROR:', e);
    console.error('Error stack:', e.stack);
    
    if (e.name === 'ValidationError') {
      const validationErrors = Object.values(e.errors).map(err => err.message).join(', ');
      console.error('Validation errors:', validationErrors);
      return res.status(400).json({ message: validationErrors });
    }
    
    if (e.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid data format' });
    }
    
    // More specific error messages
    res.status(500).json({ 
      message: 'Server error: ' + (e.message || 'Unknown error occurred'),
      error: process.env.NODE_ENV === 'development' ? e.message : undefined
    });
  }
};

exports.updatePestDisease = async (req, res) => {
  try {
    const { 
      title, 
      location, 
      date, 
      type, 
      urgency, 
      economicImpact,
      description, 
      affectedArea,
      requestedActions,
      otherAction,
      mapCoordinates,
      status,
      imageUrl 
    } = req.body;

    // Validate date is not in future
    if (date) {
      const reportDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (reportDate > today) {
        return res.status(400).json({ message: 'Date cannot be in the future' });
      }
    }

    // Validate affected area range (0.5 - 2000 perch)
    if (affectedArea && (affectedArea < 0.5 || affectedArea > 2000)) {
      return res.status(400).json({ message: 'Affected area must be between 0.5 and 2000 perch' });
    }

    // Validate required fields if provided
    if (title && title.trim() === '') {
      return res.status(400).json({ message: 'Title cannot be empty' });
    }
    if (description && description.trim() === '') {
      return res.status(400).json({ message: 'Description cannot be empty' });
    }

    // Validate requestedActions if Other is selected
    if (requestedActions && requestedActions.includes('Other') && (!otherAction || otherAction.trim() === '')) {
      return res.status(400).json({ message: 'Please specify the other action required' });
    }

    const pestDisease = await PestDisease.findByIdAndUpdate(
      req.params.id, 
      {
        title,
        location,
        date: date ? new Date(date) : undefined,
        type,
        urgency,
        economicImpact,
        description,
        affectedArea: affectedArea ? parseFloat(affectedArea) : undefined,
        requestedActions,
        otherAction,
        mapCoordinates,
        status,
        imageUrl
      }, 
      { new: true, runValidators: true }
    );
    
    if (!pestDisease) return res.status(404).json({ message: 'Pest/Disease report not found' });
    
    res.json({ pestDisease });
  } catch (e) {
    console.error('[PESTDISEASE update] ERROR:', e);
    if (e.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(e.errors).map(err => err.message).join(', ') });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Keep listPestDiseases, getPestDisease, and deletePestDisease unchanged
exports.listPestDiseases = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 50);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      PestDisease.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      PestDisease.countDocuments()
    ]);

    res.json({ items, total, page, limit });
  } catch (e) {
    console.error('[PESTDISEASE list] ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPestDisease = async (req, res) => {
  try {
    const pestDisease = await PestDisease.findById(req.params.id);
    if (!pestDisease) {
      return res.status(404).json({ message: 'Pest/Disease report not found' });
    }
    
    res.json({ pestDisease });
  } catch (e) {
    console.error('[PESTDISEASE get] ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deletePestDisease = async (req, res) => {
  try {
    const pestDisease = await PestDisease.findByIdAndDelete(req.params.id);
    
    if (!pestDisease) {
      return res.status(404).json({ message: 'Pest/Disease report not found' });
    }
    
    res.json({ message: 'Pest/Disease report deleted successfully' });
  } catch (e) {
    console.error('[PESTDISEASE delete] ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
};