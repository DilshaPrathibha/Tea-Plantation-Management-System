const ProductionBatch = require('../../models/ProductionBatch');

const getAllBatches = async (req, res) => {
	try {
		const batches = await ProductionBatch.find().sort({ createdAt: -1 });
		res.json(batches);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const getBatchById = async (req, res) => {
	try {
		const batch = await ProductionBatch.findById(req.params.id);
		if (!batch) return res.status(404).json({ message: 'Batch not found' });
		res.json(batch);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const createBatch = async (req, res) => {
		try {
			console.log('[ProductionBatch create] Incoming body:', req.body);
			const batch = new ProductionBatch(req.body);
			const newBatch = await batch.save();
			res.status(201).json(newBatch);
		} catch (error) {
			console.error('[ProductionBatch create] ERROR:', error.message);
			res.status(400).json({ message: error.message });
		}
};

const updateBatch = async (req, res) => {
	try {
		const batch = await ProductionBatch.findByIdAndUpdate(
			req.params.id,
			req.body,
			{ new: true, runValidators: true }
		);
		if (!batch) return res.status(404).json({ message: 'Batch not found' });
		res.json(batch);
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
};

const deleteBatch = async (req, res) => {
	try {
		const batch = await ProductionBatch.findByIdAndDelete(req.params.id);
		if (!batch) return res.status(404).json({ message: 'Batch not found' });
		res.json({ message: 'Batch deleted successfully' });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

module.exports = {
	getAllBatches,
	getBatchById,
	createBatch,
	updateBatch,
	deleteBatch
};
