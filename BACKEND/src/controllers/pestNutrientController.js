const PestNutrient = require("../models/pestNutrient");

const getAllPestNutrients = async (req, res) => {
  try {
    const pestNutrients = await PestNutrient.find().sort({ createdAt: -1 });
    res.status(200).json(pestNutrients);
  } catch (error) {
    console.error("Error in getAllPestNutrients controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getPestNutrientById = async (req, res) => {
  try {
    const { id } = req.params;
    const pestNutrient = await PestNutrient.findById(id);
    if (!pestNutrient) return res.status(404).json({ message: "Pest/Nutrient not found" });
    res.status(200).json(pestNutrient);
  } catch (error) {
    console.error("Error in getPestNutrientById controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const createPestNutrient = async (req, res) => {
  try {
    const { title, content } = req.body;
    const newPestNutrient = new PestNutrient({ title, content });
    await newPestNutrient.save();
    res.status(201).json({ message: "Pest/Nutrient created successfully", pestNutrient: newPestNutrient });
  } catch (error) {
    console.error("Error in createPestNutrient controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const updatePestNutrient = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedPestNutrient = await PestNutrient.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedPestNutrient) return res.status(404).json({ message: "Pest/Nutrient not found" });
    res.status(200).json({ message: "Pest/Nutrient updated", pestNutrient: updatedPestNutrient });
  } catch (error) {
    console.error("Error in updatePestNutrient controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const deletePestNutrient = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await PestNutrient.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Pest/Nutrient not found" });
    res.status(200).json({ message: "Pest/Nutrient deleted" });
  } catch (error) {
    console.error("Error in deletePestNutrient controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getAllPestNutrients,
  getPestNutrientById,
  createPestNutrient,
  updatePestNutrient,
  deletePestNutrient,
};
