const Tool = require("../models/tool");

const getAllTools = async (req, res) => {
  try {
    const tools = await Tool.find().sort({ createdAt: -1 });
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
    const { name, quantity, description } = req.body;
    const newTool = new Tool({ name, quantity, description });
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
    const updatedTool = await Tool.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedTool) return res.status(404).json({ message: "Tool not found" });
    res.status(200).json({ message: "Tool updated", tool: updatedTool });
  } catch (error) {
    console.error("Error in updateTool controller:", error);
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
};
