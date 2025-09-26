// BACKEND/controllers/pluckingRecordController.js
const PluckingRecord = require('../../models/PluckingRecord');
const Attendance = require('../../models/Attendance');

// Get workers who attended a specific field on a specific date
exports.getFieldWorkers = async (req, res) => {
  try {
    const { date, field } = req.query;
    
    if (!date || !field) {
      return res.status(400).json({ message: 'Date and field are required' });
    }

    // Format date to match attendance format (YYYY-MM-DD)
    const formattedDate = new Date(date).toISOString().split('T')[0];
    
    // Find attendance records - following your existing patterns
    const attendanceRecords = await Attendance.find({
      date: formattedDate,
      field: field,
      status: { $in: ['present', 'late'] }
    }).select('workerId workerName -_id');

    if (!attendanceRecords || attendanceRecords.length === 0) {
      return res.status(404).json({ 
        message: 'No attendance records found for this field and date' 
      });
    }

    res.json({ workers: attendanceRecords });
  } catch (error) {
    console.error('[PluckingRecord getFieldWorkers] ERROR:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new plucking record
exports.createPluckingRecord = async (req, res) => {
  try {
    const {
      date,
      field,
      dailyPricePerKg,
      teaGrade,
      workers
    } = req.body;

    // Check if record already exists
    const existingRecord = await PluckingRecord.findOne({
      date: new Date(date),
      field: field
    });

    if (existingRecord) {
      return res.status(400).json({ 
        message: 'A plucking record already exists for this field and date' 
      });
    }

    // Calculate totals
    let totalWeight = 0;
    const workerRecords = workers.map(worker => {
      const weight = parseFloat(worker.weight) || 0;
      totalWeight += weight;
      
      return {
        workerId: worker.workerId,
        workerName: worker.workerName,
        weight: weight
      };
    });

    const totalPayment = totalWeight * parseFloat(dailyPricePerKg);

    // Create new plucking record
    const pluckingRecord = new PluckingRecord({
      date: new Date(date),
      field,
      dailyPricePerKg: parseFloat(dailyPricePerKg),
      teaGrade,
      workers: workerRecords,
      totalWeight,
      totalPayment,
      reportedBy: req.user._id,
      reporterName: req.user.name
    });

    await pluckingRecord.save();
    res.status(201).json({ pluckingRecord });

  } catch (error) {
    console.error('[PluckingRecord create] ERROR:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all plucking records
exports.listPluckingRecords = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 50);
    const skip = (page - 1) * limit;

    // Support filtering by date (YYYY-MM-DD)
    let filter = {};
    if (req.query.date) {
      const start = new Date(req.query.date);
      const end = new Date(req.query.date);
      end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
      console.log('[PluckingRecord list] Date filter:', filter.date);
    }

    const [items, total] = await Promise.all([
      PluckingRecord.find(filter)
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      PluckingRecord.countDocuments(filter)
    ]);
    console.log('[PluckingRecord list] Found items:', items.length, 'Total:', total);
    res.json({ items, total, page, limit });
  } catch (error) {
    console.error('[PluckingRecord list] ERROR:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single plucking record
exports.getPluckingRecord = async (req, res) => {
  try {
    const pluckingRecord = await PluckingRecord.findById(req.params.id);
    
    if (!pluckingRecord) {
      return res.status(404).json({ message: 'Plucking record not found' });
    }
    
    res.json({ pluckingRecord });
  } catch (error) {
    console.error('[PluckingRecord get] ERROR:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// update function
exports.updatePluckingRecord = async (req, res) => {
  try {
    const {
      dailyPricePerKg,
      teaGrade,
      workers
    } = req.body;

    const pluckingRecord = await PluckingRecord.findById(req.params.id);
    
    if (!pluckingRecord) {
      return res.status(404).json({ message: 'Plucking record not found' });
    }

    // Verify the workers exist in attendance for this date and field
    const formattedDate = new Date(pluckingRecord.date).toISOString().split('T')[0];
    const attendanceRecords = await Attendance.find({
      date: formattedDate,
      field: pluckingRecord.field,
      status: { $in: ['present', 'late'] }
    }).select('workerId workerName -_id');

    const validWorkerIds = attendanceRecords.map(record => record.workerId);
    
    // Validate that all workers in the update were actually present
    const invalidWorkers = workers.filter(worker => 
      !validWorkerIds.includes(worker.workerId)
    );

    if (invalidWorkers.length > 0) {
      return res.status(400).json({ 
        message: 'Some workers were not present in this field on the recorded date',
        invalidWorkers: invalidWorkers.map(w => w.workerId)
      });
    }

    // Calculate new totals
    let totalWeight = 0;
    const workerRecords = workers.map(worker => {
      const weight = parseFloat(worker.weight) || 0;
      totalWeight += weight;
      
      // Find worker name from attendance records
      const workerInfo = attendanceRecords.find(a => a.workerId === worker.workerId);
      
      return {
        workerId: worker.workerId,
        workerName: workerInfo ? workerInfo.workerName : worker.workerName,
        weight: weight
      };
    });

    const totalPayment = totalWeight * parseFloat(dailyPricePerKg);

    // Update record
    pluckingRecord.dailyPricePerKg = parseFloat(dailyPricePerKg);
    pluckingRecord.teaGrade = teaGrade;
    pluckingRecord.workers = workerRecords;
    pluckingRecord.totalWeight = totalWeight;
    pluckingRecord.totalPayment = totalPayment;

    await pluckingRecord.save();
    res.json({ pluckingRecord });

  } catch (error) {
    console.error('[PluckingRecord update] ERROR:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete plucking record
exports.deletePluckingRecord = async (req, res) => {
  try {
    const pluckingRecord = await PluckingRecord.findByIdAndDelete(req.params.id);
    
    if (!pluckingRecord) {
      return res.status(404).json({ message: 'Plucking record not found' });
    }
    
    res.json({ message: 'Plucking record deleted successfully' });
  } catch (error) {
    console.error('[PluckingRecord delete] ERROR:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
