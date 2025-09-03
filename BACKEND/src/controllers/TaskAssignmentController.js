const Task = require("../../models/task");
const User = require("../../models/user");
const axios = require("axios");


const fetchWeather = async() => {
  try{
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) throw new Error('Weather API key missing');

    const res = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=6.95&lon=80.22&units=metric&appid=${apiKey}`);
    const data = res.data;

    const condition = data.weather[0]?.main || 'Unknown';
    const tempC = data.main?.temp ?? null;
    const humidity = data.main?.humidity ?? null;
    const windMs = data.wind?.speed ?? null;

    let workAllowed = true;
    const alerts = [];
    
    if (condition.includes('Rain') || condition.includes('Thunderstorm')) {
      workAllowed = false;
      alerts.push('Rain or storm expected - outdoor work not advised');
    }
    if (tempC > 35) {
      workAllowed = false;
      alerts.push('High temperature - heat stress risk');
    }
    if (windMs > 15) {
      alerts.push('Strong winds - caution advised');
    }
    
    return { condition, tempC, humidity, windMs, workAllowed, alerts };
  }catch(e){
    console.error('[WEATHER_FETCH] error:', e);
    return null;
  }
}


const createTask = async (req,resp) => {
  try{
    const { workerId, taskName, taskDescription, date } = req.body;

    if (!workerId || !taskName || !date) {
      return resp.status(400).json({ message: 'Worker ID, task name, and date are required' });
    }

    const worker = await User.findById(workerId);
    if (!worker || worker.role !== 'worker') {
      return resp.status(404).json({ message: 'Worker not found or invalid role' });
    }

    const existingTask = await Task.findOne({ workerId, date: new Date(date) });
    if (existingTask) {
      return resp.status(409).json({ message: 'Worker already has a task assigned for this date' });
    }

    const weather = await fetchWeather();
    if (!weather) {
      return resp.status(503).json({ message: 'Weather service unavailable - cannot assign task' });
    }

    if (!weather.workAllowed) {
      return resp.status(400).json({ message: 'Weather conditions are not suitable for task assignment' });
    }

    const task = new Task({
      workerId,
      assignedBy: req.user._id,
      taskName,
      taskDescription,
      date: new Date(date),
      weatherSnapshot: weather
    });
    
    await task.save();
    resp.status(201).json({ message: 'Task assigned successfully', task });

  }catch(e){
    console.error('[ASSIGN_TASK] error:', e);
    resp.status(500).json({ message: 'Server error' })
  }
}

// Get all tasks (with worker + supervisor details)
const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate("workerId", "name estate")
      .populate("assignedBy", "name role")
      .sort({ date: -1 });

    res.json(tasks);
  } catch (e) {
    console.error("[GET_TASKS] error:", e);
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
};


// Update task
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Task.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Task not found" });
    res.json(updated);
  } catch (e) {
    console.error("[UPDATE_TASK] error:", e);
    res.status(500).json({ message: "Failed to update task" });
  }
};

// Delete task
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Task.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Task not found" });
    res.json({ message: "Task deleted" });
  } catch (e) {
    console.error("[DELETE_TASK] error:", e);
    res.status(500).json({ message: "Failed to delete task" });
  }
};

module.exports = {
  createTask,
  getTasks,
  updateTask,
  deleteTask
}