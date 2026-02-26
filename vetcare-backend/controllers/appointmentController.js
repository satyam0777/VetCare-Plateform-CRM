
const Appointment = require('../models/Appointment');
const createAppointment = async (req, res) => {
  try {
    const appointment = new Appointment(req.body);
    const saved = await appointment.save();
    res.status(201).json(saved); //  THIS IS IMPORTANT
  } catch (err) {
    console.error(" Failed to save appointment:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};
module.exports = { createAppointment };
