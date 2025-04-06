const express = require('express');
const app = express();
require('dotenv').config();
const mongoClient = require('mongodb').MongoClient;
const Razorpay = require('razorpay');
const cors = require('cors');
const path = require('path');

app.use(cors());
app.use(express.json());

const PORT = 4000;

// Razorpay instance
const razorpay = new Razorpay({
  key_id: 'rzp_test_x9VFXB0K2sj7ev',
  key_secret: 'Qu1w0cKbbd7Ermrz3WayFutN',
});

// MongoDB Connection
mongoClient.connect(process.env.DB_URL)
  .then((client) => {
    const db = client.db(process.env.DB_NAME);

    // Collections
    const usersCollection = db.collection('usersCollection');
    const adminCollection = db.collection('adminCollection');
    const securityCollection = db.collection('securityCollection');
    const roomCollection = db.collection('roomCollection');
    const attCollection = db.collection('attCollection');
    const paymentsCollection = db.collection('paymentsCollection');
    const mainCollection = db.collection('mainCollection');
    const lfCollection = db.collection('lfCollections');

    // Attach collections to app
    app.set('usersCollection', usersCollection);
    app.set('adminCollection', adminCollection);
    app.set('securityCollection', securityCollection);
    app.set('roomCollection', roomCollection);
    app.set('attCollection', attCollection);
    app.set('paymentsCollection', paymentsCollection);
    app.set('mainCollection', mainCollection);

    // ✅ Lost and Found Router
    const initLostAndFoundRoutes = require('./api/lfApi');
    app.use('/lost-items', initLostAndFoundRoutes(lfCollection));

    // ✅ API Routes
    app.use('/user-api', require('./api/userApi'));
    app.use('/admin-api', require('./api/adminApi'));
    app.use('/security-api', require('./api/securityApi'));
    app.use('/rooms-api', require('./api/roomsApi'));
    app.use('/attendance-api', require('./api/attendanceApi'));
    app.use('/leave-api', require('./api/leaveRequestApi'));

    // ✅ Save Payment Info
    app.post('/api/payments', async (req, res) => {
      try {
        const paymentData = req.body;
        paymentData.claimed = 'no';
        await paymentsCollection.insertOne(paymentData);
        res.send({ success: true });
      } catch (err) {
        console.error('❌ Payment Save Error:', err);
        res.status(500).send({ success: false, message: err.message });
      }
    });

    // ✅ Razorpay Order Creation
    app.post('/api/create-order', async (req, res) => {
      const { amount } = req.body;
      const options = {
        amount: amount * 100,
        currency: 'INR',
        receipt: 'receipt_' + Date.now(),
      };

      try {
        const order = await razorpay.orders.create(options);
        res.json(order);
      } catch (err) {
        console.error('❌ Razorpay Error:', err);
        res.status(500).json({ success: false, error: err.message });
      }
    });

    console.log('✅ DB Connection success');
  })
  .catch((err) => console.error('❌ DB Connection Failed:', err));

// Global Error Handler
app.use((err, req, res, next) => {
  res.status(500).send({ message: err.message });
});

// Start Server
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
