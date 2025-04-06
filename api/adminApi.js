const exp = require('express');
const adminApp = exp.Router();
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');

let adminCollection;
let mainCollection; // For complaints and feedback

// Middleware to initialize collections
adminApp.use((req, res, next) => {
    adminCollection = req.app.get('adminCollection');
    mainCollection = req.app.get('mainCollection');
    next();
});

// Utility to remove a field from an object
function remove(obj, st) {
    let keys = Object.keys(obj).filter(key => key !== st);
    let newObj = {};
    keys.forEach(key => {
        newObj[key] = obj[key];
    });
    return newObj;
}

adminApp.use(exp.json());

// POST: Admin login
adminApp.post('/login', async (req, res) => {
    try {
        const userObj = req.body;
        const resObj = await adminCollection.findOne({ email: userObj.email });

        if (!resObj) {
            return res.send({ message: 'Invalid email' });
        }

        const isMatch = await bcryptjs.compare(userObj.password, resObj.password);

        if (isMatch) {
            const signedToken = jwt.sign(
                { email: userObj.email },
                process.env.SECRET_KEY,
                { expiresIn: '1d' }
            );
            return res.send({
                message: 'Login successful',
                token: signedToken,
                payload: resObj
            });
        } else {
            return res.send({ message: 'Invalid password' });
        }
    } catch (err) {
        console.error("Login error:", err);
        return res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// GET: Complaints from specific document
adminApp.get('/complaints', async (req, res) => {
    try {
        const docId = "67f16a23b612bec0977b768e"; // Hardcoded ObjectId
        const document = await mainCollection.findOne({ _id: new ObjectId(docId) });

        if (!document) {
            return res.status(404).json({ message: "Document not found" });
        }

        const complaints = document.complaints || [];

        res.status(200).json({
            message: "Complaints fetched successfully",
            count: complaints.length,
            complaints: complaints
        });

    } catch (err) {
        console.error("Error fetching complaints:", err);
        res.status(500).json({
            message: "Error retrieving complaints",
            error: err.message
        });
    }
});

// GET: Feedback from specific document
adminApp.get('/feedback', async (req, res) => {
    try {
        const docId = "67f16a23b612bec0977b768e"; // Hardcoded ObjectId
        const document = await mainCollection.findOne({ _id: new ObjectId(docId) });

        if (!document) {
            return res.status(404).json({ message: "Document not found" });
        }

        const feedback = document.feedback || [];

        res.status(200).json({
            message: "Feedback fetched successfully",
            count: feedback.length,
            feedback: feedback
        });

    } catch (err) {
        console.error("Error fetching feedback:", err);
        res.status(500).json({
            message: "Error retrieving feedback",
            error: err.message
        });
    }
});

module.exports = adminApp;
