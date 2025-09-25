const ProductionBatchRecord = require('../../models/ProductionBatchRecord');
const ProductionBatch = require('../../models/ProductionBatch');
const PluckingRecord = require('../../models/PluckingRecord');

exports.generateProductionBatchRecord = async (req, res) => {
  try {
    const { batchId } = req.body;
    
    const productionBatch = await ProductionBatch.findOne({ batchId });
    if (!productionBatch) {
      return res.status(404).json({ message: 'Production batch not found' });
    }

    const pluckingRecords = await PluckingRecord.find({
      field: productionBatch.fieldName,
      date: { $lte: productionBatch.pluckingDate }
    }).sort({ date: -1 }).limit(10);

    const productionBatchRecord = new ProductionBatchRecord({
      batchId: productionBatch.batchId,
      productionDate: productionBatch.pluckingDate,
      teaWeight: productionBatch.teaWeight,
      qualityGrade: productionBatch.qualityGrade,
      supervisor: productionBatch.supervisor,
      pluckingRecords: pluckingRecords.map(record => ({
        date: record.date,
        field: record.field,
        totalWeight: record.totalWeight,
        totalPayment: record.totalPayment,
        teaGrade: record.teaGrade,
        workerCount: record.workers.length
      })),
      status: productionBatch.status,
      notes: productionBatch.notes
    });

    await productionBatchRecord.save();
    res.status(201).json({ productionBatchRecord });
  } catch (error) {
    console.error('Error generating production batch record:', error);
    res.status(500).json({ message: 'Server error' });
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