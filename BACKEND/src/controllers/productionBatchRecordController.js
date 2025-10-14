const ProductionBatchRecord = require('../../models/ProductionBatchRecord');
const ProductionBatch = require('../../models/ProductionBatch');
const PluckingRecord = require('../../models/PluckingRecord');

exports.generateProductionBatchRecord = async (req, res) => {
  try {
    const { batchId } = req.body;
    
    if (!batchId) {
      return res.status(400).json({ message: 'Batch ID is required' });
    }

    console.log('Generating production batch record for batchId:', batchId);
    
    const productionBatch = await ProductionBatch.findOne({ batchId });
    if (!productionBatch) {
      console.log('Production batch not found for batchId:', batchId);
      return res.status(404).json({ message: 'Production batch not found' });
    }

    console.log('Found production batch:', productionBatch.batchId, 'Field:', productionBatch.fieldName);
    console.log('Production batch details:', {
      batchId: productionBatch.batchId,
      fieldName: productionBatch.fieldName,
      pluckingDate: productionBatch.pluckingDate,
      teaWeight: productionBatch.teaWeight,
      qualityGrade: productionBatch.qualityGrade,
      supervisor: productionBatch.supervisor,
      status: productionBatch.status
    });

    // Handle case where fieldName might be empty
    const fieldName = productionBatch.fieldName || 'Unknown Field';
    
    const pluckingRecords = await PluckingRecord.find({
      field: fieldName,
      date: { $lte: productionBatch.pluckingDate }
    }).sort({ date: -1 }).limit(10);

    console.log('Found plucking records:', pluckingRecords.length);
    console.log('Plucking records details:', pluckingRecords.map(r => ({
      date: r.date,
      field: r.field,
      totalWeight: r.totalWeight,
      workersCount: r.workers ? r.workers.length : 0
    })));

    // Validate required fields
    if (!productionBatch.batchId || !productionBatch.pluckingDate || !productionBatch.teaWeight || !productionBatch.qualityGrade || !productionBatch.supervisor) {
      console.error('Missing required fields in production batch:', {
        batchId: !!productionBatch.batchId,
        pluckingDate: !!productionBatch.pluckingDate,
        teaWeight: !!productionBatch.teaWeight,
        qualityGrade: !!productionBatch.qualityGrade,
        supervisor: !!productionBatch.supervisor
      });
      return res.status(400).json({ message: 'Production batch is missing required fields' });
    }

    // Safely map plucking records
    const mappedPluckingRecords = pluckingRecords.map(record => {
      try {
        return {
          date: record.date,
          field: record.field || 'Unknown Field',
          totalWeight: record.totalWeight || 0,
          totalPayment: record.totalPayment || 0,
          teaGrade: record.teaGrade || 'Unknown Grade',
          workerCount: record.workers ? record.workers.length : 0
        };
      } catch (error) {
        console.error('Error mapping plucking record:', error, record);
        return {
          date: record.date || new Date(),
          field: 'Unknown Field',
          totalWeight: 0,
          totalPayment: 0,
          teaGrade: 'Unknown Grade',
          workerCount: 0
        };
      }
    });

    const productionBatchRecord = new ProductionBatchRecord({
      batchId: productionBatch.batchId,
      productionDate: productionBatch.pluckingDate,
      teaWeight: productionBatch.teaWeight,
      qualityGrade: productionBatch.qualityGrade,
      supervisor: productionBatch.supervisor,
      fieldName: fieldName, // Use the safe fieldName
      pluckingRecords: mappedPluckingRecords,
      status: productionBatch.status,
      notes: productionBatch.notes
    });

    await productionBatchRecord.save();
    console.log('Production batch record saved successfully');
    res.status(201).json({ productionBatchRecord });
  } catch (error) {
    console.error('Error generating production batch record:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

exports.getProductionBatchRecords = async (req, res) => {
  try {
    const records = await ProductionBatchRecord.find().sort({ productionDate: -1 });
    res.json({ records });
  } catch (error) {
    console.error('Error fetching production batch records:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteProductionBatchRecord = async (req, res) => {
  try {
    const record = await ProductionBatchRecord.findByIdAndDelete(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }
    res.json({ message: 'Production batch record deleted successfully' });
  } catch (error) {
    console.error('Error deleting production batch record:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Test endpoint to check production batches
exports.testProductionBatches = async (req, res) => {
  try {
    const batches = await ProductionBatch.find().limit(5);
    res.json({ 
      message: 'Production batches found',
      count: batches.length,
      batches: batches.map(batch => ({
        batchId: batch.batchId,
        fieldName: batch.fieldName,
        pluckingDate: batch.pluckingDate,
        teaWeight: batch.teaWeight,
        qualityGrade: batch.qualityGrade,
        supervisor: batch.supervisor,
        status: batch.status
      }))
    });
  } catch (error) {
    console.error('Error fetching production batches:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};