const Tool = require("../../models/Tool");

const getAllTools = async (req, res) => {
  try {
    const { q, type, condition, status } = req.query;
    let filter = {};
    if (q) {
      filter.$or = [
        { toolId: { $regex: q, $options: 'i' } },
        { note: { $regex: q, $options: 'i' } }
      ];
    }
    if (type) filter.toolType = type;
    if (condition) filter.condition = condition;
    if (status) {
      if (status === 'needs_repair') filter.condition = 'needs_repair';
      else if (status === 'assigned') filter.assignedTo = { $ne: null };
      else if (status === 'available') {
        filter.condition = { $ne: 'needs_repair' };
        filter.assignedTo = null;
      }
    }
    let tools = await Tool.find(filter)
      .populate({ path: 'assignedTo', select: 'name _id' })
      .sort({ createdAt: -1 });
    // Add status field for frontend compatibility
    tools = tools.map(tool => {
      let status = 'available';
      if (tool.condition === 'needs_repair') status = 'needs_repair';
      else if (tool.assignedTo) status = 'assigned';
      return { ...tool.toObject(), status };
    });
    res.status(200).json(tools);
  } catch (error) {
    console.error("Error in getAllTools controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getToolById = async (req, res) => {
  try {
    const { id } = req.params;
    const tool = await Tool.findById(id);
    if (!tool) return res.status(404).json({ message: "Tool not found" });
    res.status(200).json(tool);
  } catch (error) {
    console.error("Error in getToolById controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const createTool = async (req, res) => {
  try {
    // Ignore any toolId sent by client, always auto-generate
    const { toolType, assignedTo, condition, note, name, quantity, description } = req.body;
    // Generate toolId: TL-YYYYMM-DD-rand4
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const rand = Math.floor(1000 + Math.random() * 9000);
    const toolId = `TL-${yyyy}${mm}-${dd}-${rand}`;
    const newTool = new Tool({ toolId, toolType, assignedTo, condition, note, name, quantity, description });
    await newTool.save();
    res.status(201).json({ message: "Tool created successfully", tool: newTool });
  } catch (error) {
    console.error("Error in createTool controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateTool = async (req, res) => {
  try {
    const { id } = req.params;
    const update = req.body;
    if (update.toolId) {
      const exists = await Tool.findOne({ toolId: update.toolId, _id: { $ne: id } });
      if (exists) return res.status(409).json({ message: "Tool ID already exists" });
    }
    const updatedTool = await Tool.findByIdAndUpdate(id, update, { new: true });
    if (!updatedTool) return res.status(404).json({ message: "Tool not found" });
    res.status(200).json({ message: "Tool updated", tool: updatedTool });
  } catch (error) {
    console.error("Error in updateTool controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Assign tool to worker
const assignTool = async (req, res) => {
  try {
    const { id } = req.params;
    const { workerId } = req.body;
    const tool = await Tool.findById(id);
    if (!tool) return res.status(404).json({ message: "Tool not found" });
    tool.assignedTo = workerId;
    await tool.save();
    await tool.populate({ path: 'assignedTo', select: 'name _id' });
    res.status(200).json({ message: "Tool assigned", tool });
  } catch (error) {
    console.error("Error in assignTool controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Unassign tool
const unassignTool = async (req, res) => {
  try {
    const { id } = req.params;
    const tool = await Tool.findById(id);
    if (!tool) return res.status(404).json({ message: "Tool not found" });
    tool.assignedTo = null;
    await tool.save();
    res.status(200).json({ message: "Tool unassigned", tool });
  } catch (error) {
    console.error("Error in unassignTool controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const deleteTool = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Tool.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Tool not found" });
    res.status(200).json({ message: "Tool deleted" });
  } catch (error) {
    console.error("Error in deleteTool controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getAllTools,
  getToolById,
  createTool,
  updateTool,
  deleteTool,
  assignTool,
  unassignTool,
};
