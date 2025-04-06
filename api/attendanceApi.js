const exp = require('express');
const attendanceApp = exp.Router();

let attCollection;

attendanceApp.use((req, res, next) => {
  attCollection = req.app.get('attCollection');
  next();
});

// Create or initialize attendance for a user
attendanceApp.post('/init', async (req, res) => {
  const { email } = req.body;

  const existing = await attCollection.findOne({ email });
  if (existing) {
    return res.send({ message: 'Attendance already initialized for this user' });
  }

  const newAttendance = {
    email,
    attendancelogs: Array(365).fill(0),
    totalpresent: 0,
    totaldays: 0,
    holidays: 0,
    permittedleaves: 0,
  };

  await attCollection.insertOne(newAttendance);
  res.send({ message: 'Attendance initialized successfully' });
});

// Update attendance (e.g., mark a day as present)
attendanceApp.post('/mark', async (req, res) => {
  const { email, dayIndex, status } = req.body; // status: 0 = absent, 1 = present

  const user = await attCollection.findOne({ email });
  if (!user) return res.send({ message: 'User not found' });

  const logs = user.attendancelogs;
  if (logs[dayIndex] === status) {
    return res.send({ message: 'Attendance already marked as same status' });
  }

  // Update stats
  if (logs[dayIndex] === 1) user.totalpresent--;
  if (logs[dayIndex] !== -1) user.totaldays--; // -1 means uncounted like holiday

  logs[dayIndex] = status;

  if (status === 1) user.totalpresent++;
  if (status !== -1) user.totaldays++;

  await attCollection.updateOne(
    { email },
    {
      $set: {
        attendancelogs: logs,
        totalpresent: user.totalpresent,
        totaldays: user.totaldays,
      },
    }
  );

  res.send({ message: 'Attendance marked' });
});

// Get attendance report
attendanceApp.get('/report/:email', async (req, res) => {
  const email = req.params.email;
  const user = await attCollection.findOne({ email });

  if (!user) {
    return res.send({ message: 'User not found' });
  }

  res.send({
    email: user.email,
    totalpresent: user.totalpresent,
    totaldays: user.totaldays,
    holidays: user.holidays,
    permittedleaves: user.permittedleaves,
    attendancelogs: user.attendancelogs,
  });
});

module.exports = attendanceApp;