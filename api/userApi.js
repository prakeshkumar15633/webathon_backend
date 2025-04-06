const exp = require('express');
const userApp = exp.Router();
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');

let usersCollection;
let mainCollection;

userApp.use((req, res, next) => {
    usersCollection = req.app.get('usersCollection');
    mainCollection = req.app.get('mainCollection');
    next();
});

userApp.use(exp.json());

function remove(obj, st) {
    let keys = Object.keys(obj);
    keys = keys.filter(obj => obj !== st);
    let newObj = {};
    keys.map((key) => {
        newObj[key] = obj[key];
    });
    return newObj;
}

// Register user
userApp.post('/user', async (req, res) => {
    let userObj = req.body;
    let resObj = await usersCollection.findOne({ email: userObj.email });
    if (resObj == null) {
        let hashedPassword = await bcryptjs.hash(userObj.password, 6);
        userObj.password = hashedPassword;
        await usersCollection.insertOne(userObj);
        res.send({ message: 'User created' });
    } else {
        res.send({ message: 'Username already exists' });
    }
});

// Login user
userApp.post('/login', async (req, res) => {
    let userObj = req.body;
    let resObj = await usersCollection.findOne({ email: userObj.email });
    if (resObj == null) {
        res.send({ message: 'Invalid username' });
    } else {
        let hashObj = await bcryptjs.compare(userObj.password, resObj.password);
        if (hashObj) {
            let signedToken = jwt.sign({ email: userObj.email }, process.env.SECRET_KEY, { expiresIn: '1d' });
            res.send({
                message: 'Login successful',
                token: signedToken,
                payload: resObj
            });
        } else {
            res.send({ message: 'Invalid password' });
        }
    }
});

// Submit complaint
userApp.post('/complaints', async (req, res) => {
    try {
        const { category, description, roomNo, urgency } = req.body;

        if (!category || !description || !roomNo || !urgency) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        const complaint = {
            category,
            description,
            roomNo,
            urgency,
            createdAt: new Date()
        };

        const targetId = new ObjectId('67f16a23b612bec0977b768e');

        const updateResult = await mainCollection.updateOne(
            { _id: targetId },
            { $push: { complaints: complaint } }
        );

        if (updateResult.matchedCount === 0) {
            return res.status(404).json({ message: 'Main document not found.' });
        }

        res.status(200).json({
            message: 'Complaint submitted successfully.',
            complaint
        });

    } catch (err) {
        console.error('Error in /complaints:', err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// Submit feedback
userApp.post('/feedback', async (req, res) => {
    try {
        const { taste, quality, hygiene, services, suggestions } = req.body;

        if (
            typeof taste !== 'number' ||
            typeof quality !== 'number' ||
            typeof hygiene !== 'number' ||
            typeof services !== 'number'
        ) {
            return res.status(400).json({ message: 'Invalid or missing fields in feedback.' });
        }

        const feedbackObj = {
            taste,
            quality,
            hygiene,
            services,
            suggestions: suggestions || '',
            date: new Date()
        };

        const docId = new ObjectId('67f16a23b612bec0977b768e');

        const updateResult = await mainCollection.updateOne(
            { _id: docId },
            { $push: { feedback: feedbackObj } }
        );

        if (updateResult.modifiedCount === 0) {
            return res.status(404).json({ message: 'Main document not found.' });
        }

        res.status(200).json({
            message: 'Feedback submitted successfully.',
            feedback: feedbackObj
        });

    } catch (err) {
        console.error("Error posting feedback:", err);
        res.status(500).json({ message: "Internal server error", error: err.message });
    }
});

module.exports = userApp;
