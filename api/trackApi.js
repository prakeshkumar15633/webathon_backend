const exp = require('express');
const trackApp = exp.Router();

let trackCollection;

trackApp.use((req, res, next) => {
  trackCollection = req.app.get('trackCollection');
  next();
});

// Check if user is already registered
trackApp.get('/status/:email', async (req, res) => {
  const email = req.params.email;
  const user = await trackCollection.findOne({ email });
  res.send({ exists: !!user, user });
});

// Register new user with descriptors and status
trackApp.post('/register', async (req, res) => {
  const { email, value, status } = req.body;

  if (!email || !value || !status) {
    return res.status(400).send({ message: 'Missing required fields' });
  }

  const exists = await trackCollection.findOne({ email });
  if (exists) return res.send({ message: 'User already registered' });

  await trackCollection.insertOne({ email, value, status });
  res.send({ message: 'User registered in DB' });
});

// Update check-in/out status
trackApp.put('/status', async (req, res) => {
  const { email, status } = req.body;

  if (!email || !status) {
    return res.status(400).send({ message: 'Missing email or status' });
  }

  await trackCollection.updateOne({ email }, { $set: { status } });
  res.send({ message: 'Status updated' });
});

module.exports = trackApp;