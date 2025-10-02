
// const Appointment = require('../models/Appointment');
// const Doctor = require('../models/Doctor');
// const User = require('../models/User');

// exports.bookAppointment = async (req, res) => {
//   const { doctorId, date, time, petName, reason } = req.body;
//   try {
//     const appointment = new Appointment({
//       user: req.user,
//       doctor: doctorId,
//       date,
//       time,
//       petName,
//       reason,
//     });
//     await appointment.save();
//     res.status(201).json({ msg: 'Appointment booked successfully', appointment });
//   } catch (err) {
//     res.status(500).send('Server error');
//   }
// };

// exports.getUserAppointments = async (req, res) => {
//   try {
//     const appointments = await Appointment.find({ user: req.user })
//       .populate('doctor', 'name specialization')
//       .sort({ createdAt: -1 });
//     res.json(appointments);
//   } catch (err) {
//     res.status(500).send('Server error');
//   }
// };

// exports.getAllAppointments = async (req, res) => {
//   // You can add role-based filter here
//   try {
//     const appointments = await Appointment.find()
//       .populate('user', 'name email')
//       .populate('doctor', 'name specialization')
//       .sort({ createdAt: -1 });
//     res.json(appointments);
//   } catch (err) {
//     res.status(500).send('Server error');
//   }
// };

// const Appointment = require('../models/Appointment');

// const createAppointment = async (req, res) => {
//   try {
//     const appointment = new Appointment(req.body);
//     await appointment.save();
//     res.status(201).json(appointment);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// module.exports = { createAppointment };
const Appointment = require('../models/Appointment');

// const createAppointment = async (req, res) => {
//   try {
//     const appointment = new Appointment(req.body);
//     await appointment.save();
//     res.status(201).json(appointment);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// module.exports = { createAppointment };
// Example: POST /api/appointments
const createAppointment = async (req, res) => {
  // try {
  //   const appointment = new Appointment(req.body);
  //   const saved = await appointment.save();
  //   res.status(201).json(saved); // ✅ must send status 201
  // } catch (err) {
  //   console.error("Failed to save appointment:", err.message);
  //   res.status(500).json({ message: "Failed to book appointment" });
  // }
  try {
    const appointment = new Appointment(req.body);
    const saved = await appointment.save();
    res.status(201).json(saved); // ✅ THIS IS IMPORTANT
  } catch (err) {
    console.error("❌ Failed to save appointment:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};
module.exports = { createAppointment };
