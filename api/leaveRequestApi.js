const express = require('express');
const leaveApp = express.Router();

// Middleware
leaveApp.use(express.json());

// POST /leaveRequests — Add leave to any document with a `leaveRequests` array
leaveApp.post('/leaveRequests', async (req, res) => {
  const leaveRequest = req.body;

  // Check if the body has all required fields (optional but nice)
  const requiredFields = ['email', 'reason', 'checkOutDate', 'checkInDate', 'approval', 'message'];
  const missing = requiredFields.filter(field => !leaveRequest[field]);

  if (missing.length > 0) {
    return res.status(400).json({ message: `Missing fields: ${missing.join(', ')}` });
  }

  const mainCollection = req.app.get('mainCollection');

  try {
    const result = await mainCollection.updateOne(
      { leaveRequests: { $exists: true } }, // Match any document with leaveRequests
      { $push: { leaveRequests: leaveRequest } }
    );

    if (result.modifiedCount === 1) {
      res.status(200).send({ message: '✅ Leave request added successfully.' });
    } else {
      res.status(404).send({ message: '❌ No document with leaveRequests array found.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: 'Internal server error', error: err.message });
  }
});
leaveApp.get('/leaveRequests', async (req, res) => {
    const mainCollection = req.app.get('mainCollection');
    try {
      const doc = await mainCollection.findOne({ leaveRequests: { $exists: true } });
      res.status(200).send({ leaveRequests: doc.leaveRequests });
    } catch (err) {
      res.status(500).send({ message: 'Error fetching leave requests' });
    }
  });
  leaveApp.put('/approve', async (req, res) => {
    const { email, checkOutDate, decision } = req.body; // decision: "accepted" or "rejected"
    const mainCollection = req.app.get('mainCollection');
  
    if (!['accepted', 'rejected'].includes(decision)) {
      return res.status(400).send({ message: 'Invalid decision type' });
    }
  
    try {
      const result = await mainCollection.updateOne(
        {
          leaveRequests: {
            $elemMatch: { email, checkOutDate },
          },
        },
        {
          $set: { "leaveRequests.$.approval": decision },
        }
      );
  
      if (result.modifiedCount === 1) {
        res.status(200).send({ message: `Leave request ${decision}` });
      } else {
        res.status(404).send({ message: 'Leave request not found' });
      }
    } catch (err) {
      res.status(500).send({ message: 'Server error', error: err.message });
    }
  });
  
    
module.exports = leaveApp;
