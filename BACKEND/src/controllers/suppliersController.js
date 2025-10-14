const Supplier = require("../../models/Supplier");

const getAllSuppliers = async (req, res) => {
  try {
    const { q, type, status } = req.query;
    let filter = {};
    
    if (q) {
      filter.$or = [
        { supplierId: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } },
        { contactNumber: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { notes: { $regex: q, $options: 'i' } }
      ];
    }
    if (type) filter.type = type;
    if (status) filter.status = status;

    const suppliers = await Supplier.find(filter)
      .sort({ createdAt: -1 })
      .lean() // Better performance
      .maxTimeMS(10000); // Prevent query hangs
    
    res.status(200).json(suppliers);
  } catch (error) {
    console.error("Error in getAllSuppliers controller:", error);
    
    // Handle specific timeout errors
    if (error.name === 'MongooseError' && error.message.includes('maxTimeMS')) {
      return res.status(504).json({ message: 'Query timeout - database may be slow' });
    }
    
    res.status(500).json({ message: "Internal server error" });
  }
};

const getSupplierById = async (req, res) => {
  try {
    const { id } = req.params;
    const supplier = await Supplier.findById(id);
    if (!supplier) return res.status(404).json({ message: "Supplier not found" });
    res.status(200).json(supplier);
  } catch (error) {
    console.error("Error in getSupplierById controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const createSupplier = async (req, res) => {
  try {
    // Auto-generate supplierId: SUP-YYYYMM-DD-rand4
    const { name, type, contactNumber, email, address, status, notes, paymentTerms, creditLimit, taxId, website, contactPerson, emergencyContact } = req.body;
    
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const rand = Math.floor(1000 + Math.random() * 9000);
    const supplierId = `SUP-${yyyy}${mm}-${dd}-${rand}`;
    
    const newSupplier = new Supplier({ 
      supplierId, 
      name, 
      type, 
      contactNumber, 
      email, 
      address, 
      status, 
      notes, 
      paymentTerms, 
      creditLimit, 
      taxId, 
      website, 
      contactPerson, 
      emergencyContact 
    });
    
    await newSupplier.save();
    res.status(201).json({ message: "Supplier created successfully", supplier: newSupplier });
  } catch (error) {
    console.error("Error in createSupplier controller:", error);
    if (error.code === 11000) {
      return res.status(409).json({ message: "Supplier ID already exists" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const update = req.body;
    
    // Prevent updating supplierId
    if (update.supplierId) {
      delete update.supplierId;
    }
    
    const updatedSupplier = await Supplier.findByIdAndUpdate(id, update, { new: true });
    if (!updatedSupplier) return res.status(404).json({ message: "Supplier not found" });
    
    res.status(200).json({ message: "Supplier updated successfully", supplier: updatedSupplier });
  } catch (error) {
    console.error("Error in updateSupplier controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedSupplier = await Supplier.findByIdAndDelete(id);
    if (!deletedSupplier) return res.status(404).json({ message: "Supplier not found" });
    
    res.status(200).json({ message: "Supplier deleted successfully" });
  } catch (error) {
    console.error("Error in deleteSupplier controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Additional supplier-specific operations
const suspendSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const supplier = await Supplier.findById(id);
    if (!supplier) return res.status(404).json({ message: "Supplier not found" });
    
    supplier.status = 'suspended';
    await supplier.save();
    
    res.status(200).json({ message: "Supplier suspended successfully", supplier });
  } catch (error) {
    console.error("Error in suspendSupplier controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const activateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const supplier = await Supplier.findById(id);
    if (!supplier) return res.status(404).json({ message: "Supplier not found" });
    
    supplier.status = 'active';
    await supplier.save();
    
    res.status(200).json({ message: "Supplier activated successfully", supplier });
  } catch (error) {
    console.error("Error in activateSupplier controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  suspendSupplier,
  activateSupplier,
};